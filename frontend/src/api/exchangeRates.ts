import apiClient from "./client"

export interface ExchangeRate {
  fromCurrency: string
  toCurrency: string
  rate: number
  date: string
  source: string
  updatedAt: string
}

export interface ExchangeRates {
  baseCurrency: string
  date: string
  rates: Record<string, number>
  source: string
}

export interface ConvertResult {
  fromAmount: number
  fromCurrency: string
  toAmount: number
  toCurrency: string
  rate: number
  date: string
}

export const exchangeRatesApi = {
  getLatest: async (from: string, to: string): Promise<ExchangeRate> => {
    const response = await apiClient.get<ExchangeRate>(
      `/exchange-rates/latest?from=${from}&to=${to}`
    )
    return response.data
  },

  getAllRates: async (base: string = "VND"): Promise<ExchangeRates> => {
    const response = await apiClient.get<ExchangeRates>(
      `/exchange-rates/all?base=${base}`
    )
    return response.data
  },

  convert: async (amount: number, from: string, to: string): Promise<ConvertResult> => {
    const response = await apiClient.get<ConvertResult>(
      `/exchange-rates/convert?amount=${amount}&from=${from}&to=${to}`
    )
    return response.data
  },

  getSupportedCurrencies: async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`/exchange-rates/currencies`)
    return response.data
  },

  refresh: async (): Promise<void> => {
    await apiClient.post(`/exchange-rates/refresh`)
  },
}
