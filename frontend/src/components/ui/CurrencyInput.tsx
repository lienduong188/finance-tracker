import * as React from "react"
import { cn } from "@/lib/utils"

// Currencies that use period as thousand separator (e.g., VND: 1.000.000)
const periodSeparatorCurrencies = ["VND"]

function formatNumberForDisplay(value: number, currency: string): string {
  if (isNaN(value) || value === 0) return ""

  // Determine separator based on currency
  const usePeriod = periodSeparatorCurrencies.includes(currency)

  if (usePeriod) {
    // VND style: 1.000.000
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  } else {
    // USD/JPY/EUR style: 1,000,000
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }
}

function parseFormattedNumber(value: string, currency: string): number {
  if (!value) return 0
  const usePeriod = periodSeparatorCurrencies.includes(currency)

  // Remove thousand separators
  const cleanValue = usePeriod
    ? value.replace(/\./g, "")
    : value.replace(/,/g, "")

  const num = parseInt(cleanValue, 10)
  return isNaN(num) ? 0 : num
}

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  error?: string
  currency?: string
  value?: number
  onChange?: (value: number) => void
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, error, currency = "VND", value, onChange, onBlur, onFocus, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("")
    const [isFocused, setIsFocused] = React.useState(false)
    const internalRef = React.useRef<HTMLInputElement>(null)

    // Combine refs
    React.useImperativeHandle(ref, () => internalRef.current as HTMLInputElement)

    // Update display when value changes from outside
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatNumberForDisplay(value || 0, currency))
      }
    }, [value, currency, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      if (isFocused) {
        // When focused, only allow digits
        const digitsOnly = inputValue.replace(/\D/g, "")
        setDisplayValue(digitsOnly)
        const numValue = parseInt(digitsOnly, 10) || 0
        onChange?.(numValue)
      } else {
        // When not focused, allow formatted input
        const numValue = parseFormattedNumber(inputValue, currency)
        setDisplayValue(formatNumberForDisplay(numValue, currency))
        onChange?.(numValue)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      // Show raw number when focused
      const numValue = parseFormattedNumber(displayValue, currency)
      setDisplayValue(numValue > 0 ? numValue.toString() : "")
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      // Format number when blur
      const numValue = parseFormattedNumber(displayValue, currency)
      setDisplayValue(formatNumberForDisplay(numValue, currency))
      onChange?.(numValue)
      onBlur?.(e)
    }

    return (
      <div className="w-full">
        <input
          ref={internalRef}
          type="text"
          inputMode="numeric"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
