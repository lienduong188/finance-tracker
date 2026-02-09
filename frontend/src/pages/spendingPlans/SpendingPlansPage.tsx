import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus, ClipboardList, Users, User, Trash2, Calendar } from "lucide-react"
import { spendingPlansApi } from "@/api"
import type { SpendingPlan, SpendingPlanStatus } from "@/types"
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog } from "@/components/ui"
import SpendingPlanFormModal from "./SpendingPlanFormModal"

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

export default function SpendingPlansPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SpendingPlan | null>(null)
  const [statusFilter, setStatusFilter] = useState<SpendingPlanStatus | "ALL">("ALL")
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; plan: SpendingPlan | null }>({
    isOpen: false,
    plan: null,
  })

  const { data: plans, isLoading } = useQuery({
    queryKey: ["spending-plans"],
    queryFn: spendingPlansApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: spendingPlansApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-plans"] })
    },
  })

  const handleEdit = (plan: SpendingPlan) => {
    setEditingPlan(plan)
    setIsModalOpen(true)
  }

  const handleDelete = (plan: SpendingPlan) => {
    setDeleteConfirm({ isOpen: true, plan })
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm.plan) {
      deleteMutation.mutate(deleteConfirm.plan.id)
      setDeleteConfirm({ isOpen: false, plan: null })
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPlan(null)
  }

  const filteredPlans = plans?.filter(
    (p) => statusFilter === "ALL" || p.status === statusFilter
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
          <h1 className="text-2xl font-bold">{t("spendingPlans.title")}</h1>
          <p className="text-muted-foreground">{t("spendingPlans.subtitle")}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t("spendingPlans.addPlan")}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("ALL")}
        >
          {t("common.all")}
        </Button>
        <Button
          variant={statusFilter === "PLANNING" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("PLANNING")}
        >
          {t("spendingPlans.statuses.PLANNING")}
        </Button>
        <Button
          variant={statusFilter === "ACTIVE" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("ACTIVE")}
        >
          {t("spendingPlans.statuses.ACTIVE")}
        </Button>
        <Button
          variant={statusFilter === "COMPLETED" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("COMPLETED")}
        >
          {t("spendingPlans.statuses.COMPLETED")}
        </Button>
      </div>

      {!filteredPlans || filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("spendingPlans.noPlans")}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t("spendingPlans.noPlansHint")}
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t("spendingPlans.createFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <Card
              key={plan.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/spending-plans/${plan.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{plan.icon || "📋"}</span>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[plan.status]}`}>
                    {t(`spendingPlans.statuses.${plan.status}`)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-expense">{formatCurrency(plan.totalActual, plan.currency)}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(plan.totalEstimated, plan.currency)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        plan.progressPercentage > 100 ? "bg-expense" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(plan.progressPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">
                      {plan.itemsCount} {t("spendingPlans.items.title").toLowerCase()}
                    </span>
                    <span className={plan.progressPercentage > 100 ? "text-expense" : "text-muted-foreground"}>
                      {plan.progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {plan.familyId ? (
                      <>
                        <Users className="w-4 h-4" />
                        {plan.familyName}
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4" />
                        {t("spendingPlans.personal")}
                      </>
                    )}
                  </span>
                  {(plan.startDate || plan.endDate) && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {plan.startDate && new Date(plan.startDate).toLocaleDateString("vi-VN")}
                      {plan.startDate && plan.endDate && " - "}
                      {plan.endDate && new Date(plan.endDate).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                    {t("common.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(plan)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SpendingPlanFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        plan={editingPlan}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, plan: null })}
        onConfirm={handleDeleteConfirm}
        title={t("common.delete")}
        message={t("spendingPlans.confirmDelete", { name: deleteConfirm.plan?.name || "" })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
