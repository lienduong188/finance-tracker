import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Plus, PiggyBank, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog } from "@/components/ui"
import { budgetsApi } from "@/api"
import { formatCurrency, formatPercent, cn } from "@/lib/utils"
import type { Budget } from "@/types"
import { BudgetFormModal } from "./BudgetFormModal"

export function BudgetsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; budgetId: string | null }>({
    isOpen: false,
    budgetId: null,
  })

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

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, budgetId: id })
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.budgetId) {
      await deleteMutation.mutateAsync(deleteConfirm.budgetId)
      setDeleteConfirm({ isOpen: false, budgetId: null })
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("budgets.title")}</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("budgets.createFirst").split(".")[0]}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("budgets.addBudget")}
        </Button>
      </div>

      {/* Warnings */}
      {overLimitBudgets.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-start gap-3 p-3 md:items-center md:gap-4 md:p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive md:h-6 md:w-6" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-destructive md:text-base">
                {overLimitBudgets.length} {t("budgets.overBudget").toLowerCase()}
              </p>
              <p className="truncate text-xs text-muted-foreground md:text-sm">
                {overLimitBudgets.map((b) => b.name).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {nearLimitBudgets.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="flex items-start gap-3 p-3 md:items-center md:gap-4 md:p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning md:h-6 md:w-6" />
            <div className="min-w-0">
              <p className="text-sm font-medium md:text-base">
                {nearLimitBudgets.length} {t("budgets.nearLimit").toLowerCase()}
              </p>
              <p className="truncate text-xs text-muted-foreground md:text-sm">
                {nearLimitBudgets.map((b) => b.name).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget List */}
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {budgets?.map((budget) => (
          <Card key={budget.id} className="group">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-2 md:p-6 md:pb-2">
              <div className="flex min-w-0 items-center gap-2 md:gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full md:h-10 md:w-10",
                    budget.isOverBudget
                      ? "bg-destructive/10"
                      : budget.isNearLimit
                        ? "bg-warning/10"
                        : "bg-primary/10"
                  )}
                >
                  {budget.categoryIcon ? (
                    <span className="text-lg md:text-xl">{budget.categoryIcon}</span>
                  ) : (
                    <PiggyBank
                      className={cn(
                        "h-4 w-4 md:h-5 md:w-5",
                        budget.isOverBudget
                          ? "text-destructive"
                          : budget.isNearLimit
                            ? "text-warning"
                            : "text-primary"
                      )}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <CardTitle className="truncate text-sm md:text-base">{budget.name}</CardTitle>
                  <p className="truncate text-xs text-muted-foreground">
                    {budget.categoryName ? t(`categories.${budget.categoryName}`, budget.categoryName) : t("common.all")} •{" "}
                    {t(`budgets.periods.${budget.period}`)}
                  </p>
                </div>
              </div>

              {/* Actions - visible on mobile, hover on desktop */}
              <div className="flex gap-1 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(budget)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(budget.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-2 p-3 pt-0 md:space-y-3 md:p-6 md:pt-0">
              {/* Progress Bar */}
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-muted-foreground">{t("budgets.spent")}</span>
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
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted md:h-3">
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
                  <span>{formatPercent(budget.spentPercentage)}</span>
                  <span>
                    {t("budgets.remaining")}:{" "}
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
          className="flex min-h-[120px] cursor-pointer items-center justify-center border-dashed hover:border-primary hover:bg-accent/50 md:min-h-[150px]"
          onClick={() => setIsModalOpen(true)}
        >
          <CardContent className="flex flex-col items-center p-4 text-muted-foreground md:p-6">
            <Plus className="mb-2 h-6 w-6 md:h-8 md:w-8" />
            <p className="text-sm md:text-base">{t("budgets.addBudget")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      <BudgetFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        budget={editingBudget}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, budgetId: null })}
        onConfirm={handleDeleteConfirm}
        title={t("budgets.deleteBudget")}
        message={t("budgets.confirmDelete")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
