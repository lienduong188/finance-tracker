import { useQuery } from "@tanstack/react-query"
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  FolderTree,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { adminApi } from "@/api"
import { Card } from "@/components/ui"

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminApi.getStats,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const userStats = [
    {
      label: "Tổng Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Users hoạt động",
      value: stats?.activeUsers ?? 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Users bị vô hiệu",
      value: stats?.disabledUsers ?? 0,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      label: "Admins",
      value: stats?.adminUsers ?? 0,
      icon: Shield,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  const systemStats = [
    {
      label: "Tổng Accounts",
      value: stats?.totalAccounts ?? 0,
      icon: Wallet,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      label: "Tổng Transactions",
      value: stats?.totalTransactions ?? 0,
      icon: ArrowLeftRight,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Tổng Budgets",
      value: stats?.totalBudgets ?? 0,
      icon: PiggyBank,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      label: "Tổng Categories",
      value: stats?.totalCategories ?? 0,
      icon: FolderTree,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
  ]

  const recentStats = [
    {
      label: "Users mới (7 ngày)",
      value: stats?.usersLast7Days ?? 0,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      label: "Users mới (30 ngày)",
      value: stats?.usersLast30Days ?? 0,
      icon: Calendar,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      label: "Transactions (7 ngày)",
      value: stats?.transactionsLast7Days ?? 0,
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Transactions (30 ngày)",
      value: stats?.transactionsLast30Days ?? 0,
      icon: Calendar,
      color: "text-lime-600",
      bgColor: "bg-lime-100",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Tổng quan hệ thống</p>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Thống kê Users</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* System Stats */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Thống kê Hệ thống</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {systemStats.map((stat) => (
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
    </div>
  )
}
