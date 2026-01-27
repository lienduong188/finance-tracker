import apiClient from "./client"
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/types"

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>("/auth/register", data)
    return response.data
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    })
    return response.data
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<AuthResponse>("/auth/me")
    const data = response.data
    return {
      id: data.userId,
      email: data.email,
      fullName: data.fullName,
      defaultCurrency: data.defaultCurrency || "VND",
      role: data.role || "USER",
      createdAt: new Date().toISOString(),
    }
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.get<{ message: string }>(`/auth/verify-email?token=${token}`)
    return response.data
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>("/auth/resend-verification", { email })
    return response.data
  },
}
