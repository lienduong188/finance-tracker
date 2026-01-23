import { useQuery } from "@tanstack/react-query"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  AlertTriangle,
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
import { dashboardApi } from "@/api"
import { formatCurrency } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

export function DashboardPage() {
  const { user } = useAuth()
  const currency = user?.defaultCurrency || "VND"

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

  if (summaryLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const summaryCards = [
    {
      title: "Tổng số dư",
      value: summary?.totalBalance || 0,
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Thu nhập tháng này",
      value: summary?.totalIncome || 0,
      icon: TrendingUp,
      color: "text-income",
      bgColor: "bg-income/10",
    },
    {
      title: "Chi tiêu tháng này",
      value: summary?.totalExpense || 0,
      icon: TrendingDown,
      color: "text-expense",
      bgColor: "bg-expense/10",
    },
    {
      title: "Dòng tiền ròng",
      value: summary?.netCashflow || 0,
      icon: ArrowLeftRight,
      color: (summary?.netCashflow || 0) >= 0 ? "text-income" : "text-expense",
      bgColor: (summary?.netCashflow || 0) >= 0 ? "bg-income/10" : "bg-expense/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Xin chào, {user?.fullName}! Đây là tổng quan tài chính của bạn.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>
                    {formatCurrency(card.value, currency)}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
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
              <p className="font-medium">Cảnh báo ngân sách</p>
              <p className="text-sm text-muted-foreground">
                Bạn có {summary.budgetsOverLimit} ngân sách đã vượt hạn mức.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cashflow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Dòng tiền 30 ngày qua</CardTitle>
          </CardHeader>
          <CardContent>
            {cashflowLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cashflow?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "dd/MM")}
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      currency === "VND"
                        ? `${(value / 1000000).toFixed(0)}M`
                        : value.toLocaleString()
                    }
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value) || 0, currency)}
                    labelFormatter={(label) => format(new Date(label), "dd/MM/yyyy")}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.6}
                    name="Thu nhập"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Chi tiêu"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiêu theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryReport && categoryReport.categories.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryReport.categories}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
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
                <div className="flex-1 space-y-2">
                  {categoryReport.categories.slice(0, 5).map((cat) => (
                    <div key={cat.categoryId} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color || "#888" }}
                      />
                      <span className="flex-1 text-sm">{cat.categoryName}</span>
                      <span className="text-sm font-medium">
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Chưa có dữ liệu chi tiêu
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
