import { useTranslation } from "react-i18next"
import { RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { useAllExchangeRates } from "@/hooks/useExchangeRates"

interface ExchangeRateCardProps {
  baseCurrency?: string
}

const currencyFlags: Record<string, string> = {
  VND: "VN",
  USD: "US",
  EUR: "EU",
  JPY: "JP",
  KRW: "KR",
  GBP: "GB",
}

export function ExchangeRateCard({ baseCurrency = "VND" }: ExchangeRateCardProps) {
  const { t } = useTranslation()
  const { data, isLoading, refetch, isFetching } = useAllExchangeRates(baseCurrency)

  const formatRate = (rate: number, toCurrency: string) => {
    // VND and JPY don't use decimals
    if (toCurrency === "VND" || toCurrency === "JPY") {
      return rate.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }
    return rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-base">{t("exchangeRates.title")}</CardTitle>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          title={t("exchangeRates.refresh")}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : data && Object.keys(data.rates).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(data.rates).map(([currency, rate]) => (
              <div
                key={currency}
                className="flex items-center justify-between rounded-lg border p-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {currencyFlags[currency] || ""}
                  </span>
                  <span className="font-medium">{currency}</span>
                </div>
                <span className="font-mono text-sm">
                  {formatRate(rate, currency)}
                </span>
              </div>
            ))}
            <p className="mt-3 text-xs text-muted-foreground">
              {t("exchangeRates.base")}: 1 {baseCurrency}
              {data.source && (
                <span className="ml-2">• {data.source}</span>
              )}
            </p>
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t("exchangeRates.noData")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
