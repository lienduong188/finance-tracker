import { useQuery } from "@tanstack/react-query"
import {
  Zap,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  Cpu,
  Gauge,
} from "lucide-react"
import { adminApi } from "@/api"
import { Card } from "@/components/ui"

function QuotaProgressBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const remaining = Math.max(0, limit - used)
  const isWarning = percentage >= 80
  const isDanger = percentage >= 95

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={isDanger ? "text-red-600" : isWarning ? "text-yellow-600" : "text-muted-foreground"}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${
            isDanger ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Còn lại: {remaining.toLocaleString()} tokens</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export function AdminTokenUsagePage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "token-usage"],
    queryFn: adminApi.getTokenUsageStats,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const tokenStats = [
    {
      label: "Tổng Tokens",
      value: stats?.totalTokens ?? 0,
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Input Tokens",
      value: stats?.totalInputTokens ?? 0,
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Output Tokens",
      value: stats?.totalOutputTokens ?? 0,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Tổng Requests",
      value: stats?.totalRequests ?? 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  const recentStats = [
    {
      label: "Tokens (7 ngày)",
      value: stats?.tokensLast7Days ?? 0,
      icon: Calendar,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "Tokens (30 ngày)",
      value: stats?.tokensLast30Days ?? 0,
      icon: Calendar,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      label: "Requests (7 ngày)",
      value: stats?.requestsLast7Days ?? 0,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Requests (30 ngày)",
      value: stats?.requestsLast30Days ?? 0,
      icon: TrendingUp,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
  ]

  const userStats = [
    {
      label: "Users đã dùng AI",
      value: stats?.uniqueUsers ?? 0,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      label: "Users (7 ngày)",
      value: stats?.uniqueUsersLast7Days ?? 0,
      icon: Users,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
    {
      label: "Users (30 ngày)",
      value: stats?.uniqueUsersLast30Days ?? 0,
      icon: Users,
      color: "text-lime-600",
      bgColor: "bg-lime-100",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Token Usage</h1>
        <p className="text-muted-foreground">Thống kê sử dụng AI Chatbot</p>
      </div>

      {/* Quota / Limits Section */}
      <Card className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Hạn mức (Quota)</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <QuotaProgressBar
            used={stats?.tokensToday ?? 0}
            limit={stats?.dailyLimit ?? 100000}
            label="Hôm nay"
          />
          <QuotaProgressBar
            used={stats?.tokensThisWeek ?? 0}
            limit={stats?.weeklyLimit ?? 500000}
            label="Tuần này"
          />
          <QuotaProgressBar
            used={stats?.tokensThisMonth ?? 0}
            limit={stats?.monthlyLimit ?? 2000000}
            label="Tháng này"
          />
        </div>
      </Card>

      {/* Token Stats */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Tổng quan Tokens</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tokenStats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Hoạt động gần đây</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentStats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Thống kê Users</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {userStats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Users & Model Usage */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Users */}
        <Card className="p-4">
          <h2 className="mb-4 text-lg font-semibold">Top Users theo Token</h2>
          {stats?.topUsers && stats.topUsers.length > 0 ? (
            <div className="space-y-3">
              {stats.topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{user.fullName || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{user.totalTokens.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">tokens</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Chưa có dữ liệu</p>
          )}
        </Card>

        {/* Model Usage */}
        <Card className="p-4">
          <h2 className="mb-4 text-lg font-semibold">
            <Cpu className="mr-2 inline h-5 w-5" />
            Thống kê theo Model
          </h2>
          {stats?.modelUsage && stats.modelUsage.length > 0 ? (
            <div className="space-y-3">
              {stats.modelUsage.map((model) => (
                <div
                  key={model.model || "unknown"}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div>
                    <p className="font-medium">{model.model || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {model.requests.toLocaleString()} requests
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{model.tokens.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">tokens</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Chưa có dữ liệu</p>
          )}
        </Card>
      </div>

      {/* Daily Usage Chart (simple table view) */}
      {stats?.dailyUsage && stats.dailyUsage.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-4 text-lg font-semibold">Sử dụng theo ngày (30 ngày gần đây)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">Ngày</th>
                  <th className="pb-2 text-right font-medium">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {stats.dailyUsage.slice(-14).map((day) => (
                  <tr key={day.date} className="border-b last:border-0">
                    <td className="py-2">{day.date}</td>
                    <td className="py-2 text-right font-medium">
                      {day.tokens.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
