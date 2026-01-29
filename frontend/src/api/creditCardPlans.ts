import apiClient from "./client"
import type {
  CreditCardPaymentPlan,
  CreditCardPaymentPlanRequest,
  CreditCardPayment,
  UpcomingPayment,
  PaymentPlanStatus,
  PaymentType,
  PageResponse,
} from "@/types"

export const creditCardPlansApi = {
  getAll: async (
    page = 0,
    size = 20,
    status?: PaymentPlanStatus,
    paymentType?: PaymentType
  ): Promise<PageResponse<CreditCardPaymentPlan>> => {
    const params = new URLSearchParams()
    params.set("page", page.toString())
    params.set("size", size.toString())
    if (status) params.set("status", status)
    if (paymentType) params.set("paymentType", paymentType)

    const { data } = await apiClient.get(`/credit-card-plans?${params.toString()}`)
    return data
  },

  getById: async (id: string): Promise<CreditCardPaymentPlan> => {
    const { data } = await apiClient.get(`/credit-card-plans/${id}`)
    return data
  },

  create: async (request: CreditCardPaymentPlanRequest): Promise<CreditCardPaymentPlan> => {
    const { data } = await apiClient.post("/credit-card-plans", request)
    return data
  },

  markPaymentAsPaid: async (planId: string, paymentId: string): Promise<CreditCardPayment> => {
    const { data } = await apiClient.post(`/credit-card-plans/${planId}/payments/${paymentId}/pay`)
    return data
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/credit-card-plans/${id}`)
  },

  getUpcoming: async (days = 30): Promise<UpcomingPayment[]> => {
    const { data } = await apiClient.get(`/credit-card-plans/upcoming?days=${days}`)
    return data
  },
}
