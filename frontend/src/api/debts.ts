import apiClient from "./client"
import type {
  Debt,
  DebtRequest,
  DebtPaymentRequest,
  DebtSummary,
  DebtType,
  DebtStatus,
  PageResponse,
} from "@/types"

export const debtsApi = {
  getAll: async (
    page = 0,
    size = 20,
    type?: DebtType,
    status?: DebtStatus
  ): Promise<PageResponse<Debt>> => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("size", size.toString())
    if (type) params.set("type", type)
    if (status) params.set("status", status)

    const { data } = await apiClient.get(`/debts?${params.toString()}`)
    return data
  },

  getById: async (id: string): Promise<Debt> => {
    const { data } = await apiClient.get(`/debts/${id}`)
    return data
  },

  create: async (request: DebtRequest): Promise<Debt> => {
    const { data } = await apiClient.post("/debts", request)
    return data
  },

  update: async (id: string, request: DebtRequest): Promise<Debt> => {
    const { data } = await apiClient.put(`/debts/${id}`, request)
    return data
  },

  recordPayment: async (id: string, request: DebtPaymentRequest): Promise<Debt> => {
    const { data } = await apiClient.post(`/debts/${id}/payment`, request)
    return data
  },

  markAsPaid: async (id: string): Promise<Debt> => {
    const { data } = await apiClient.post(`/debts/${id}/mark-paid`)
    return data
  },

  cancel: async (id: string): Promise<Debt> => {
    const { data } = await apiClient.post(`/debts/${id}/cancel`)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/debts/${id}`)
  },

  getSummary: async (): Promise<DebtSummary> => {
    const { data } = await apiClient.get("/debts/summary")
    return data
  },

  getOverdue: async (): Promise<Debt[]> => {
    const { data } = await apiClient.get("/debts/overdue")
    return data
  },
}
