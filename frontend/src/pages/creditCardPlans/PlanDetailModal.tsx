import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { X, Check, Clock, AlertTriangle } from "lucide-react"
import { creditCardPlansApi } from "@/api"
import { Button, Card } from "@/components/ui"
import { cn, formatCurrency } from "@/lib/utils"
import type { PaymentStatus } from "@/types"

interface PlanDetailModalProps {
  isOpen: boolean
  onClose: () => void
  planId: string | null
}

export function PlanDetailModal({ isOpen, onClose, planId }: PlanDetailModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: plan, isLoading } = useQuery({
    queryKey: ["credit-card-plans", planId],
    queryFn: () => creditCardPlansApi.getById(planId!),
    enabled: isOpen && !!planId,
  })

  const markPaidMutation = useMutation({
    mutationFn: ({ paymentId }: { paymentId: string }) =>
      creditCardPlansApi.markPaymentAsPaid(planId!, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-plans"] })
    },
  })

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return <Check className="h-4 w-4 text-green-500" />
      case "OVERDUE":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusStyle = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
      case "OVERDUE":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
      default:
        return "bg-background border-border"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("creditCard.planDetail")}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : plan ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{plan.transactionDescription || t("creditCard.payment")}</p>
                  <p className="text-sm text-muted-foreground">
                    {plan.accountName} • {plan.paymentType === "INSTALLMENT" ? t("creditCard.installment") : t("creditCard.revolving")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(plan.originalAmount, plan.currency)}
                  </p>
                  {plan.totalAmountWithFee !== plan.originalAmount && (
                    <p className="text-sm text-muted-foreground">
                      {t("creditCard.totalWithFee")}: {formatCurrency(plan.totalAmountWithFee, plan.currency)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("creditCard.progress")}</p>
                  <p className="font-semibold">
                    {plan.completedInstallments || 0} / {plan.totalInstallments || "?"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("creditCard.remaining")}</p>
                  <p className="font-semibold">
                    {formatCurrency(plan.remainingAmount, plan.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("creditCard.status")}</p>
                  <p className="font-semibold">{t(`creditCard.statuses.${plan.status}`)}</p>
                </div>
              </div>
            </div>

            {/* Payment Schedule */}
            <div>
              <h3 className="mb-3 font-semibold">{t("creditCard.paymentSchedule")}</h3>
              <div className="space-y-2">
                {plan.payments?.map((payment) => (
                  <Card
                    key={payment.id}
                    className={cn(
                      "flex items-center justify-between border p-3",
                      getStatusStyle(payment.status)
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium">
                          {t("creditCard.installmentNumber", {
                            current: payment.paymentNumber,
                            total: plan.totalInstallments || "?"
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("creditCard.dueDate")}: {new Date(payment.dueDate).toLocaleDateString()}
                          {payment.paymentDate && (
                            <> • {t("creditCard.paidOn")}: {new Date(payment.paymentDate).toLocaleDateString()}</>
                          )}
                        </p>
                        {(payment.feeAmount > 0 || payment.interestAmount > 0) && (
                          <p className="text-xs text-muted-foreground">
                            {t("creditCard.principal")}: {formatCurrency(payment.principalAmount, plan.currency)}
                            {payment.feeAmount > 0 && <> + {t("creditCard.fee")}: {formatCurrency(payment.feeAmount, plan.currency)}</>}
                            {payment.interestAmount > 0 && <> + {t("creditCard.interest")}: {formatCurrency(payment.interestAmount, plan.currency)}</>}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(payment.totalAmount, plan.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("creditCard.remainingAfter")}: {formatCurrency(payment.remainingAfter, plan.currency)}
                        </p>
                      </div>
                      {payment.status === "PENDING" && plan.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          onClick={() => markPaidMutation.mutate({ paymentId: payment.id })}
                          isLoading={markPaidMutation.isPending}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          {t("creditCard.markAsPaid")}
                        </Button>
                      )}
                      {payment.status === "OVERDUE" && plan.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => markPaidMutation.mutate({ paymentId: payment.id })}
                          isLoading={markPaidMutation.isPending}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          {t("creditCard.markAsPaid")}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={onClose}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            {t("creditCard.planNotFound")}
          </div>
        )}
      </div>
    </div>
  )
}
