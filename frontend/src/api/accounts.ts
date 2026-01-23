import apiClient from "./client"
import type { Account, AccountRequest } from "@/types"

export const accountsApi = {
  getAll: async (): Promise<Account[]> => {
    const response = await apiClient.get<Account[]>("/accounts")
    return response.data
  },

  getById: async (id: string): Promise<Account> => {
    const response = await apiClient.get<Account>(`/accounts/${id}`)
    return response.data
  },

  create: async (data: AccountRequest): Promise<Account> => {
    const response = await apiClient.post<Account>("/accounts", data)
    return response.data
  },

  update: async (id: string, data: AccountRequest): Promise<Account> => {
    const response = await apiClient.put<Account>(`/accounts/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`)
  },
}
