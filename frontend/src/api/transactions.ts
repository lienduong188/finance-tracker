import apiClient from "./client"
import type { PageResponse, Transaction, TransactionRequest } from "@/types"

interface TransactionFilters {
  page?: number
  size?: number
  accountId?: string
  categoryId?: string
  type?: string
  startDate?: string
  endDate?: string
}

export const transactionsApi = {
  getAll: async (filters: TransactionFilters = {}): Promise<PageResponse<Transaction>> => {
    const params = new URLSearchParams()
    if (filters.page !== undefined) params.append("page", filters.page.toString())
    if (filters.size !== undefined) params.append("size", filters.size.toString())
    if (filters.accountId) params.append("accountId", filters.accountId)
    if (filters.categoryId) params.append("categoryId", filters.categoryId)
    if (filters.type) params.append("type", filters.type)

    const response = await apiClient.get<PageResponse<Transaction>>(`/transactions?${params}`)
    return response.data
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<Transaction[]> => {
    const response = await apiClient.get<Transaction[]>(
      `/transactions/range?startDate=${startDate}&endDate=${endDate}`
    )
    return response.data
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`)
    return response.data
  },

  create: async (data: TransactionRequest): Promise<Transaction> => {
    const response = await apiClient.post<Transaction>("/transactions", data)
    return response.data
  },

  update: async (id: string, data: TransactionRequest): Promise<Transaction> => {
    const response = await apiClient.put<Transaction>(`/transactions/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`)
  },
}
