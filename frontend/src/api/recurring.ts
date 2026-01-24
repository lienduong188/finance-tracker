import apiClient from "./client"
import type {
  PageResponse,
  RecurringTransaction,
  RecurringTransactionRequest,
  RecurringStatus,
  UpcomingTransaction,
} from "@/types"

interface RecurringFilters {
  page?: number
  size?: number
  status?: RecurringStatus
}

export const recurringApi = {
  getAll: async (filters: RecurringFilters = {}): Promise<PageResponse<RecurringTransaction>> => {
    const params = new URLSearchParams()
    if (filters.page !== undefined) params.append("page", filters.page.toString())
    if (filters.size !== undefined) params.append("size", filters.size.toString())
    if (filters.status) params.append("status", filters.status)

    const response = await apiClient.get<PageResponse<RecurringTransaction>>(
      `/recurring-transactions?${params}`
    )
    return response.data
  },

  getById: async (id: string): Promise<RecurringTransaction> => {
    const response = await apiClient.get<RecurringTransaction>(`/recurring-transactions/${id}`)
    return response.data
  },

  create: async (data: RecurringTransactionRequest): Promise<RecurringTransaction> => {
    const response = await apiClient.post<RecurringTransaction>("/recurring-transactions", data)
    return response.data
  },

  update: async (id: string, data: RecurringTransactionRequest): Promise<RecurringTransaction> => {
    const response = await apiClient.put<RecurringTransaction>(`/recurring-transactions/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/recurring-transactions/${id}`)
  },

  pause: async (id: string): Promise<RecurringTransaction> => {
    const response = await apiClient.post<RecurringTransaction>(
      `/recurring-transactions/${id}/pause`
    )
    return response.data
  },

  resume: async (id: string): Promise<RecurringTransaction> => {
    const response = await apiClient.post<RecurringTransaction>(
      `/recurring-transactions/${id}/resume`
    )
    return response.data
  },

  cancel: async (id: string): Promise<RecurringTransaction> => {
    const response = await apiClient.post<RecurringTransaction>(
      `/recurring-transactions/${id}/cancel`
    )
    return response.data
  },

  getUpcoming: async (days = 30): Promise<UpcomingTransaction[]> => {
    const response = await apiClient.get<UpcomingTransaction[]>(
      `/recurring-transactions/upcoming?days=${days}`
    )
    return response.data
  },
}
