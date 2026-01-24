import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  AlertTriangle,
  Calendar,
  Repeat,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { format, subDays } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { dashboardApi, recurringApi } from "@/api"
import { formatCurrency, formatShortDate, formatFullDate, cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const currency = user?.defaultCurrency || "VND"
  const lang = i18n.language

  const today = new Date()
  const startDate = format(subDays(today, 30), "yyyy-MM-dd")
  const endDate = format(today, "yyyy-MM-dd")

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard-summary", currency],
    queryFn: () => dashboardApi.getSummary(currency),
  })

  const { data: cashflow, isLoading: cashflowLoading } = useQuery({
    queryKey: ["dashboard-cashflow", startDate, endDate],
    queryFn: () => dashboardApi.getCashflow(startDate, endDate),
  })

  const { data: categoryReport } = useQuery({
    queryKey: ["dashboard-category", "EXPENSE", startDate, endDate],
    queryFn: () => dashboardApi.getCategoryReport("EXPENSE", startDate, endDate),
  })

  const { data: upcomingTransactions } = useQuery({
    queryKey: ["upcoming-transactions"],
    queryFn: () => recurringApi.getUpcoming(7),
  })

  if (summaryLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const summaryCards = [
    {
      titleKey: "dashboard.totalBalance",
      value: summary?.totalBalance || 0,
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      titleKey: "dashboard.monthlyIncome",
      value: summary?.totalIncome || 0,
      icon: TrendingUp,
      color: "text-income",
      bgColor: "bg-income/10",
    },
    {
      titleKey: "dashboard.monthlyExpense",
      value: summary?.totalExpense || 0,
      icon: TrendingDown,
      color: "text-expense",
      bgColor: "bg-expense/10",
    },
    {
      titleKey: "dashboard.netCashflow",
      value: summary?.netCashflow || 0,
      icon: ArrowLeftRight,
      color: (summary?.netCashflow || 0) >= 0 ? "text-income" : "text-expense",
      bgColor: (summary?.netCashflow || 0) >= 0 ? "bg-income/10" : "bg-expense/10",
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          {t("dashboard.greeting", { name: user?.fullName })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.titleKey}>
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground md:text-sm">{t(card.titleKey)}</p>
                  <p className={`truncate text-lg font-bold md:text-2xl ${card.color}`}>
                    {formatCurrency(card.value, currency)}
                  </p>
                </div>
                <div className={`hidden rounded-full p-2 md:block md:p-3 ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 md:h-6 md:w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Warning */}
      {summary && summary.budgetsOverLimit > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <div>
              <p className="font-medium">{t("dashboard.budgetWarning")}</p>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.budgetsOverLimit", { count: summary.budgetsOverLimit })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Cashflow Chart */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">{t("dashboard.cashflowChart")}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-6 md:pt-0">
            {cashflowLoading ? (
              <div className="flex h-48 items-center justify-center md:h-64">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={cashflow?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => formatShortDate(value, lang)}
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      currency === "VND"
                        ? `${(value / 1000000).toFixed(0)}M`
                        : value.toLocaleString()
                    }
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                    width={40}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value) || 0, currency)}
                    labelFormatter={(label) => formatFullDate(label, lang).split(", ")[1]}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.6}
                    name={t("transactions.types.INCOME")}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name={t("transactions.types.EXPENSE")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">{t("dashboard.categoryChart")}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-6 md:pt-0">
            {categoryReport && categoryReport.categories.length > 0 ? (
              <div className="flex flex-col items-center gap-4 md:flex-row">
                <ResponsiveContainer width="100%" height={200} className="md:!w-1/2">
                  <PieChart>
                    <Pie
                      data={categoryReport.categories}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                    >
                      {categoryReport.categories.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || `hsl(${index * 45}, 70%, 50%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value) || 0, currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2 md:flex-1">
                  {categoryReport.categories.slice(0, 5).map((cat) => (
                    <div key={cat.categoryId} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color || "#888" }}
                      />
                      <span className="flex-1 truncate text-xs md:text-sm">
                        {t(`categories.${cat.categoryName}`, cat.categoryName)}
                      </span>
                      <span className="text-xs font-medium md:text-sm">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground md:h-64">
                {t("dashboard.noExpenseData")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Recurring Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Repeat className="h-5 w-5" />
            {t("recurring.upcoming")}
          </CardTitle>
          <Link
            to="/recurring"
            className="text-sm text-primary hover:underline"
          >
            {t("common.all")}
          </Link>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {upcomingTransactions && upcomingTransactions.length > 0 ? (
            <div className="space-y-3">
              {upcomingTransactions.slice(0, 5).map((tx) => (
                <div
                  key={`${tx.recurringId}-${tx.scheduledDate}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        tx.type === "INCOME" && "bg-income/10",
                        tx.type === "EXPENSE" && "bg-expense/10",
                        tx.type === "TRANSFER" && "bg-transfer/10"
                      )}
                    >
                      {tx.categoryIcon ? (
                        <span className="text-lg">{tx.categoryIcon}</span>
                      ) : tx.type === "INCOME" ? (
                        <TrendingUp className="h-4 w-4 text-income" />
                      ) : tx.type === "EXPENSE" ? (
                        <TrendingDown className="h-4 w-4 text-expense" />
                      ) : (
                        <ArrowLeftRight className="h-4 w-4 text-transfer" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.description || (tx.categoryName ? t(`categories.${tx.categoryName}`, tx.categoryName) : t(`transactions.types.${tx.type}`))}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatFullDate(tx.scheduledDate, lang)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "font-semibold",
                      tx.type === "INCOME" && "text-income",
                      tx.type === "EXPENSE" && "text-expense",
                      tx.type === "TRANSFER" && "text-transfer"
                    )}
                  >
                    {tx.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(tx.amount, tx.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              {t("recurring.noUpcoming")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
