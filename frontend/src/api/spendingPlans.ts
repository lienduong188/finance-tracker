import apiClient from "./client"
import type {
  SpendingPlan,
  SpendingPlanRequest,
  SpendingPlanDetail,
  SpendingPlanItem,
  SpendingPlanItemRequest,
  SpendingPlanExpense,
  SpendingPlanExpenseRequest,
  SpendingPlanStatus,
} from "@/types"

export const spendingPlansApi = {
  // Plan CRUD
  getAll: async (): Promise<SpendingPlan[]> => {
    const response = await apiClient.get<SpendingPlan[]>("/spending-plans")
    return response.data
  },

  getById: async (id: string): Promise<SpendingPlanDetail> => {
    const response = await apiClient.get<SpendingPlanDetail>(`/spending-plans/${id}`)
    return response.data
  },

  create: async (data: SpendingPlanRequest): Promise<SpendingPlan> => {
    const response = await apiClient.post<SpendingPlan>("/spending-plans", data)
    return response.data
  },

  update: async (id: string, data: SpendingPlanRequest): Promise<SpendingPlan> => {
    const response = await apiClient.put<SpendingPlan>(`/spending-plans/${id}`, data)
    return response.data
  },

  updateStatus: async (id: string, status: SpendingPlanStatus): Promise<SpendingPlan> => {
    const response = await apiClient.patch<SpendingPlan>(`/spending-plans/${id}/status?status=${status}`)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/spending-plans/${id}`)
  },

  // Item CRUD
  addItem: async (planId: string, data: SpendingPlanItemRequest): Promise<SpendingPlanItem> => {
    const response = await apiClient.post<SpendingPlanItem>(`/spending-plans/${planId}/items`, data)
    return response.data
  },

  getItems: async (planId: string): Promise<SpendingPlanItem[]> => {
    const response = await apiClient.get<SpendingPlanItem[]>(`/spending-plans/${planId}/items`)
    return response.data
  },

  updateItem: async (planId: string, itemId: string, data: SpendingPlanItemRequest): Promise<SpendingPlanItem> => {
    const response = await apiClient.put<SpendingPlanItem>(`/spending-plans/${planId}/items/${itemId}`, data)
    return response.data
  },

  deleteItem: async (planId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/spending-plans/${planId}/items/${itemId}`)
  },

  // Expense CRUD
  recordExpense: async (planId: string, itemId: string, data: SpendingPlanExpenseRequest): Promise<SpendingPlanExpense> => {
    const response = await apiClient.post<SpendingPlanExpense>(`/spending-plans/${planId}/items/${itemId}/expenses`, data)
    return response.data
  },

  getItemExpenses: async (planId: string, itemId: string): Promise<SpendingPlanExpense[]> => {
    const response = await apiClient.get<SpendingPlanExpense[]>(`/spending-plans/${planId}/items/${itemId}/expenses`)
    return response.data
  },

  getAllExpenses: async (planId: string): Promise<SpendingPlanExpense[]> => {
    const response = await apiClient.get<SpendingPlanExpense[]>(`/spending-plans/${planId}/expenses`)
    return response.data
  },

  deleteExpense: async (planId: string, itemId: string, expenseId: string): Promise<void> => {
    await apiClient.delete(`/spending-plans/${planId}/items/${itemId}/expenses/${expenseId}`)
  },
}
