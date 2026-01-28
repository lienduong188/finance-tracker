import apiClient from "./client"
import type {
  SavingsGoal,
  SavingsGoalRequest,
  SavingsContribution,
  SavingsContributionRequest,
  ContributorSummary,
} from "@/types"

export const savingsGoalsApi = {
  getAll: async (): Promise<SavingsGoal[]> => {
    const response = await apiClient.get<SavingsGoal[]>("/savings-goals")
    return response.data
  },

  getById: async (id: string): Promise<SavingsGoal> => {
    const response = await apiClient.get<SavingsGoal>(`/savings-goals/${id}`)
    return response.data
  },

  create: async (data: SavingsGoalRequest): Promise<SavingsGoal> => {
    const response = await apiClient.post<SavingsGoal>("/savings-goals", data)
    return response.data
  },

  update: async (id: string, data: SavingsGoalRequest): Promise<SavingsGoal> => {
    const response = await apiClient.put<SavingsGoal>(`/savings-goals/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/savings-goals/${id}`)
  },

  contribute: async (id: string, data: SavingsContributionRequest): Promise<SavingsContribution> => {
    const response = await apiClient.post<SavingsContribution>(`/savings-goals/${id}/contribute`, data)
    return response.data
  },

  getContributions: async (id: string): Promise<SavingsContribution[]> => {
    const response = await apiClient.get<SavingsContribution[]>(`/savings-goals/${id}/contributions`)
    return response.data
  },

  getContributors: async (id: string): Promise<ContributorSummary[]> => {
    const response = await apiClient.get<ContributorSummary[]>(`/savings-goals/${id}/contributors`)
    return response.data
  },
}
