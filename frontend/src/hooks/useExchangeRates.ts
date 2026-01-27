import { useQuery } from "@tanstack/react-query"
import { exchangeRatesApi } from "@/api"

export function useExchangeRate(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ["exchange-rate", from, to],
    queryFn: () => exchangeRatesApi.getLatest(from, to),
    enabled: enabled && from !== to && !!from && !!to,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useAllExchangeRates(base: string = "VND") {
  return useQuery({
    queryKey: ["exchange-rates", base],
    queryFn: () => exchangeRatesApi.getAllRates(base),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useSupportedCurrencies() {
  return useQuery({
    queryKey: ["supported-currencies"],
    queryFn: () => exchangeRatesApi.getSupportedCurrencies(),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}
