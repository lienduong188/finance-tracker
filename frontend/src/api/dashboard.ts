import apiClient from "./client"
import type { CashflowReport, CategoryReport, DashboardSummary, TransactionType } from "@/types"

export const dashboardApi = {
  getSummary: async (currency: string = "VND"): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>(
      `/dashboard/summary?currency=${currency}`
    )
    return response.data
  },

  getCashflow: async (startDate: string, endDate: string): Promise<CashflowReport> => {
    const response = await apiClient.get<CashflowReport>(
      `/dashboard/cashflow?startDate=${startDate}&endDate=${endDate}`
    )
    return response.data
  },

  getCategoryReport: async (
    type: TransactionType,
    startDate: string,
    endDate: string
  ): Promise<CategoryReport> => {
    const response = await apiClient.get<CategoryReport>(
      `/dashboard/by-category?type=${type}&startDate=${startDate}&endDate=${endDate}`
    )
    return response.data
  },
}
