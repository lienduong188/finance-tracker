import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Plus, Users, User, TrendingUp } from "lucide-react"
import { savingsGoalsApi } from "@/api"
import type { SavingsGoalStatus } from "@/types"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import ContributeModal from "./ContributeModal"

const statusLabels: Record<SavingsGoalStatus, string> = {
  ACTIVE: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
}

const statusColors: Record<SavingsGoalStatus, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function SavingsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)

  const { data: goal, isLoading: goalLoading } = useQuery({
    queryKey: ["savings-goal", id],
    queryFn: () => savingsGoalsApi.getById(id!),
    enabled: !!id,
  })

  const { data: contributions } = useQuery({
    queryKey: ["savings-contributions", id],
    queryFn: () => savingsGoalsApi.getContributions(id!),
    enabled: !!id,
  })

  const { data: contributors } = useQuery({
    queryKey: ["savings-contributors", id],
    queryFn: () => savingsGoalsApi.getContributors(id!),
    enabled: !!id,
  })

  if (goalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!goal) {
    return <div>Không tìm thấy mục tiêu</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/savings")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{goal.icon || "🎯"}</span>
            <h1 className="text-2xl font-bold">{goal.name}</h1>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[goal.status]}`}>
              {statusLabels[goal.status]}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">{goal.description || "Chưa có mô tả"}</p>
        </div>
        {goal.status === "ACTIVE" && (
          <Button onClick={() => setIsContributeModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Đóng góp
          </Button>
        )}
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Đã tiết kiệm</p>
              <p className="text-3xl font-bold">
                {formatCurrency(goal.currentAmount, goal.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Mục tiêu</p>
              <p className="text-xl font-semibold">
                {formatCurrency(goal.targetAmount, goal.currency)}
              </p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-4">
            <div
              className="bg-primary h-4 rounded-full transition-all"
              style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{goal.progressPercentage.toFixed(1)}% hoàn thành</span>
            <span>
              Còn thiếu {formatCurrency(goal.targetAmount - goal.currentAmount, goal.currency)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contributors */}
        {contributors && contributors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Người đóng góp ({contributors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contributors.map((contributor) => (
                  <div
                    key={contributor.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                        {contributor.userName.charAt(0).toUpperCase()}
                      </div>
                      <span>{contributor.userName}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(contributor.totalAmount, goal.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contributor.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent contributions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Lịch sử đóng góp
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contributions && contributions.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {contributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{contribution.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(contribution.contributionDate).toLocaleDateString("vi-VN")}
                        {contribution.note && ` • ${contribution.note}`}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(contribution.amount, goal.currency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Chưa có đóng góp nào
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Loại: </span>
              {goal.familyId ? (
                <span className="flex items-center gap-1 inline-flex">
                  <Users className="w-4 h-4" />
                  {goal.familyName}
                </span>
              ) : (
                <span className="flex items-center gap-1 inline-flex">
                  <User className="w-4 h-4" />
                  Cá nhân
                </span>
              )}
            </div>
            {goal.targetDate && (
              <div>
                <span className="text-muted-foreground">Ngày mục tiêu: </span>
                {new Date(goal.targetDate).toLocaleDateString("vi-VN")}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Ngày tạo: </span>
              {new Date(goal.createdAt).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </CardContent>
      </Card>

      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        goalId={id!}
        goalName={goal.name}
        currency={goal.currency}
      />
    </div>
  )
}
