import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  Plus,
  CreditCard,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Percent,
} from "lucide-react"
import { creditCardPlansApi, accountsApi } from "@/api"
import { Button, Card } from "@/components/ui"
import { cn, formatCurrency } from "@/lib/utils"
import type { CreditCardPaymentPlan, PaymentPlanStatus, PaymentType } from "@/types"
import { CreatePlanModal } from "./CreatePlanModal"
import { PlanDetailModal } from "./PlanDetailModal"

type SortOption = "createdAt,desc" | "nextPaymentDate,asc" | "accountName,asc" | "originalAmount,desc"

export function CreditCardPlansPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<PaymentPlanStatus | "">("")
  const [typeFilter, setTypeFilter] = useState<PaymentType | "">("")
  const [accountFilter, setAccountFilter] = useState<string>("")
  const [sortOption, setSortOption] = useState<SortOption>("createdAt,desc")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<CreditCardPaymentPlan | null>(null)

  // Get credit card accounts for filter
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const creditCardAccounts = accounts?.filter((a) => a.type === "CREDIT_CARD") || []

  const { data: plansData, isLoading } = useQuery({
    queryKey: ["credit-card-plans", page, statusFilter, typeFilter, accountFilter, sortOption],
    queryFn: () =>
      creditCardPlansApi.getAll(
        page,
        20,
        statusFilter || undefined,
        typeFilter || undefined,
        accountFilter || undefined,
        sortOption
      ),
  })

  const { data: upcomingPayments } = useQuery({
    queryKey: ["credit-card-plans", "upcoming"],
    queryFn: () => creditCardPlansApi.getUpcoming(30),
  })

  const cancelMutation = useMutation({
    mutationFn: creditCardPlansApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-plans"] })
    },
  })

  const handleCancel = (plan: CreditCardPaymentPlan) => {
    if (confirm(t("creditCard.confirmCancel"))) {
      cancelMutation.mutate(plan.id)
    }
  }

  const handleViewDetail = (plan: CreditCardPaymentPlan) => {
    setSelectedPlan(plan)
  }

  const getStatusBadge = (status: PaymentPlanStatus) => {
    const statusStyles: Record<PaymentPlanStatus, string> = {
      ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    }

    return (
      <span
        className={cn(
          "rounded-full px-2 py-1 text-xs font-medium",
          statusStyles[status]
        )}
      >
        {t(`creditCard.statuses.${status}`)}
      </span>
    )
  }

  const getPaymentTypeBadge = (paymentType: PaymentType) => {
    if (paymentType === "INSTALLMENT") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <Calendar className="h-3 w-3" />
          {t("creditCard.installment")}
        </span>
      )
    }
    if (paymentType === "REVOLVING") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          <Percent className="h-3 w-3" />
          {t("creditCard.revolving")}
        </span>
      )
    }
    return null
  }

  const getProgressPercentage = (plan: CreditCardPaymentPlan) => {
    if (!plan.totalInstallments) return 0
    return Math.round(((plan.completedInstallments || 0) / plan.totalInstallments) * 100)
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
          <h1 className="text-2xl font-bold">{t("creditCard.title")}</h1>
          <p className="text-muted-foreground">{t("creditCard.subtitle")}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("creditCard.createPlan")}
        </Button>
      </div>

      {/* Upcoming Payments */}
      {upcomingPayments && upcomingPayments.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Clock className="h-5 w-5 text-orange-500" />
            {t("creditCard.upcomingPayments")}
          </h2>
          <div className="space-y-2">
            {upcomingPayments.slice(0, 5).map((payment) => (
              <div
                key={payment.paymentId}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              >
                <div>
                  <p className="font-medium">
                    {payment.transactionDescription || t("creditCard.payment")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.accountName} • {t("creditCard.installmentNumber", {
                      current: payment.paymentNumber,
                      total: payment.totalInstallments || "?"
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(payment.totalAmount, payment.currency)}
                  </p>
                  <p className={cn(
                    "text-sm",
                    new Date(payment.dueDate) < new Date() ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {new Date(payment.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Account filter */}
        <select
          value={accountFilter}
          onChange={(e) => {
            setAccountFilter(e.target.value)
            setPage(0)
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("creditCard.allAccounts")}</option>
          {creditCardAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as PaymentPlanStatus | "")
            setPage(0)
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("creditCard.allStatuses")}</option>
          <option value="ACTIVE">{t("creditCard.statuses.ACTIVE")}</option>
          <option value="COMPLETED">{t("creditCard.statuses.COMPLETED")}</option>
          <option value="CANCELLED">{t("creditCard.statuses.CANCELLED")}</option>
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as PaymentType | "")
            setPage(0)
          }}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("creditCard.allTypes")}</option>
          <option value="INSTALLMENT">{t("creditCard.installment")}</option>
          <option value="REVOLVING">{t("creditCard.revolving")}</option>
        </select>

        {/* Sort */}
        <select
          value={sortOption}
          onChange={(e) => {
            setSortOption(e.target.value as SortOption)
            setPage(0)
          }}
          className="ml-auto flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="createdAt,desc">{t("creditCard.sortNewest")}</option>
          <option value="nextPaymentDate,asc">{t("creditCard.sortDueDate")}</option>
          <option value="originalAmount,desc">{t("creditCard.sortAmount")}</option>
        </select>
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        {plansData?.content?.length === 0 ? (
          <Card className="p-8 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">{t("creditCard.noPlans")}</p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("creditCard.createPlan")}
            </Button>
          </Card>
        ) : (
          plansData?.content?.map((plan) => (
            <Card
              key={plan.id}
              className="cursor-pointer p-4 transition-colors hover:bg-muted/50"
              onClick={() => handleViewDetail(plan)}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {plan.transactionDescription || t("creditCard.payment")}
                      </h3>
                      {getPaymentTypeBadge(plan.paymentType)}
                      {getStatusBadge(plan.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.accountName} • {new Date(plan.startDate).toLocaleDateString()}
                    </p>
                    {plan.nextPaymentDate && plan.status === "ACTIVE" && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {t("creditCard.nextPayment")}: {new Date(plan.nextPaymentDate).toLocaleDateString()}
                      </p>
                    )}

                    {/* Progress bar */}
                    {plan.totalInstallments && plan.status === "ACTIVE" && (
                      <div className="mt-2 w-48">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{plan.completedInstallments || 0} / {plan.totalInstallments}</span>
                          <span>{getProgressPercentage(plan)}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${getProgressPercentage(plan)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {formatCurrency(plan.originalAmount, plan.currency)}
                    </p>
                    {plan.totalAmountWithFee !== plan.originalAmount && (
                      <p className="text-sm text-muted-foreground">
                        {t("creditCard.totalWithFee")}: {formatCurrency(plan.totalAmountWithFee, plan.currency)}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {t("creditCard.remaining")}: {formatCurrency(plan.remainingAmount, plan.currency)}
                    </p>
                  </div>

                  {plan.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancel(plan)
                      }}
                      className="text-destructive hover:text-destructive"
                      title={t("creditCard.cancelPlan")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {plansData && plansData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("common.page")} {page + 1} / {plansData.totalPages}
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
              onClick={() => setPage((p) => Math.min(plansData.totalPages - 1, p + 1))}
              disabled={page >= plansData.totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePlanModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <PlanDetailModal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        planId={selectedPlan?.id || null}
      />
    </div>
  )
}
