import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, Input, Select } from "@/components/ui"
import { useExchangeRate } from "@/hooks/useExchangeRates"
import { formatCurrency } from "@/lib/utils"

interface ExchangeRateCardProps {
  baseCurrency?: string
}

const CURRENCIES = ["VND", "JPY", "USD", "EUR"]
const DISPLAY_CURRENCIES = ["VND", "JPY", "EUR"] // Order for rate list display

// Component to display a single rate item
function RateItem({ from, to, formatRate, onUpdatedAt }: {
  from: string;
  to: string;
  formatRate: (rate: number, currency: string) => string;
  onUpdatedAt?: (updatedAt: string) => void;
}) {
  const { data, isLoading } = useExchangeRate(from, to)

  // Report updatedAt to parent when data is available
  if (data?.updatedAt && onUpdatedAt) {
    onUpdatedAt(data.updatedAt)
  }

  if (isLoading) return <div className="h-10 animate-pulse rounded-lg bg-muted" />
  if (!data) return null
  return (
    <div className="flex items-center justify-between rounded-lg border p-2.5">
      <span className="font-medium">{to}</span>
      <span className="font-mono text-sm">{formatRate(data.rate, to)}</span>
    </div>
  )
}

export function ExchangeRateCard({ baseCurrency = "USD" }: ExchangeRateCardProps) {
  const { t } = useTranslation()

  // Converter state
  const [amount, setAmount] = useState<string>("1")
  const [fromCurrency, setFromCurrency] = useState("JPY")
  const [toCurrency, setToCurrency] = useState("VND")
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

  const { data: rateData } = useExchangeRate(fromCurrency, toCurrency)

  const convertedAmount = useMemo(() => {
    const num = parseFloat(amount) || 0
    if (!rateData?.rate) return 0
    return num * rateData.rate
  }, [amount, rateData?.rate])

  const handleSwap = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }

  const formatRate = (rate: number, currency: string) => {
    if (currency === "VND" || currency === "JPY") {
      return rate.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }
    return rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  }

  const formatUpdatedAt = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-base">{t("exchangeRates.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        {/* Quick Converter */}
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">{t("exchangeRates.converter")}</p>

          {/* From */}
          <div className="flex gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 text-right font-mono"
              min={0}
            />
            <Select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-24"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              className="rounded-full border bg-background p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>

          {/* To */}
          <div className="flex gap-2">
            <div className="flex-1 rounded-md border bg-background px-3 py-2 text-right font-mono">
              {formatCurrency(convertedAmount, toCurrency)}
            </div>
            <Select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-24"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          {rateData && (
            <p className="text-center text-xs text-muted-foreground">
              1 {fromCurrency} = {formatRate(rateData.rate, toCurrency)} {toCurrency}
            </p>
          )}
        </div>

        {/* Rate List */}
        <div className="space-y-2">
          {DISPLAY_CURRENCIES.map((currency) => (
            <RateItem
              key={currency}
              from={baseCurrency}
              to={currency}
              formatRate={formatRate}
              onUpdatedAt={setLastUpdatedAt}
            />
          ))}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("exchangeRates.base")}: 1 {baseCurrency}</span>
            {lastUpdatedAt && (
              <span>{t("exchangeRates.updatedAt")}: {formatUpdatedAt(lastUpdatedAt)}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
