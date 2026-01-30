import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Pencil,
  Trash2,
  List,
  CalendarDays,
  PieChart,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns"
import { vi, enUS, ja } from "date-fns/locale"
import { Button, Card, CardContent, CardHeader, CardTitle, Select, Input, Label } from "@/components/ui"
import { transactionsApi, accountsApi } from "@/api"
import { formatCurrency, formatFullDate, cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import type { Transaction, TransactionType } from "@/types"
import { TransactionFormModal } from "./TransactionFormModal"

type ViewMode = "list" | "calendar" | "category" | "account"
type CalendarViewMode = "month" | "week" | "day"
type AccountViewPeriod = "day" | "week" | "month"

const transactionTypeIcons: Record<TransactionType, typeof TrendingUp> = {
  INCOME: TrendingUp,
  EXPENSE: TrendingDown,
  TRANSFER: ArrowLeftRight,
}

const transactionTypeColors: Record<TransactionType, string> = {
  INCOME: "text-income",
  EXPENSE: "text-expense",
  TRANSFER: "text-transfer",
}

const viewIcons = {
  list: List,
  calendar: CalendarDays,
  category: PieChart,
  account: Wallet,
}

const getLocale = (lang: string) => {
  switch (lang) {
    case "vi":
      return vi
    case "ja":
      return ja
    default:
      return enUS
  }
}

export function TransactionsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const lang = i18n.language
  const locale = getLocale(lang)
  const defaultCurrency = user?.defaultCurrency || "VND"
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>("month")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [accountViewPeriod, setAccountViewPeriod] = useState<AccountViewPeriod>("week")
  const [filters, setFilters] = useState({
    accountId: "",
    type: "",
    startDate: "",
    endDate: "",
    page: 0,
    size: 100, // Load more for calendar/category views
  })

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => transactionsApi.getAll(filters),
  })

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
    },
  })

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm(t("common.confirm") + "?")) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
  }

  // Group transactions by date (sorted descending - newest first)
  const groupedByDate = useMemo(() => {
    const groups = transactions?.content?.reduce((acc, tx) => {
      const date = tx.transactionDate
      if (!acc[date]) acc[date] = []
      acc[date].push(tx)
      return acc
    }, {} as Record<string, Transaction[]>)

    if (!groups) return undefined

    // Sort by date descending
    const sortedEntries = Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
    return Object.fromEntries(sortedEntries)
  }, [transactions])

  // Group transactions by category
  const groupedByCategory = useMemo(() => {
    const categoryMap: Record<string, { name: string; icon: string; color: string; total: number; transactions: Transaction[] }> = {}
    transactions?.content?.forEach((tx) => {
      if (tx.type === "TRANSFER") return
      const key = tx.categoryId || "uncategorized"
      if (!categoryMap[key]) {
        categoryMap[key] = {
          name: tx.categoryName || t(`transactions.types.${tx.type}`),
          icon: tx.categoryIcon || "",
          color: tx.type === "INCOME" ? "#22c55e" : "#ef4444",
          total: 0,
          transactions: [],
        }
      }
      categoryMap[key].total += tx.type === "EXPENSE" ? tx.amount : -tx.amount
      categoryMap[key].transactions.push(tx)
    })
    return Object.entries(categoryMap).sort((a, b) => Math.abs(b[1].total) - Math.abs(a[1].total))
  }, [transactions, t])

  // Calculate period date range for account view
  const accountViewDateRange = useMemo(() => {
    const today = new Date()
    let start: Date
    let end: Date = endOfWeek(today, { locale })

    if (accountViewPeriod === "day") {
      start = today
      end = today
    } else if (accountViewPeriod === "week") {
      start = startOfWeek(today, { locale })
      end = endOfWeek(today, { locale })
    } else {
      start = startOfMonth(today)
      end = endOfMonth(today)
    }

    return {
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
    }
  }, [accountViewPeriod, locale])

  // Group transactions by account with period filter
  const groupedByAccount = useMemo(() => {
    const accountMap: Record<string, {
      id: string
      name: string
      initialBalance: number
      currency: string
      income: number
      expense: number
      transferIn: number
      transactions: Transaction[]
    }> = {}

    // Initialize accounts with their info
    accounts?.forEach((acc) => {
      accountMap[acc.id] = {
        id: acc.id,
        name: acc.name,
        initialBalance: acc.initialBalance,
        currency: acc.currency,
        income: 0,
        expense: 0,
        transferIn: 0,
        transactions: [],
      }
    })

    // Filter transactions by period
    const filteredTxns = transactions?.content?.filter((tx) => {
      return tx.transactionDate >= accountViewDateRange.start && tx.transactionDate <= accountViewDateRange.end
    }) || []

    filteredTxns.forEach((tx) => {
      const key = tx.accountId
      if (!accountMap[key]) {
        accountMap[key] = {
          id: key,
          name: tx.accountName,
          initialBalance: 0,
          currency: tx.currency,
          income: 0,
          expense: 0,
          transferIn: 0,
          transactions: [],
        }
      }

      if (tx.type === "INCOME") {
        accountMap[key].income += tx.amount
      } else if (tx.type === "EXPENSE") {
        accountMap[key].expense += tx.amount
      } else if (tx.type === "TRANSFER") {
        // Transfer out from this account (expense side)
        accountMap[key].expense += tx.amount

        // Transfer in to target account
        if (tx.toAccountId && accountMap[tx.toAccountId]) {
          const transferAmount = tx.exchangeRate ? tx.amount * tx.exchangeRate : tx.amount
          accountMap[tx.toAccountId].transferIn += transferAmount
        }
      }

      accountMap[key].transactions.push(tx)
    })

    // Only return accounts that have transactions in the period
    return Object.entries(accountMap).filter(([, acc]) => acc.transactions.length > 0)
  }, [transactions, accounts, accountViewDateRange])

  // Calendar data
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const calStart = startOfWeek(monthStart, { locale })
    const calEnd = endOfWeek(monthEnd, { locale })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [calendarMonth, locale])

  const transactionsByDay = useMemo(() => {
    const map: Record<string, Transaction[]> = {}
    transactions?.content?.forEach((tx) => {
      const key = tx.transactionDate
      if (!map[key]) map[key] = []
      map[key].push(tx)
    })
    return map
  }, [transactions])

  // Render List View
  const renderListView = () => (
    <div className="space-y-4 md:space-y-6">
      {groupedByDate && Object.entries(groupedByDate).map(([date, txns]) => (
        <div key={date}>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground md:mb-3 md:text-sm">
            {formatFullDate(date, lang)}
          </h3>
          <Card>
            <CardContent className="divide-y p-0">
              {txns.map((transaction) => {
                const Icon = transactionTypeIcons[transaction.type]
                return (
                  <div key={transaction.id} className="group p-3 hover:bg-accent/50 md:p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full md:h-10 md:w-10",
                          transaction.type === "INCOME" && "bg-income/10",
                          transaction.type === "EXPENSE" && "bg-expense/10",
                          transaction.type === "TRANSFER" && "bg-transfer/10"
                        )}
                      >
                        {transaction.categoryIcon ? (
                          <span className="text-lg md:text-xl">{transaction.categoryIcon}</span>
                        ) : (
                          <Icon className={cn("h-4 w-4 md:h-5 md:w-5", transactionTypeColors[transaction.type])} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {/* 説明 (Description) */}
                            <p className="truncate text-sm font-medium md:text-base">
                              {transaction.description || t(`transactions.types.${transaction.type}`)}
                            </p>
                            {/* 口座 (Account) */}
                            <p className="truncate text-xs text-muted-foreground md:text-sm">
                              {transaction.accountName}
                              {transaction.type === "TRANSFER" && ` → ${transaction.toAccountName}`}
                            </p>
                            {/* カテゴリー (Category) */}
                            <p className="truncate text-xs text-muted-foreground">
                              {transaction.categoryName
                                ? t(`categories.${transaction.categoryName}`, transaction.categoryName)
                                : t(`transactions.types.${transaction.type}`)}
                            </p>
                          </div>
                          <p className={cn("shrink-0 text-sm font-semibold md:text-lg", transactionTypeColors[transaction.type])}>
                            {transaction.type === "INCOME" ? "+" : "-"}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                        </div>
                        <div className="mt-2 flex gap-1 md:mt-0 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleEdit(transaction)}>
                            <Pencil className="mr-1 h-3 w-3" />
                            {t("common.edit")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            {t("common.delete")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )

  // Calendar week days labels
  const weekDaysJa = ["日", "月", "火", "水", "木", "金", "土"]
  const weekDaysVi = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
  const weekDaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const weekDayLabels = lang === "ja" ? weekDaysJa : lang === "vi" ? weekDaysVi : weekDaysEn

  // Week days for week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { locale })
    const weekEnd = endOfWeek(selectedDate, { locale })
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [selectedDate, locale])

  // Navigation handlers for calendar
  const handleCalendarPrev = () => {
    if (calendarViewMode === "month") {
      setCalendarMonth(subMonths(calendarMonth, 1))
    } else if (calendarViewMode === "week") {
      setSelectedDate(subWeeks(selectedDate, 1))
    } else {
      setSelectedDate(subDays(selectedDate, 1))
    }
  }

  const handleCalendarNext = () => {
    if (calendarViewMode === "month") {
      setCalendarMonth(addMonths(calendarMonth, 1))
    } else if (calendarViewMode === "week") {
      setSelectedDate(addWeeks(selectedDate, 1))
    } else {
      setSelectedDate(addDays(selectedDate, 1))
    }
  }

  const handleCalendarToday = () => {
    const today = new Date()
    setSelectedDate(today)
    setCalendarMonth(today)
  }

  // Get calendar title based on view mode
  const getCalendarTitle = () => {
    if (calendarViewMode === "month") {
      return format(calendarMonth, lang === "ja" ? "yyyy年MM月" : lang === "vi" ? "MM/yyyy" : "MMMM yyyy", { locale })
    } else if (calendarViewMode === "week") {
      const weekStart = startOfWeek(selectedDate, { locale })
      const weekEnd = endOfWeek(selectedDate, { locale })
      return `${format(weekStart, "MM/dd")} - ${format(weekEnd, "MM/dd")}`
    } else {
      return formatFullDate(format(selectedDate, "yyyy-MM-dd"), lang)
    }
  }

  // Render transaction item
  const renderTransactionItem = (tx: Transaction, showDate = false) => {
    const Icon = transactionTypeIcons[tx.type]
    return (
      <div
        key={tx.id}
        className="group flex items-center justify-between rounded-lg border p-2 hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              tx.type === "INCOME" && "bg-income/10",
              tx.type === "EXPENSE" && "bg-expense/10",
              tx.type === "TRANSFER" && "bg-transfer/10"
            )}
          >
            {tx.categoryIcon ? (
              <span className="text-sm">{tx.categoryIcon}</span>
            ) : (
              <Icon className={cn("h-4 w-4", transactionTypeColors[tx.type])} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {tx.categoryName ? t(`categories.${tx.categoryName}`, tx.categoryName) : t(`transactions.types.${tx.type}`)}
            </p>
            {showDate && (
              <p className="text-xs text-muted-foreground">{formatFullDate(tx.transactionDate, lang)}</p>
            )}
            {tx.description && (
              <p className="text-xs text-muted-foreground">{tx.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", transactionTypeColors[tx.type])}>
            {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
          </span>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEdit(tx)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDelete(tx.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Render Month View
  const renderMonthView = () => (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Week headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-center text-xs font-medium">
        {weekDayLabels.map((d, index) => (
          <div key={d} className={cn(
            "border-r border-border py-2 last:border-r-0",
            index === 0 && "text-red-500 font-semibold", // Sunday
            index === 6 && "text-blue-500 font-semibold", // Saturday
            index !== 0 && index !== 6 && "text-muted-foreground"
          )}>{d}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd")
          const dayTxns = transactionsByDay[dateKey] || []
          const income = dayTxns.filter((tx) => tx.type === "INCOME").reduce((s, tx) => s + tx.amount, 0)
          const expense = dayTxns.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + tx.amount, 0)
          const isSelected = isSameDay(day, selectedDate)
          const isCurrentMonth = isSameMonth(day, calendarMonth)
          const dayOfWeek = day.getDay() // 0 = Sunday, 6 = Saturday

          return (
            <button
              key={dateKey}
              onClick={() => {
                setSelectedDate(day)
                setCalendarViewMode("day")
              }}
              className={cn(
                "relative flex min-h-[60px] flex-col items-center border-b border-r border-border p-1 text-xs transition-colors md:min-h-[80px] md:p-2",
                isCurrentMonth ? "bg-background" : "bg-muted/50",
                !isCurrentMonth && dayOfWeek !== 0 && dayOfWeek !== 6 && "text-muted-foreground",
                isSelected && "bg-primary/10 ring-2 ring-inset ring-primary",
                !isSelected && "hover:bg-accent/50"
              )}
            >
              <span className={cn(
                "font-medium",
                isToday(day) && "rounded-full bg-primary px-1.5 text-primary-foreground",
                !isToday(day) && dayOfWeek === 0 && "text-red-500", // Sunday
                !isToday(day) && dayOfWeek === 6 && "text-blue-500" // Saturday
              )}>
                {format(day, "d")}
              </span>
              {dayTxns.length > 0 && (
                <div className="mt-1 w-full space-y-0.5 text-[10px]">
                  {income > 0 && <div className="truncate text-income">+{formatCurrency(income, defaultCurrency)}</div>}
                  {expense > 0 && <div className="truncate text-expense">-{formatCurrency(expense, defaultCurrency)}</div>}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  // Render Week View
  const renderWeekView = () => {
    const weekIncome = weekDays.reduce((sum, day) => {
      const txns = transactionsByDay[format(day, "yyyy-MM-dd")] || []
      return sum + txns.filter((tx) => tx.type === "INCOME").reduce((s, tx) => s + tx.amount, 0)
    }, 0)
    const weekExpense = weekDays.reduce((sum, day) => {
      const txns = transactionsByDay[format(day, "yyyy-MM-dd")] || []
      return sum + txns.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + tx.amount, 0)
    }, 0)

    return (
      <div className="space-y-4">
        {/* Week summary */}
        <div className="flex justify-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">{t("transactions.totalIncome")}: </span>
            <span className="font-medium text-income">{formatCurrency(weekIncome, defaultCurrency)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("transactions.totalExpense")}: </span>
            <span className="font-medium text-expense">{formatCurrency(weekExpense, defaultCurrency)}</span>
          </div>
        </div>
        {/* Week days */}
        <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-border">
          {weekDays.map((day, index) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayTxns = transactionsByDay[dateKey] || []
            const income = dayTxns.filter((tx) => tx.type === "INCOME").reduce((s, tx) => s + tx.amount, 0)
            const expense = dayTxns.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + tx.amount, 0)
            const isSelected = isSameDay(day, selectedDate)
            const dayOfWeek = day.getDay() // 0 = Sunday, 6 = Saturday

            return (
              <button
                key={dateKey}
                onClick={() => {
                  setSelectedDate(day)
                  setCalendarViewMode("day")
                }}
                className={cn(
                  "flex flex-col items-center border-r border-border p-2 transition-colors last:border-r-0",
                  isSelected && "bg-primary/10 ring-2 ring-inset ring-primary",
                  !isSelected && "hover:bg-accent/50"
                )}
              >
                <span className={cn(
                  "text-xs",
                  dayOfWeek === 0 && "text-red-500", // Sunday
                  dayOfWeek === 6 && "text-blue-500", // Saturday
                  dayOfWeek !== 0 && dayOfWeek !== 6 && "text-muted-foreground"
                )}>{weekDayLabels[index]}</span>
                <span className={cn(
                  "text-lg font-medium",
                  isToday(day) && "rounded-full bg-primary px-2 text-primary-foreground",
                  !isToday(day) && dayOfWeek === 0 && "text-red-500", // Sunday
                  !isToday(day) && dayOfWeek === 6 && "text-blue-500" // Saturday
                )}>
                  {format(day, "d")}
                </span>
                {dayTxns.length > 0 && (
                  <div className="mt-1 text-center text-[10px]">
                    {income > 0 && <div className="text-income">+{formatCurrency(income, defaultCurrency)}</div>}
                    {expense > 0 && <div className="text-expense">-{formatCurrency(expense, defaultCurrency)}</div>}
                  </div>
                )}
                {dayTxns.length === 0 && <div className="mt-1 text-[10px] text-muted-foreground">-</div>}
              </button>
            )
          })}
        </div>
        {/* Selected day transactions */}
        {transactionsByDay[format(selectedDate, "yyyy-MM-dd")]?.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-medium">{formatFullDate(format(selectedDate, "yyyy-MM-dd"), lang)}</h4>
            {transactionsByDay[format(selectedDate, "yyyy-MM-dd")].map((tx) => renderTransactionItem(tx))}
          </div>
        )}
      </div>
    )
  }

  // Render Day View
  const renderDayView = () => {
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    const dayTxns = transactionsByDay[dateKey] || []
    const income = dayTxns.filter((tx) => tx.type === "INCOME").reduce((s, tx) => s + tx.amount, 0)
    const expense = dayTxns.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + tx.amount, 0)

    return (
      <div className="space-y-4">
        {/* Day summary */}
        <div className="flex justify-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">{t("transactions.totalIncome")}: </span>
            <span className="font-medium text-income">{formatCurrency(income, defaultCurrency)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("transactions.totalExpense")}: </span>
            <span className="font-medium text-expense">{formatCurrency(expense, defaultCurrency)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("transactions.balance")}: </span>
            <span className={cn("font-medium", income - expense >= 0 ? "text-income" : "text-expense")}>
              {income - expense >= 0 ? "+" : ""}{formatCurrency(income - expense, defaultCurrency)}
            </span>
          </div>
        </div>
        {/* Transactions list */}
        {dayTxns.length > 0 ? (
          <div className="space-y-2">
            {dayTxns.map((tx) => renderTransactionItem(tx))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            {t("transactions.noTransactions")}
          </div>
        )}
        {/* Add transaction button */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("transactions.addTransaction")}
          </Button>
        </div>
      </div>
    )
  }

  // Render Calendar View
  const renderCalendarView = () => (
    <Card>
      <CardHeader className="p-4">
        {/* Calendar view mode tabs */}
        <div className="mb-4 flex justify-center gap-1 rounded-lg bg-muted p-1">
          {(["month", "week", "day"] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCalendarViewMode(mode)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                calendarViewMode === mode ? "bg-background shadow" : "hover:bg-background/50"
              )}
            >
              {t(`transactions.calendarViews.${mode}`)}
            </button>
          ))}
        </div>
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handleCalendarPrev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base md:text-lg">{getCalendarTitle()}</CardTitle>
            <Button variant="outline" size="sm" className="text-xs" onClick={handleCalendarToday}>
              {t("transactions.today")}
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCalendarNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-4">
        {calendarViewMode === "month" && renderMonthView()}
        {calendarViewMode === "week" && renderWeekView()}
        {calendarViewMode === "day" && renderDayView()}
      </CardContent>
    </Card>
  )

  // Render Category View
  const renderCategoryView = () => {
    const pieData = groupedByCategory.map(([, cat]) => ({
      name: t(`categories.${cat.name}`, cat.name),
      value: Math.abs(cat.total),
      color: cat.color,
    }))

    const totalExpense = groupedByCategory.reduce((sum, [, cat]) => sum + (cat.total > 0 ? cat.total : 0), 0)

    return (
      <div className="space-y-4">
        {pieData.length > 0 ? (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center gap-4 md:flex-row">
                  <ResponsiveContainer width="100%" height={200} className="md:!w-1/2">
                    <RechartsPie>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value), defaultCurrency)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="w-full space-y-2 md:flex-1">
                    {groupedByCategory.slice(0, 6).map(([key, cat]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="flex-1 truncate text-sm">{cat.icon} {t(`categories.${cat.name}`, cat.name)}</span>
                        <span className="text-sm font-medium">{formatCurrency(Math.abs(cat.total), defaultCurrency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 text-center text-lg font-semibold">
                  {t("transactions.totalExpense")}: <span className="text-expense">{formatCurrency(totalExpense, defaultCurrency)}</span>
                </div>
              </CardContent>
            </Card>
            {/* Category list with transactions - 2 columns grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {groupedByCategory.map(([key, cat]) => (
                <Card key={key}>
                  <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <span>{cat.icon}</span>
                      {t(`categories.${cat.name}`, cat.name)}
                    </CardTitle>
                    <span className="text-sm font-semibold text-expense">{formatCurrency(Math.abs(cat.total), defaultCurrency)}</span>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <div className="space-y-1">
                      {cat.transactions.slice(0, 3).map((tx) => (
                        <div key={tx.id} className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatFullDate(tx.transactionDate, lang)}</span>
                          <span>{formatCurrency(tx.amount, tx.currency)}</span>
                        </div>
                      ))}
                      {cat.transactions.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{cat.transactions.length - 3} more</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
              {t("transactions.noTransactions")}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Render Account View - 2 columns grid
  const renderAccountView = () => (
    <div className="space-y-4">
      {/* Period filter */}
      <div className="flex justify-center gap-1 rounded-lg bg-muted p-1">
        {(["day", "week", "month"] as AccountViewPeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => setAccountViewPeriod(period)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              accountViewPeriod === period ? "bg-background shadow" : "hover:bg-background/50"
            )}
          >
            {t(`transactions.periods.${period}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {groupedByAccount.map(([key, acc]) => {
          // 総収入 = initialBalance + income + transferIn
          const totalIncome = acc.initialBalance + acc.income + acc.transferIn
          // 総支出 = expense (bao gồm cả transfer out)
          const totalExpense = acc.expense
          // 収支 = totalIncome - totalExpense
          const balance = totalIncome - totalExpense

          return (
            <Card key={key}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{acc.name}</span>
                  <span className={cn("text-sm", balance >= 0 ? "text-income" : "text-expense")}>
                    {balance >= 0 ? "+" : ""}{formatCurrency(balance, acc.currency)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="mb-3 flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t("transactions.totalIncome")}: </span>
                    <span className="font-medium text-income">{formatCurrency(totalIncome, acc.currency)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("transactions.totalExpense")}: </span>
                    <span className="font-medium text-expense">{formatCurrency(totalExpense, acc.currency)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {acc.transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{tx.categoryIcon || "💰"}</span>
                        <div>
                          <p className="font-medium">{tx.categoryName ? t(`categories.${tx.categoryName}`, tx.categoryName) : t(`transactions.types.${tx.type}`)}</p>
                          <p className="text-xs text-muted-foreground">{formatFullDate(tx.transactionDate, lang)}</p>
                        </div>
                      </div>
                      <span className={cn("font-medium", transactionTypeColors[tx.type])}>
                        {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </div>
                  ))}
                  {acc.transactions.length > 5 && (
                    <p className="text-center text-xs text-muted-foreground">+{acc.transactions.length - 5} more transactions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {groupedByAccount.length === 0 && (
          <Card className="sm:col-span-2">
            <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
              {t("transactions.noTransactions")}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("transactions.title")}</h1>
          <p className="text-sm text-muted-foreground md:text-base">{t("transactions.createFirst").split(".")[0]}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("transactions.addTransaction")}
        </Button>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(["list", "calendar", "category", "account"] as ViewMode[]).map((mode) => {
          const Icon = viewIcons[mode]
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-colors md:gap-2 md:px-3 md:text-sm",
                viewMode === mode ? "bg-background shadow" : "hover:bg-background/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t(`transactions.views.${mode}`)}</span>
            </button>
          )
        })}
      </div>

      {/* Filters (for list view) */}
      {viewMode === "list" && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:p-4">
            <div className="w-full sm:w-40 md:w-48">
              <Label className="mb-1 text-xs">{t("transactions.account")}</Label>
              <Select value={filters.accountId} onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}>
                <option value="">{t("common.all")}</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-40 md:w-48">
              <Label className="mb-1 text-xs">{t("transactions.type")}</Label>
              <Select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">{t("common.all")}</option>
                <option value="INCOME">{t("transactions.types.INCOME")}</option>
                <option value="EXPENSE">{t("transactions.types.EXPENSE")}</option>
                <option value="TRANSFER">{t("transactions.types.TRANSFER")}</option>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <Label className="mb-1 text-xs">{t("transactions.fromDate")}</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="w-full sm:w-36">
              <Label className="mb-1 text-xs">{t("transactions.toDate")}</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            {(filters.startDate || filters.endDate || filters.accountId || filters.type) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setFilters({ ...filters, accountId: "", type: "", startDate: "", endDate: "" })}
              >
                {t("transactions.clearFilters")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {viewMode === "list" && renderListView()}
          {viewMode === "calendar" && renderCalendarView()}
          {viewMode === "category" && renderCategoryView()}
          {viewMode === "account" && renderAccountView()}

          {viewMode === "list" && transactions?.content?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
                <ArrowLeftRight className="mb-4 h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
                <p className="text-sm text-muted-foreground md:text-base">{t("transactions.noTransactions")}</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("transactions.addTransaction")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination (list view only) */}
          {viewMode === "list" && transactions && transactions.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={filters.page === 0} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>
                ←
              </Button>
              <span className="flex items-center px-3 text-sm md:px-4 md:text-base">
                {filters.page + 1} / {transactions.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={filters.page >= transactions.totalPages - 1} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>
                →
              </Button>
            </div>
          )}
        </>
      )}

      <TransactionFormModal isOpen={isModalOpen} onClose={handleCloseModal} transaction={editingTransaction} />
    </div>
  )
}
