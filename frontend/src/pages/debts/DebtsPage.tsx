import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react"
import { debtsApi } from "@/api"
import { Button, Card, ConfirmDialog } from "@/components/ui"
import { cn, formatCurrency } from "@/lib/utils"
import type { Debt, DebtType, DebtStatus } from "@/types"
import { DebtFormModal } from "./DebtFormModal"
import { DebtPaymentModal } from "./DebtPaymentModal"

export function DebtsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [typeFilter, setTypeFilter] = useState<DebtType | "">("")
  const [statusFilter, setStatusFilter] = useState<DebtStatus | "">("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: "markPaid" | "cancel" | "delete"
    debt: Debt | null
  }>({
    isOpen: false,
    type: "markPaid",
    debt: null,
  })

  const { data: debtsData, isLoading } = useQuery({
    queryKey: ["debts", page, typeFilter, statusFilter],
    queryFn: () =>
      debtsApi.getAll(
        page,
        20,
        typeFilter || undefined,
        statusFilter || undefined
      ),
  })

  const { data: summary } = useQuery({
    queryKey: ["debts", "summary"],
    queryFn: debtsApi.getSummary,
  })

  const markPaidMutation = useMutation({
    mutationFn: debtsApi.markAsPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: debtsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: debtsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
    },
  })

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt)
    setIsFormOpen(true)
  }

  const handlePayment = (debt: Debt) => {
    setPayingDebt(debt)
    setIsPaymentOpen(true)
  }

  const handleMarkPaid = (debt: Debt) => {
    setConfirmDialog({ isOpen: true, type: "markPaid", debt })
  }

  const handleCancel = (debt: Debt) => {
    setConfirmDialog({ isOpen: true, type: "cancel", debt })
  }

  const handleDelete = (debt: Debt) => {
    setConfirmDialog({ isOpen: true, type: "delete", debt })
  }

  const handleConfirmAction = () => {
    if (!confirmDialog.debt) return
    if (confirmDialog.type === "markPaid") {
      markPaidMutation.mutate(confirmDialog.debt.id)
    } else if (confirmDialog.type === "cancel") {
      cancelMutation.mutate(confirmDialog.debt.id)
    } else if (confirmDialog.type === "delete") {
      deleteMutation.mutate(confirmDialog.debt.id)
    }
    setConfirmDialog({ isOpen: false, type: "markPaid", debt: null })
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingDebt(null)
  }

  const handleClosePayment = () => {
    setIsPaymentOpen(false)
    setPayingDebt(null)
  }

  const getStatusBadge = (debt: Debt) => {
    if (debt.overdue) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
          <AlertTriangle className="h-3 w-3" />
          {t("debts.overdue")}
        </span>
      )
    }

    const statusStyles: Record<DebtStatus, string> = {
      ACTIVE: "bg-blue-100 text-blue-700",
      PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
      PAID: "bg-green-100 text-green-700",
      CANCELLED: "bg-gray-100 text-gray-500",
    }

    return (
      <span
        className={cn(
          "rounded-full px-2 py-1 text-xs font-medium",
          statusStyles[debt.status]
        )}
      >
        {t(`debts.statuses.${debt.status}`)}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("debts.title")}</h1>
          <p className="text-muted-foreground">{t("debts.subtitle")}</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("debts.addDebt")}
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("debts.totalLent")}</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(summary.totalLent, "VND")}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("debts.totalBorrowed")}</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(summary.totalBorrowed, "VND")}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("debts.netBalance")}</p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    summary.netBalance >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {formatCurrency(summary.netBalance, "VND")}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 p-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("debts.overdueCount")}</p>
                <p className="text-xl font-bold text-orange-600">
                  {summary.overdueCount}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as DebtType | "")
            setPage(0)
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("debts.allTypes")}</option>
          <option value="LEND">{t("debts.types.LEND")}</option>
          <option value="BORROW">{t("debts.types.BORROW")}</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as DebtStatus | "")
            setPage(0)
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("debts.allStatuses")}</option>
          <option value="ACTIVE">{t("debts.statuses.ACTIVE")}</option>
          <option value="PARTIALLY_PAID">{t("debts.statuses.PARTIALLY_PAID")}</option>
          <option value="PAID">{t("debts.statuses.PAID")}</option>
          <option value="CANCELLED">{t("debts.statuses.CANCELLED")}</option>
        </select>
      </div>

      {/* Debts List */}
      <div className="space-y-3">
        {debtsData?.content?.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{t("debts.noDebts")}</p>
          </Card>
        ) : (
          debtsData?.content?.map((debt) => (
            <Card key={debt.id} className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full text-white",
                      debt.type === "LEND" ? "bg-green-500" : "bg-red-500"
                    )}
                  >
                    {debt.type === "LEND" ? (
                      <TrendingUp className="h-6 w-6" />
                    ) : (
                      <TrendingDown className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{debt.personName}</h3>
                      {getStatusBadge(debt)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {debt.type === "LEND" ? t("debts.lentTo") : t("debts.borrowedFrom")}{" "}
                      • {new Date(debt.startDate).toLocaleDateString()}
                    </p>
                    {debt.dueDate && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {t("debts.dueDate")}: {new Date(debt.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {debt.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {debt.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-xl font-bold",
                        debt.type === "LEND" ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {formatCurrency(debt.amount, debt.currency)}
                    </p>
                    {debt.paidAmount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {t("debts.paid")}: {formatCurrency(debt.paidAmount, debt.currency)}
                        {" / "}
                        {t("debts.remaining")}: {formatCurrency(debt.remainingAmount, debt.currency)}
                      </p>
                    )}
                  </div>

                  {(debt.status === "ACTIVE" || debt.status === "PARTIALLY_PAID") && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePayment(debt)}
                        title={t("debts.recordPayment")}
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkPaid(debt)}
                        title={t("debts.markAsPaid")}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(debt)}
                        title={t("common.edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(debt)}
                        title={t("debts.cancel")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {(debt.status === "PAID" || debt.status === "CANCELLED") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(debt)}
                      className="text-destructive hover:text-destructive"
                      title={t("common.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {debtsData && debtsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("common.page")} {page + 1} / {debtsData.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(debtsData.totalPages - 1, p + 1))}
              disabled={page >= debtsData.totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <DebtFormModal isOpen={isFormOpen} onClose={handleCloseForm} debt={editingDebt} />
      <DebtPaymentModal
        isOpen={isPaymentOpen}
        onClose={handleClosePayment}
        debt={payingDebt}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: "markPaid", debt: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.type === "markPaid" ? t("debts.markAsPaid") :
          confirmDialog.type === "cancel" ? t("debts.cancel") :
          t("common.delete")
        }
        message={
          confirmDialog.type === "markPaid" ? t("debts.confirmMarkPaid") :
          confirmDialog.type === "cancel" ? t("debts.confirmCancel") :
          t("debts.confirmDelete")
        }
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        variant={confirmDialog.type === "delete" ? "danger" : "warning"}
        isLoading={markPaidMutation.isPending || cancelMutation.isPending || deleteMutation.isPending}
      />
    </div>
  )
}
