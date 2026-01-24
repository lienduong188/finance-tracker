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
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { vi, enUS, ja } from "date-fns/locale"
import { Button, Card, CardContent, CardHeader, CardTitle, Select } from "@/components/ui"
import { transactionsApi, accountsApi } from "@/api"
import { formatCurrency, formatFullDate, cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import type { Transaction, TransactionType } from "@/types"
import { TransactionFormModal } from "./TransactionFormModal"

type ViewMode = "list" | "calendar" | "category" | "account"

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [filters, setFilters] = useState({
    accountId: "",
    type: "",
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

  // Group transactions by date
  const groupedByDate = useMemo(() => {
    return transactions?.content?.reduce((groups, tx) => {
      const date = tx.transactionDate
      if (!groups[date]) groups[date] = []
      groups[date].push(tx)
      return groups
    }, {} as Record<string, Transaction[]>)
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
          color: tx.categoryColor || (tx.type === "INCOME" ? "#22c55e" : "#ef4444"),
          total: 0,
          transactions: [],
        }
      }
      categoryMap[key].total += tx.type === "EXPENSE" ? tx.amount : -tx.amount
      categoryMap[key].transactions.push(tx)
    })
    return Object.entries(categoryMap).sort((a, b) => Math.abs(b[1].total) - Math.abs(a[1].total))
  }, [transactions, t])

  // Group transactions by account
  const groupedByAccount = useMemo(() => {
    const accountMap: Record<string, { name: string; income: number; expense: number; transactions: Transaction[] }> = {}
    transactions?.content?.forEach((tx) => {
      const key = tx.accountId
      if (!accountMap[key]) {
        accountMap[key] = { name: tx.accountName, income: 0, expense: 0, transactions: [] }
      }
      if (tx.type === "INCOME") accountMap[key].income += tx.amount
      else if (tx.type === "EXPENSE") accountMap[key].expense += tx.amount
      accountMap[key].transactions.push(tx)
    })
    return Object.entries(accountMap)
  }, [transactions])

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
                            <p className="truncate text-sm font-medium md:text-base">
                              {transaction.categoryName
                                ? t(`categories.${transaction.categoryName}`, transaction.categoryName)
                                : t(`transactions.types.${transaction.type}`)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground md:text-sm">
                              {transaction.accountName}
                              {transaction.type === "TRANSFER" && ` → ${transaction.toAccountName}`}
                            </p>
                          </div>
                          <p className={cn("shrink-0 text-sm font-semibold md:text-lg", transactionTypeColors[transaction.type])}>
                            {transaction.type === "INCOME" ? "+" : "-"}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                        </div>
                        {transaction.description && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">{transaction.description}</p>
                        )}
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

  // Render Calendar View
  const renderCalendarView = () => {
    const weekDays = ["日", "月", "火", "水", "木", "金", "土"]
    const weekDaysVi = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
    const weekDaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const days = lang === "ja" ? weekDays : lang === "vi" ? weekDaysVi : weekDaysEn

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <CardTitle className="text-base md:text-lg">
            {format(calendarMonth, "yyyy年MM月", { locale })}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          {/* Week headers */}
          <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
            {days.map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const dayTxns = transactionsByDay[dateKey] || []
              const income = dayTxns.filter((tx) => tx.type === "INCOME").reduce((s, tx) => s + tx.amount, 0)
              const expense = dayTxns.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + tx.amount, 0)
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, calendarMonth)

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative flex min-h-[60px] flex-col items-center rounded-lg border p-1 text-xs transition-colors md:min-h-[80px] md:p-2",
                    isCurrentMonth ? "bg-background" : "bg-muted/30 text-muted-foreground",
                    isSelected && "border-primary ring-1 ring-primary",
                    !isSelected && "hover:border-primary/50"
                  )}
                >
                  <span className={cn("font-medium", isSameDay(day, new Date()) && "rounded-full bg-primary px-1.5 text-primary-foreground")}>
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
          {/* Selected date transactions */}
          {transactionsByDay[format(selectedDate, "yyyy-MM-dd")]?.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="mb-2 text-sm font-medium">{formatFullDate(format(selectedDate, "yyyy-MM-dd"), lang)}</h4>
              <div className="space-y-2">
                {transactionsByDay[format(selectedDate, "yyyy-MM-dd")].map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg border p-2">
                    <div className="flex items-center gap-2">
                      <span>{tx.categoryIcon || "💰"}</span>
                      <span className="text-sm">{tx.categoryName ? t(`categories.${tx.categoryName}`, tx.categoryName) : t(`transactions.types.${tx.type}`)}</span>
                    </div>
                    <span className={cn("text-sm font-medium", transactionTypeColors[tx.type])}>
                      {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

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
            {/* Category list with transactions */}
            <div className="space-y-3">
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

  // Render Account View
  const renderAccountView = () => (
    <div className="space-y-4">
      {groupedByAccount.map(([key, acc]) => (
        <Card key={key}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>{acc.name}</span>
              <span className={cn("text-sm", acc.income - acc.expense >= 0 ? "text-income" : "text-expense")}>
                {acc.income - acc.expense >= 0 ? "+" : ""}{formatCurrency(acc.income - acc.expense, defaultCurrency)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="mb-3 flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("transactions.totalIncome")}: </span>
                <span className="font-medium text-income">{formatCurrency(acc.income, defaultCurrency)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("transactions.totalExpense")}: </span>
                <span className="font-medium text-expense">{formatCurrency(acc.expense, defaultCurrency)}</span>
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
      ))}
      {groupedByAccount.length === 0 && (
        <Card>
          <CardContent className="flex h-48 items-center justify-center text-muted-foreground">
            {t("transactions.noTransactions")}
          </CardContent>
        </Card>
      )}
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
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:gap-4 sm:p-4">
            <div className="w-full sm:w-40 md:w-48">
              <Select value={filters.accountId} onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}>
                <option value="">{t("common.all")} {t("accounts.title").toLowerCase()}</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-40 md:w-48">
              <Select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">{t("common.all")} {t("transactions.type").toLowerCase()}</option>
                <option value="INCOME">{t("transactions.types.INCOME")}</option>
                <option value="EXPENSE">{t("transactions.types.EXPENSE")}</option>
                <option value="TRANSFER">{t("transactions.types.TRANSFER")}</option>
              </Select>
            </div>
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
