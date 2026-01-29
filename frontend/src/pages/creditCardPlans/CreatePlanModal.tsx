import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { X, CreditCard, Search } from "lucide-react"
import { creditCardPlansApi, transactionsApi, accountsApi } from "@/api"
import { Button, Input, Label } from "@/components/ui"
import { formatCurrency } from "@/lib/utils"
import type { PaymentType, Transaction, CreditCardPaymentPlanRequest } from "@/types"

interface CreatePlanModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreatePlanModal({ isOpen, onClose }: CreatePlanModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<"select" | "configure">("select")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [paymentType, setPaymentType] = useState<PaymentType>("INSTALLMENT")
  const [totalInstallments, setTotalInstallments] = useState<number>(3)
  const [installmentFeeRate, setInstallmentFeeRate] = useState<number>(0)
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0)
  const [interestRate, setInterestRate] = useState<number>(15)

  // Get credit card accounts
  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const creditCardAccounts = accounts?.filter((a) => a.type === "CREDIT_CARD") || []
  const creditCardAccountIds = creditCardAccounts.map((a) => a.id)

  // Get transactions without payment plan from credit card accounts
  const { data: transactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ["transactions", "credit-card-eligible"],
    queryFn: async () => {
      const result = await transactionsApi.getAll({ page: 0, size: 100 })
      return result.content.filter(
        (tx) =>
          tx.type === "EXPENSE" &&
          creditCardAccountIds.includes(tx.accountId) &&
          !tx.paymentPlanId
      )
    },
    enabled: isOpen && creditCardAccountIds.length > 0,
  })

  const createMutation = useMutation({
    mutationFn: (request: CreditCardPaymentPlanRequest) =>
      creditCardPlansApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-plans"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      handleClose()
    },
  })

  const handleClose = () => {
    setStep("select")
    setSelectedTransaction(null)
    setPaymentType("INSTALLMENT")
    setTotalInstallments(3)
    setInstallmentFeeRate(0)
    setMonthlyPayment(0)
    setInterestRate(15)
    onClose()
  }

  const handleSelectTransaction = (tx: Transaction) => {
    setSelectedTransaction(tx)
    setMonthlyPayment(Math.ceil(tx.amount / 10))
    setStep("configure")
  }

  const handleSubmit = () => {
    if (!selectedTransaction) return

    const request: CreditCardPaymentPlanRequest = {
      transactionId: selectedTransaction.id,
      paymentType,
    }

    if (paymentType === "INSTALLMENT") {
      request.totalInstallments = totalInstallments
      request.installmentFeeRate = installmentFeeRate / 100 // Convert to decimal
    } else {
      request.monthlyPayment = monthlyPayment
      request.interestRate = interestRate / 100 // Convert to decimal
    }

    createMutation.mutate(request)
  }

  // Calculate preview
  const calculateInstallmentPreview = () => {
    if (!selectedTransaction) return null
    const amount = selectedTransaction.amount
    const feePerInstallment = amount * (installmentFeeRate / 100)
    const totalFee = feePerInstallment * totalInstallments
    const totalAmount = amount + totalFee
    const amountPerInstallment = totalAmount / totalInstallments
    return { totalAmount, amountPerInstallment, totalFee }
  }

  const calculateRevolvingPreview = () => {
    if (!selectedTransaction) return null
    const amount = selectedTransaction.amount
    const monthlyRate = interestRate / 100 / 12
    let remaining = amount
    let totalInterest = 0
    let months = 0
    const maxMonths = 120

    while (remaining > 0 && months < maxMonths) {
      months++
      const interest = remaining * monthlyRate
      totalInterest += interest
      const principal = Math.min(monthlyPayment - interest, remaining)
      remaining -= principal
      if (principal <= 0) break
    }

    return { totalAmount: amount + totalInterest, totalInterest, months }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {step === "select" ? t("creditCard.selectTransaction") : t("creditCard.configurePlan")}
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "select" && (
          <div className="space-y-4">
            {creditCardAccounts.length === 0 ? (
              <div className="py-8 text-center">
                <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">{t("creditCard.noCreditCardAccount")}</p>
              </div>
            ) : loadingTransactions ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : transactions?.length === 0 ? (
              <div className="py-8 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">{t("creditCard.noEligibleTransactions")}</p>
              </div>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {transactions?.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => handleSelectTransaction(tx)}
                    className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tx.description || tx.categoryName || t("transactions.noDescription")}</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.accountName} • {new Date(tx.transactionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-expense">
                        {formatCurrency(tx.amount, tx.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={handleClose}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}

        {step === "configure" && selectedTransaction && (
          <div className="space-y-4">
            {/* Selected Transaction Info */}
            <div className="rounded-lg bg-muted p-4">
              <p className="font-medium">{selectedTransaction.description || selectedTransaction.categoryName}</p>
              <p className="text-sm text-muted-foreground">{selectedTransaction.accountName}</p>
              <p className="mt-2 text-xl font-bold">
                {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
              </p>
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label>{t("creditCard.paymentType")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={paymentType === "INSTALLMENT" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPaymentType("INSTALLMENT")}
                >
                  {t("creditCard.installment")}
                </Button>
                <Button
                  type="button"
                  variant={paymentType === "REVOLVING" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPaymentType("REVOLVING")}
                >
                  {t("creditCard.revolving")}
                </Button>
              </div>
            </div>

            {paymentType === "INSTALLMENT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="totalInstallments">{t("creditCard.totalInstallments")}</Label>
                  <Input
                    id="totalInstallments"
                    type="number"
                    min={2}
                    max={60}
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(parseInt(e.target.value) || 2)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installmentFeeRate">{t("creditCard.installmentFeeRate")}</Label>
                  <div className="relative">
                    <Input
                      id="installmentFeeRate"
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={installmentFeeRate}
                      onChange={(e) => setInstallmentFeeRate(parseFloat(e.target.value) || 0)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("creditCard.feeRateHelp")}</p>
                </div>

                {/* Preview */}
                {(() => {
                  const preview = calculateInstallmentPreview()
                  if (!preview) return null
                  return (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <h4 className="mb-2 font-medium">{t("creditCard.preview")}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>{t("creditCard.totalFee")}:</span>
                          <span>{formatCurrency(preview.totalFee, selectedTransaction.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("creditCard.totalAmount")}:</span>
                          <span className="font-semibold">{formatCurrency(preview.totalAmount, selectedTransaction.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("creditCard.amountPerInstallment")}:</span>
                          <span className="font-semibold">{formatCurrency(preview.amountPerInstallment, selectedTransaction.currency)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </>
            )}

            {paymentType === "REVOLVING" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="monthlyPayment">{t("creditCard.monthlyPayment")}</Label>
                  <Input
                    id="monthlyPayment"
                    type="number"
                    min={1000}
                    value={monthlyPayment}
                    onChange={(e) => setMonthlyPayment(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate">{t("creditCard.interestRate")}</Label>
                  <div className="relative">
                    <Input
                      id="interestRate"
                      type="number"
                      min={0}
                      max={30}
                      step={0.1}
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%/{t("creditCard.year")}</span>
                  </div>
                </div>

                {/* Preview */}
                {(() => {
                  const preview = calculateRevolvingPreview()
                  if (!preview) return null
                  return (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <h4 className="mb-2 font-medium">{t("creditCard.preview")}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>{t("creditCard.estimatedMonths")}:</span>
                          <span>{preview.months} {t("creditCard.months")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("creditCard.totalInterest")}:</span>
                          <span>{formatCurrency(preview.totalInterest, selectedTransaction.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("creditCard.totalAmount")}:</span>
                          <span className="font-semibold">{formatCurrency(preview.totalAmount, selectedTransaction.currency)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("select")}>
                {t("common.back")}
              </Button>
              <Button onClick={handleSubmit} isLoading={createMutation.isPending}>
                {t("creditCard.createPlan")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
