import apiClient from "./client"
import type { ChangePasswordRequest, DeleteAccountRequest, RestoreAccountRequest, UpdateProfileRequest, User } from "@/types"

export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>("/users/profile")
    return response.data
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.put<User>("/users/profile", data)
    return response.data
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.put("/users/password", data)
  },

  deleteAccount: async (data: DeleteAccountRequest): Promise<void> => {
    await apiClient.delete("/users/account", { data })
  },

  restoreAccount: async (data: RestoreAccountRequest): Promise<void> => {
    await apiClient.post("/users/account/restore", data)
  },
}
