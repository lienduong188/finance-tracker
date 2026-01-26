import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currencies that don't use decimal places
const noDecimalCurrencies = ["VND", "JPY", "KRW", "TWD"]

export function formatCurrency(
  amount: number,
  currency: string = "VND",
  locale?: string
): string {
  // Auto-detect locale based on currency if not provided
  const currencyLocaleMap: Record<string, string> = {
    VND: "vi-VN",
    JPY: "ja-JP",
    USD: "en-US",
    EUR: "de-DE",
    KRW: "ko-KR",
  }
  const useLocale = locale || currencyLocaleMap[currency] || "en-US"
  const hasDecimals = !noDecimalCurrencies.includes(currency)

  return new Intl.NumberFormat(useLocale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount)
}

// Get locale string from language code
export function getLocaleFromLang(lang: string): string {
  const localeMap: Record<string, string> = {
    vi: "vi-VN",
    en: "en-US",
    ja: "ja-JP",
  }
  return localeMap[lang] || "vi-VN"
}

export function formatDate(
  date: string | Date,
  lang: string = "vi",
  options?: Intl.DateTimeFormatOptions
): string {
  const locale = getLocaleFromLang(lang)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
  return new Date(date).toLocaleDateString(locale, options || defaultOptions)
}

// Format date as MM/DD for EN/JA or DD/MM for VI
export function formatShortDate(date: string | Date, lang: string = "vi"): string {
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")

  // EN and JA use MM/DD, VI uses DD/MM
  if (lang === "en" || lang === "ja") {
    return `${month}/${day}`
  }
  return `${day}/${month}`
}

// Format full date with weekday
export function formatFullDate(date: string | Date, lang: string = "vi"): string {
  const locale = getLocaleFromLang(lang)
  const d = new Date(date)
  const day = d.getDate().toString().padStart(2, "0")
  const month = (d.getMonth() + 1).toString().padStart(2, "0")
  const year = d.getFullYear()

  const weekday = d.toLocaleDateString(locale, { weekday: "long" })

  // EN and JA use MM/DD/YYYY, VI uses DD/MM/YYYY
  if (lang === "en" || lang === "ja") {
    return `${weekday}, ${month}/${day}/${year}`
  }
  return `${weekday}, ${day}/${month}/${year}`
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatRelativeTime(date: string | Date, lang: string = "vi"): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) {
    return lang === "vi" ? "Vừa xong" : "Just now"
  }
  if (diffMins < 60) {
    return lang === "vi" ? `${diffMins} phút trước` : `${diffMins}m ago`
  }
  if (diffHours < 24) {
    return lang === "vi" ? `${diffHours} giờ trước` : `${diffHours}h ago`
  }
  if (diffDays < 7) {
    return lang === "vi" ? `${diffDays} ngày trước` : `${diffDays}d ago`
  }
  return formatShortDate(date, lang)
}

// Get localized category name based on current language
export function getCategoryName(
  category: {
    name: string
    nameVi?: string | null
    nameEn?: string | null
    nameJa?: string | null
  },
  lang: string = "vi"
): string {
  switch (lang) {
    case "vi":
      return category.nameVi || category.name
    case "en":
      return category.nameEn || category.name
    case "ja":
      return category.nameJa || category.name
    default:
      return category.name
  }
}
