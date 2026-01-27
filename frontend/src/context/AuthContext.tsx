import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { authApi } from "@/api"
import { logoutApi } from "@/api/client"
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types"

// Session timeout: 30 minutes in milliseconds
const SESSION_TIMEOUT = 30 * 60 * 1000
const LAST_ACTIVITY_KEY = "lastActivity"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<{ message: string }>
  logout: () => Promise<void>
  resetActivity: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset activity timestamp
  const resetActivity = useCallback(() => {
    if (user) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    }
  }, [user])

  // Check if session has expired
  const checkSessionExpired = useCallback(() => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10)
      return elapsed > SESSION_TIMEOUT
    }
    return false
  }, [])

  // Auto logout when session expires
  const startSessionTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
    const lastActivityTime = lastActivity ? parseInt(lastActivity, 10) : Date.now()
    const elapsed = Date.now() - lastActivityTime
    const remaining = Math.max(SESSION_TIMEOUT - elapsed, 0)

    timeoutRef.current = setTimeout(async () => {
      console.log("Session expired due to inactivity")
      await logoutApi()
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem(LAST_ACTIVITY_KEY)
      setUser(null)
      window.location.href = "/login?expired=true"
    }, remaining)
  }, [])

  // Listen for user activity
  useEffect(() => {
    if (!user) return

    const events = ["mousedown", "keydown", "scroll", "touchstart"]

    const handleActivity = () => {
      resetActivity()
      startSessionTimer()
    }

    // Set initial activity
    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    }

    // Start timer
    startSessionTimer()

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [user, resetActivity, startSessionTimer])

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken")
      if (token) {
        // Check if session expired before trying to restore
        if (checkSessionExpired()) {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem(LAST_ACTIVITY_KEY)
          setIsLoading(false)
          return
        }

        try {
          const userData = await authApi.me()
          setUser(userData)
        } catch {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          localStorage.removeItem(LAST_ACTIVITY_KEY)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [checkSessionExpired])

  const handleAuthResponse = (response: AuthResponse) => {
    localStorage.setItem("accessToken", response.accessToken)
    localStorage.setItem("refreshToken", response.refreshToken)
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    setUser({
      id: response.userId,
      email: response.email,
      fullName: response.fullName,
      defaultCurrency: response.defaultCurrency || "VND",
      role: response.role || "USER",
      createdAt: new Date().toISOString(),
    })
  }

  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data)
    handleAuthResponse(response)
  }

  const register = async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await authApi.register(data)
    // Don't auto-login - user needs to verify email first
    return response
  }

  const logout = async () => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // Call logout API to revoke refresh token
    await logoutApi()
    // Clear local storage
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem(LAST_ACTIVITY_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "ADMIN",
        isLoading,
        login,
        register,
        logout,
        resetActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
