import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, PiggyBank, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { budgetsApi } from "@/api"
import { formatCurrency, formatPercent, cn } from "@/lib/utils"
import type { Budget } from "@/types"
import { BudgetFormModal } from "./BudgetFormModal"

const periodLabels: Record<string, string> = {
  DAILY: "Hằng ngày",
  WEEKLY: "Hằng tuần",
  MONTHLY: "Hằng tháng",
  YEARLY: "Hằng năm",
  CUSTOM: "Tùy chỉnh",
}

export function BudgetsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: budgetsApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: budgetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
    },
  })

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa ngân sách này?")) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBudget(null)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const overLimitBudgets = budgets?.filter((b) => b.isOverBudget) || []
  const nearLimitBudgets = budgets?.filter((b) => b.isNearLimit && !b.isOverBudget) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ngân sách</h1>
          <p className="text-muted-foreground">
            Quản lý hạn mức chi tiêu của bạn
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm ngân sách
        </Button>
      </div>

      {/* Warnings */}
      {overLimitBudgets.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                {overLimitBudgets.length} ngân sách đã vượt hạn mức
              </p>
              <p className="text-sm text-muted-foreground">
                {overLimitBudgets.map((b) => b.name).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {nearLimitBudgets.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <div>
              <p className="font-medium">
                {nearLimitBudgets.length} ngân sách sắp đạt hạn mức
              </p>
              <p className="text-sm text-muted-foreground">
                {nearLimitBudgets.map((b) => b.name).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget List */}
      <div className="grid gap-4 md:grid-cols-2">
        {budgets?.map((budget) => (
          <Card key={budget.id} className="group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    budget.isOverBudget
                      ? "bg-destructive/10"
                      : budget.isNearLimit
                        ? "bg-warning/10"
                        : "bg-primary/10"
                  )}
                >
                  {budget.categoryIcon ? (
                    <span className="text-xl">{budget.categoryIcon}</span>
                  ) : (
                    <PiggyBank
                      className={cn(
                        "h-5 w-5",
                        budget.isOverBudget
                          ? "text-destructive"
                          : budget.isNearLimit
                            ? "text-warning"
                            : "text-primary"
                      )}
                    />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">{budget.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {budget.categoryName || "Tất cả chi tiêu"} •{" "}
                    {periodLabels[budget.period]}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(budget)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(budget.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đã chi</span>
                  <span
                    className={cn(
                      "font-medium",
                      budget.isOverBudget
                        ? "text-destructive"
                        : budget.isNearLimit
                          ? "text-warning"
                          : ""
                    )}
                  >
                    {formatCurrency(budget.spentAmount, budget.currency)} /{" "}
                    {formatCurrency(budget.amount, budget.currency)}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all",
                      budget.isOverBudget
                        ? "bg-destructive"
                        : budget.isNearLimit
                          ? "bg-warning"
                          : "bg-primary"
                    )}
                    style={{
                      width: `${Math.min(budget.spentPercentage, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPercent(budget.spentPercentage)} đã dùng</span>
                  <span>
                    Còn lại:{" "}
                    {formatCurrency(
                      Math.max(budget.remainingAmount, 0),
                      budget.currency
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Budget Card */}
        <Card
          className="flex cursor-pointer items-center justify-center border-dashed hover:border-primary hover:bg-accent/50"
          onClick={() => setIsModalOpen(true)}
        >
          <CardContent className="flex flex-col items-center p-6 text-muted-foreground">
            <Plus className="mb-2 h-8 w-8" />
            <p>Thêm ngân sách mới</p>
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      <BudgetFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        budget={editingBudget}
      />
    </div>
  )
}
