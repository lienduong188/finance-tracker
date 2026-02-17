import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Plus, Users, User, Trash2, Receipt, Play, CheckCircle, XCircle } from "lucide-react"
import { spendingPlansApi } from "@/api"
import type { SpendingPlanStatus, SpendingPlanItem, SpendingPlanExpense } from "@/types"
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, AlertDialog } from "@/components/ui"
import ItemFormModal from "./ItemFormModal"
import RecordExpenseModal from "./RecordExpenseModal"

const statusColors: Record<SpendingPlanStatus, string> = {
  PLANNING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  ACTIVE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function SpendingPlanDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SpendingPlanItem | null>(null)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [selectedItemForExpense, setSelectedItemForExpense] = useState<SpendingPlanItem | null>(null)
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<{ isOpen: boolean; item: SpendingPlanItem | null }>({
    isOpen: false,
    item: null,
  })
  const [deleteExpenseConfirm, setDeleteExpenseConfirm] = useState<{ isOpen: boolean; expense: SpendingPlanExpense | null }>({
    isOpen: false,
    expense: null,
  })
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  })

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["spending-plan", id],
    queryFn: () => spendingPlansApi.getById(id!),
    enabled: !!id,
  })

  const { data: expenses } = useQuery({
    queryKey: ["spending-plan-expenses", id],
    queryFn: () => spendingPlansApi.getAllExpenses(id!),
    enabled: !!id,
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => spendingPlansApi.deleteItem(id!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-plan", id] })
      queryClient.invalidateQueries({ queryKey: ["spending-plan-expenses", id] })
      queryClient.invalidateQueries({ queryKey: ["spending-plans"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      setDeleteItemConfirm({ isOpen: false, item: null })
    },
    onError: (error: any) => {
      setErrorDialog({ isOpen: true, message: error.response?.data?.message || t("errors.system.internal") })
    },
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: (expense: SpendingPlanExpense) =>
      spendingPlansApi.deleteExpense(id!, expense.itemId, expense.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-plan", id] })
      queryClient.invalidateQueries({ queryKey: ["spending-plan-expenses", id] })
      queryClient.invalidateQueries({ queryKey: ["spending-plans"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      setDeleteExpenseConfirm({ isOpen: false, expense: null })
    },
    onError: (error: any) => {
      setErrorDialog({ isOpen: true, message: error.response?.data?.message || t("errors.system.internal") })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: SpendingPlanStatus) => spendingPlansApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-plan", id] })
      queryClient.invalidateQueries({ queryKey: ["spending-plans"] })
    },
    onError: (error: any) => {
      setErrorDialog({ isOpen: true, message: error.response?.data?.message || t("errors.system.internal") })
    },
  })

  const handleEditItem = (item: SpendingPlanItem) => {
    setEditingItem(item)
    setIsItemModalOpen(true)
  }

  const handleRecordExpense = (item: SpendingPlanItem) => {
    setSelectedItemForExpense(item)
    setIsExpenseModalOpen(true)
  }

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false)
    setEditingItem(null)
  }

  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false)
    setSelectedItemForExpense(null)
  }

  if (planLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!plan) {
    return <div>{t("spendingPlans.notFound")}</div>
  }

  const canRecordExpense = plan.status === "PLANNING" || plan.status === "ACTIVE"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/spending-plans")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{plan.icon || "📋"}</span>
            <h1 className="text-2xl font-bold">{plan.name}</h1>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[plan.status]}`}>
              {t(`spendingPlans.statuses.${plan.status}`)}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">{plan.description || t("spendingPlans.noDescription")}</p>
        </div>
        <div className="flex gap-2">
          {plan.status === "PLANNING" && (
            <Button variant="outline" onClick={() => updateStatusMutation.mutate("ACTIVE")}>
              <Play className="w-4 h-4 mr-2" />
              {t("spendingPlans.actions.activate")}
            </Button>
          )}
          {plan.status === "ACTIVE" && (
            <>
              <Button variant="outline" onClick={() => updateStatusMutation.mutate("COMPLETED")}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("spendingPlans.actions.complete")}
              </Button>
              <Button variant="outline" onClick={() => updateStatusMutation.mutate("CANCELLED")}>
                <XCircle className="w-4 h-4 mr-2" />
                {t("spendingPlans.actions.cancel")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("spendingPlans.actual")}</p>
              <p className={`text-3xl font-bold ${plan.progressPercentage > 100 ? "text-expense" : ""}`}>
                {formatCurrency(plan.totalActual, plan.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t("spendingPlans.estimated")}</p>
              <p className="text-xl font-semibold">
                {formatCurrency(plan.totalEstimated, plan.currency)}
              </p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                plan.progressPercentage > 100 ? "bg-expense" : "bg-primary"
              }`}
              style={{ width: `${Math.min(plan.progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span className={plan.progressPercentage > 100 ? "text-expense" : ""}>
              {plan.progressPercentage.toFixed(1)}%
              {plan.progressPercentage > 100 && ` (${t("spendingPlans.overBudget")})`}
            </span>
            <span>
              {t("spendingPlans.remaining")}: {formatCurrency(plan.remainingAmount, plan.currency)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t("spendingPlans.items.title")}</CardTitle>
          <Button size="sm" onClick={() => setIsItemModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("spendingPlans.items.add")}
          </Button>
        </CardHeader>
        <CardContent>
          {plan.items && plan.items.length > 0 ? (
            <div className="space-y-4">
              {plan.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon || item.categoryIcon || "📦"}</span>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.categoryName && (
                          <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canRecordExpense && (
                        <Button size="sm" variant="outline" onClick={() => handleRecordExpense(item)}>
                          <Receipt className="w-4 h-4 mr-1" />
                          {t("spendingPlans.expenses.record")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)}>
                        {t("common.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleteItemConfirm({ isOpen: true, item })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={item.overBudget ? "text-expense" : ""}>
                      {formatCurrency(item.actualAmount, plan.currency)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(item.estimatedAmount, plan.currency)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        item.overBudget ? "bg-expense" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(item.progressPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                    <span>{item.expensesCount} {t("spendingPlans.expenses.title").toLowerCase()}</span>
                    <span className={item.overBudget ? "text-expense" : ""}>
                      {item.progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  {(item.plannedDate || item.plannedAccountName) && (
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                      {item.plannedDate && (
                        <span>📅 {new Date(item.plannedDate).toLocaleDateString("vi-VN")}</span>
                      )}
                      {item.plannedAccountName && (
                        <span>💳 {item.plannedAccountName}</span>
                      )}
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("spendingPlans.items.noItems")}</p>
              <p className="text-sm">{t("spendingPlans.items.noItemsHint")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("spendingPlans.expenses.recentExpenses")}</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses && expenses.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {expenses.slice(0, 10).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                >
                  <div className="flex-1">
                    <p className="font-medium">{expense.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.userName} • {new Date(expense.expenseDate).toLocaleDateString("vi-VN")}
                      {expense.note && ` • ${expense.note}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold text-expense">
                        -{formatCurrency(expense.amount, expense.accountCurrency)}
                      </p>
                      {expense.accountCurrency !== plan.currency && (
                        <p className="text-xs text-muted-foreground">
                          = {formatCurrency(expense.amountInPlanCurrency, plan.currency)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteExpenseConfirm({ isOpen: true, expense })}
                      className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t("common.delete")}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {t("spendingPlans.expenses.noExpenses")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">{t("savings.type")}: </span>
              {plan.familyId ? (
                <span className="inline-flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {plan.familyName}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {t("spendingPlans.personal")}
                </span>
              )}
            </div>
            {plan.startDate && (
              <div>
                <span className="text-muted-foreground">{t("spendingPlans.startDate")}: </span>
                {new Date(plan.startDate).toLocaleDateString("vi-VN")}
              </div>
            )}
            {plan.endDate && (
              <div>
                <span className="text-muted-foreground">{t("spendingPlans.endDate")}: </span>
                {new Date(plan.endDate).toLocaleDateString("vi-VN")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ItemFormModal
        isOpen={isItemModalOpen}
        onClose={handleCloseItemModal}
        planId={id!}
        item={editingItem}
      />

      <RecordExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        planId={id!}
        item={selectedItemForExpense}
        planCurrency={plan.currency}
      />

      <ConfirmDialog
        isOpen={deleteItemConfirm.isOpen}
        onClose={() => setDeleteItemConfirm({ isOpen: false, item: null })}
        onConfirm={() => deleteItemMutation.mutate(deleteItemConfirm.item!.id)}
        title={t("common.delete")}
        message={t("spendingPlans.items.confirmDelete", { name: deleteItemConfirm.item?.name || "" })}
        confirmText={t("common.delete")}
        isLoading={deleteItemMutation.isPending}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={deleteExpenseConfirm.isOpen}
        onClose={() => setDeleteExpenseConfirm({ isOpen: false, expense: null })}
        onConfirm={() => deleteExpenseMutation.mutate(deleteExpenseConfirm.expense!)}
        title={t("common.delete")}
        message={t("spendingPlans.expenses.confirmDelete", {
          amount: deleteExpenseConfirm.expense
            ? formatCurrency(deleteExpenseConfirm.expense.amount, deleteExpenseConfirm.expense.accountCurrency)
            : ""
        })}
        confirmText={t("common.delete")}
        isLoading={deleteExpenseMutation.isPending}
        variant="danger"
      />

      <AlertDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog({ isOpen: false, message: "" })}
        title={t("common.error")}
        message={errorDialog.message}
        variant="error"
      />
    </div>
  )
}
