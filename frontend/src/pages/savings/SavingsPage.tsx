import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Plus, Target, Users, User, Trash2 } from "lucide-react"
import { savingsGoalsApi } from "@/api"
import type { SavingsGoal, SavingsGoalStatus } from "@/types"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import SavingsFormModal from "./SavingsFormModal"

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

export default function SavingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [statusFilter, setStatusFilter] = useState<SavingsGoalStatus | "ALL">("ALL")

  const { data: goals, isLoading } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: savingsGoalsApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: savingsGoalsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
    },
  })

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal)
    setIsModalOpen(true)
  }

  const handleDelete = (goal: SavingsGoal) => {
    if (confirm(`Bạn có chắc muốn xóa mục tiêu "${goal.name}"?`)) {
      deleteMutation.mutate(goal.id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingGoal(null)
  }

  const filteredGoals = goals?.filter(
    (g) => statusFilter === "ALL" || g.status === statusFilter
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mục tiêu tiết kiệm</h1>
          <p className="text-muted-foreground">Theo dõi tiến độ tiết kiệm của bạn</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo mục tiêu
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={statusFilter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("ALL")}
        >
          Tất cả
        </Button>
        <Button
          variant={statusFilter === "ACTIVE" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("ACTIVE")}
        >
          Đang thực hiện
        </Button>
        <Button
          variant={statusFilter === "COMPLETED" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("COMPLETED")}
        >
          Hoàn thành
        </Button>
      </div>

      {!filteredGoals || filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có mục tiêu nào</h3>
            <p className="text-muted-foreground text-center mb-4">
              Tạo mục tiêu tiết kiệm để theo dõi tiến độ
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo mục tiêu đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => (
            <Card
              key={goal.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/savings/${goal.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{goal.icon || "🎯"}</span>
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[goal.status]}`}>
                    {statusLabels[goal.status]}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{formatCurrency(goal.currentAmount, goal.currency)}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.targetAmount, goal.currency)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 text-right">
                    {goal.progressPercentage.toFixed(1)}%
                  </p>
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {goal.familyId ? (
                      <>
                        <Users className="w-4 h-4" />
                        {goal.familyName}
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4" />
                        Cá nhân
                      </>
                    )}
                  </span>
                  {goal.targetDate && (
                    <span>
                      Hạn: {new Date(goal.targetDate).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(goal)}>
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(goal)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SavingsFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        goal={editingGoal}
      />
    </div>
  )
}
