import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import type { ApiError } from "@/types"

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest) {
      const refreshToken = localStorage.getItem("refreshToken")

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data
          localStorage.setItem("accessToken", accessToken)
          localStorage.setItem("refreshToken", newRefreshToken)

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return apiClient(originalRequest)
        } catch {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          window.location.href = "/login"
        }
      } else {
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
