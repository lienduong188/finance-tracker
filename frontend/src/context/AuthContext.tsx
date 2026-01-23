import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { authApi } from "@/api"
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken")
      if (token) {
        try {
          const userData = await authApi.me()
          setUser(userData)
        } catch {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const handleAuthResponse = (response: AuthResponse) => {
    localStorage.setItem("accessToken", response.accessToken)
    localStorage.setItem("refreshToken", response.refreshToken)
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

  const register = async (data: RegisterRequest) => {
    const response = await authApi.register(data)
    handleAuthResponse(response)
  }

  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
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
