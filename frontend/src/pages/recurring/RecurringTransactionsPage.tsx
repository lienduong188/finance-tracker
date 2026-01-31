import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  Plus,
  Repeat,
  Pencil,
  Trash2,
  Pause,
  Play,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
} from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, Select, ConfirmDialog } from "@/components/ui"
import { recurringApi } from "@/api"
import { formatCurrency, cn } from "@/lib/utils"
import type { RecurringTransaction, RecurringStatus, TransactionType } from "@/types"
import { RecurringTransactionFormModal } from "./RecurringTransactionFormModal"

const transactionTypeIcons: Record<TransactionType, typeof TrendingUp> = {
  INCOME: TrendingUp,
  EXPENSE: TrendingDown,
  TRANSFER: ArrowLeftRight,
}

const transactionTypeColors: Record<TransactionType, string> = {
  INCOME: "text-income",
  EXPENSE: "text-expense",
  TRANSFER: "text-transfer",
}

const statusColors: Record<RecurringStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
}

export function RecurringTransactionsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })

  const { data: recurringData, isLoading } = useQuery({
    queryKey: ["recurring-transactions", statusFilter],
    queryFn: () => recurringApi.getAll({
      status: statusFilter as RecurringStatus || undefined,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: recurringApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] })
    },
  })

  const pauseMutation = useMutation({
    mutationFn: recurringApi.pause,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] })
    },
  })

  const resumeMutation = useMutation({
    mutationFn: recurringApi.resume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: recurringApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] })
    },
  })

  const handleEdit = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.id) {
      await deleteMutation.mutateAsync(deleteConfirm.id)
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRecurring(null)
  }

  const getFrequencyText = (recurring: RecurringTransaction) => {
    const interval = recurring.intervalValue
    switch (recurring.frequency) {
      case "DAILY":
        return interval === 1 ? t("recurring.daily") : t("recurring.everyNDays", { n: interval })
      case "WEEKLY":
        return interval === 1 ? t("recurring.weekly") : t("recurring.everyNWeeks", { n: interval })
      case "MONTHLY":
        return interval === 1 ? t("recurring.monthly") : t("recurring.everyNMonths", { n: interval })
      case "YEARLY":
        return interval === 1 ? t("recurring.yearly") : t("recurring.everyNYears", { n: interval })
      default:
        return recurring.frequency
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const recurrings = recurringData?.content || []

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("recurring.title")}</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("recurring.description")}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("recurring.add")}
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t("common.all")}</option>
              <option value="ACTIVE">{t("recurring.status.ACTIVE")}</option>
              <option value="PAUSED">{t("recurring.status.PAUSED")}</option>
              <option value="COMPLETED">{t("recurring.status.COMPLETED")}</option>
              <option value="CANCELLED">{t("recurring.status.CANCELLED")}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recurring List */}
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {recurrings.map((recurring) => {
          const Icon = transactionTypeIcons[recurring.type]
          return (
            <Card key={recurring.id} className="group">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-2 md:p-6 md:pb-2">
                <div className="flex min-w-0 items-center gap-2 md:gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full md:h-10 md:w-10",
                      recurring.type === "INCOME" && "bg-income/10",
                      recurring.type === "EXPENSE" && "bg-expense/10",
                      recurring.type === "TRANSFER" && "bg-transfer/10"
                    )}
                  >
                    {recurring.categoryIcon ? (
                      <span className="text-lg md:text-xl">{recurring.categoryIcon}</span>
                    ) : (
                      <Icon className={cn("h-4 w-4 md:h-5 md:w-5", transactionTypeColors[recurring.type])} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm md:text-base">
                      {recurring.description || (recurring.categoryName ? t(`categories.${recurring.categoryName}`, recurring.categoryName) : t(`transactions.types.${recurring.type}`))}
                    </CardTitle>
                    <p className="truncate text-xs text-muted-foreground">
                      {recurring.accountName}
                      {recurring.type === "TRANSFER" && ` → ${recurring.toAccountName}`}
                    </p>
                  </div>
                </div>

                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusColors[recurring.status])}>
                  {t(`recurring.status.${recurring.status}`)}
                </span>
              </CardHeader>

              <CardContent className="space-y-2 p-3 pt-0 md:p-6 md:pt-0">
                <div className="flex items-center justify-between">
                  <span className={cn("text-lg font-bold md:text-xl", transactionTypeColors[recurring.type])}>
                    {recurring.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(recurring.amount, recurring.currency)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    {getFrequencyText(recurring)}
                  </span>
                  {recurring.nextExecutionDate && recurring.status === "ACTIVE" && (
                    <span>
                      {t("recurring.nextDate")}: {recurring.nextExecutionDate}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 pt-2 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                  {recurring.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => pauseMutation.mutate(recurring.id)}
                    >
                      <Pause className="mr-1 h-3 w-3" />
                      {t("recurring.pause")}
                    </Button>
                  )}
                  {recurring.status === "PAUSED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => resumeMutation.mutate(recurring.id)}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      {t("recurring.resume")}
                    </Button>
                  )}
                  {(recurring.status === "ACTIVE" || recurring.status === "PAUSED") && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleEdit(recurring)}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        {t("common.edit")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-warning hover:text-warning"
                        onClick={() => cancelMutation.mutate(recurring.id)}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        {t("recurring.cancel")}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(recurring.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    {t("common.delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Add Card */}
        <Card
          className="flex min-h-[150px] cursor-pointer items-center justify-center border-dashed hover:border-primary hover:bg-accent/50 md:min-h-[180px]"
          onClick={() => setIsModalOpen(true)}
        >
          <CardContent className="flex flex-col items-center p-4 text-muted-foreground md:p-6">
            <Plus className="mb-2 h-6 w-6 md:h-8 md:w-8" />
            <p className="text-sm md:text-base">{t("recurring.add")}</p>
          </CardContent>
        </Card>
      </div>

      {recurrings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
            <Repeat className="mb-4 h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
            <p className="text-sm text-muted-foreground md:text-base">{t("recurring.noRecurring")}</p>
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      <RecurringTransactionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        recurring={editingRecurring}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDeleteConfirm}
        title={t("recurring.deleteTitle")}
        message={t("recurring.confirmDelete")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
