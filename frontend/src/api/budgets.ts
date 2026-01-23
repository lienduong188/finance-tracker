import apiClient from "./client"
import type { Budget, BudgetRequest } from "@/types"

export const budgetsApi = {
  getAll: async (): Promise<Budget[]> => {
    const response = await apiClient.get<Budget[]>("/budgets")
    return response.data
  },

  getById: async (id: string): Promise<Budget> => {
    const response = await apiClient.get<Budget>(`/budgets/${id}`)
    return response.data
  },

  create: async (data: BudgetRequest): Promise<Budget> => {
    const response = await apiClient.post<Budget>("/budgets", data)
    return response.data
  },

  update: async (id: string, data: BudgetRequest): Promise<Budget> => {
    const response = await apiClient.put<Budget>(`/budgets/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/budgets/${id}`)
  },
}
