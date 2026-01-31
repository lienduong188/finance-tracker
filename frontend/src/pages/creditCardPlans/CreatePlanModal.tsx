import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { X, CreditCard, Search, Calendar, CheckSquare, Square } from "lucide-react"
import { creditCardPlansApi, transactionsApi, accountsApi } from "@/api"
import { Button, Input, Label } from "@/components/ui"
import { formatCurrency } from "@/lib/utils"
import type { PaymentType, Transaction, CreditCardPaymentPlanRequest, BulkCreditCardPaymentPlanRequest, Account } from "@/types"

interface CreatePlanModalProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = "single" | "monthly"
type Step = "select" | "configure"

export function CreatePlanModal({ isOpen, onClose }: CreatePlanModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<Mode>("single")
  const [step, setStep] = useState<Step>("select")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
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

  // Group transactions by account and month (previous month for credit card billing)
  const previousMonthTransactions = useMemo(() => {
    if (!transactions) return []
    const now = new Date()
    // Get previous month
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

    return transactions.filter((tx) => {
      const txDate = new Date(tx.transactionDate)
      return txDate.getMonth() === prevMonth && txDate.getFullYear() === prevYear
    })
  }, [transactions])

  // Group by account
  const transactionsByAccount = useMemo(() => {
    const grouped: Record<string, { account: Account; transactions: Transaction[]; total: number }> = {}

    previousMonthTransactions.forEach((tx) => {
      if (!grouped[tx.accountId]) {
        const account = creditCardAccounts.find((a) => a.id === tx.accountId)
        if (account) {
          grouped[tx.accountId] = {
            account,
            transactions: [],
            total: 0,
          }
        }
      }
      if (grouped[tx.accountId]) {
        grouped[tx.accountId].transactions.push(tx)
        grouped[tx.accountId].total += tx.amount
      }
    })

    return grouped
  }, [previousMonthTransactions, creditCardAccounts])

  const selectedAccountData = selectedAccountId ? transactionsByAccount[selectedAccountId] : null
  const totalSelectedAmount = useMemo(() => {
    if (mode === "single" && selectedTransaction) {
      return selectedTransaction.amount
    }
    if (mode === "monthly" && selectedAccountData) {
      return selectedTransactionIds.reduce((sum, id) => {
        const tx = selectedAccountData.transactions.find((t) => t.id === id)
        return sum + (tx?.amount || 0)
      }, 0)
    }
    return 0
  }, [mode, selectedTransaction, selectedAccountData, selectedTransactionIds])

  const selectedCurrency = useMemo(() => {
    if (mode === "single" && selectedTransaction) {
      return selectedTransaction.currency
    }
    if (mode === "monthly" && selectedAccountData) {
      return selectedAccountData.account.currency
    }
    return "VND"
  }, [mode, selectedTransaction, selectedAccountData])

  const createMutation = useMutation({
    mutationFn: (request: CreditCardPaymentPlanRequest) =>
      creditCardPlansApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-plans"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      handleClose()
    },
  })

  const createBulkMutation = useMutation({
    mutationFn: (request: BulkCreditCardPaymentPlanRequest) =>
      creditCardPlansApi.createBulk(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["credit-card-plans"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      if (data.failedCount > 0) {
        console.warn(`${data.failedCount} plans failed to create`, data.errors)
      }
      handleClose()
    },
  })

  const handleClose = () => {
    setMode("single")
    setStep("select")
    setSelectedTransaction(null)
    setSelectedTransactionIds([])
    setSelectedAccountId(null)
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

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId)
    const accountData = transactionsByAccount[accountId]
    if (accountData) {
      // Select all transactions by default
      setSelectedTransactionIds(accountData.transactions.map((tx) => tx.id))
      setMonthlyPayment(Math.ceil(accountData.total / 10))
    }
  }

  const handleToggleTransaction = (txId: string) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(txId) ? prev.filter((id) => id !== txId) : [...prev, txId]
    )
  }

  const handleSelectAllTransactions = () => {
    if (selectedAccountData) {
      const allIds = selectedAccountData.transactions.map((tx) => tx.id)
      if (selectedTransactionIds.length === allIds.length) {
        setSelectedTransactionIds([])
      } else {
        setSelectedTransactionIds(allIds)
      }
    }
  }

  const handleProceedToConfigureMonthly = () => {
    if (selectedTransactionIds.length > 0) {
      setStep("configure")
    }
  }

  const handleSubmit = () => {
    if (mode === "single" && selectedTransaction) {
      const request: CreditCardPaymentPlanRequest = {
        transactionId: selectedTransaction.id,
        paymentType,
      }

      if (paymentType === "INSTALLMENT") {
        request.totalInstallments = totalInstallments
        request.installmentFeeRate = installmentFeeRate / 100
      } else {
        request.monthlyPayment = monthlyPayment
        request.interestRate = interestRate / 100
      }

      createMutation.mutate(request)
    } else if (mode === "monthly" && selectedTransactionIds.length > 0) {
      const request: BulkCreditCardPaymentPlanRequest = {
        transactionIds: selectedTransactionIds,
        paymentType,
      }

      if (paymentType === "INSTALLMENT") {
        request.totalInstallments = totalInstallments
        request.installmentFeeRate = installmentFeeRate / 100
      } else {
        request.monthlyPayment = monthlyPayment
        request.interestRate = interestRate / 100
      }

      createBulkMutation.mutate(request)
    }
  }

  // Calculate preview
  const calculateInstallmentPreview = () => {
    if (totalSelectedAmount <= 0) return null
    const amount = totalSelectedAmount
    const feePerInstallment = amount * (installmentFeeRate / 100)
    const totalFee = feePerInstallment * totalInstallments
    const totalAmount = amount + totalFee
    const amountPerInstallment = totalAmount / totalInstallments
    return { totalAmount, amountPerInstallment, totalFee }
  }

  const calculateRevolvingPreview = () => {
    if (totalSelectedAmount <= 0) return null
    const amount = totalSelectedAmount
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
            {/* Mode selector */}
            <div className="flex gap-2 rounded-lg bg-muted p-1">
              <button
                onClick={() => {
                  setMode("single")
                  setSelectedAccountId(null)
                  setSelectedTransactionIds([])
                }}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === "single"
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("creditCard.singleTransaction")}
              </button>
              <button
                onClick={() => {
                  setMode("monthly")
                  setSelectedTransaction(null)
                }}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === "monthly"
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="mr-1 inline-block h-4 w-4" />
                {t("creditCard.monthlyTotal")}
              </button>
            </div>

            {creditCardAccounts.length === 0 ? (
              <div className="py-8 text-center">
                <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">{t("creditCard.noCreditCardAccount")}</p>
              </div>
            ) : loadingTransactions ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : mode === "single" ? (
              // Single transaction mode - show previous month transactions
              previousMonthTransactions?.length === 0 ? (
                <div className="py-8 text-center">
                  <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">{t("creditCard.noEligibleTransactions")}</p>
                </div>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {previousMonthTransactions?.map((tx) => (
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
              )
            ) : (
              // Monthly mode
              <>
                {!selectedAccountId ? (
                  // Select account
                  Object.keys(transactionsByAccount).length === 0 ? (
                    <div className="py-8 text-center">
                      <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">{t("creditCard.noTransactionsLastMonth")}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{t("creditCard.selectAccountForMonthly")}</p>
                      {Object.values(transactionsByAccount).map(({ account, transactions: txs, total }) => (
                        <div
                          key={account.id}
                          onClick={() => handleSelectAccount(account.id)}
                          className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {txs.length} {t("creditCard.transactions")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-expense">
                                {formatCurrency(total, account.currency)}
                              </p>
                              <p className="text-xs text-muted-foreground">{t("creditCard.lastMonth")}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  // Select transactions from account
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedAccountId(null)
                          setSelectedTransactionIds([])
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        ← {t("common.back")}
                      </button>
                      <button
                        onClick={handleSelectAllTransactions}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        {selectedTransactionIds.length === selectedAccountData?.transactions.length ? (
                          <>
                            <CheckSquare className="h-4 w-4" />
                            {t("common.deselectAll")}
                          </>
                        ) : (
                          <>
                            <Square className="h-4 w-4" />
                            {t("common.selectAll")}
                          </>
                        )}
                      </button>
                    </div>

                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-sm text-muted-foreground">{t("creditCard.selectedTotal")}</p>
                      <p className="text-xl font-bold text-expense">
                        {formatCurrency(totalSelectedAmount, selectedCurrency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedTransactionIds.length} / {selectedAccountData?.transactions.length} {t("creditCard.transactionsSelected")}
                      </p>
                    </div>

                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {selectedAccountData?.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          onClick={() => handleToggleTransaction(tx.id)}
                          className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                            selectedTransactionIds.includes(tx.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-5 w-5 items-center justify-center">
                              {selectedTransactionIds.includes(tx.id) ? (
                                <CheckSquare className="h-5 w-5 text-primary" />
                              ) : (
                                <Square className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{tx.description || tx.categoryName || t("transactions.noDescription")}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(tx.transactionDate).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="font-semibold text-expense">
                              {formatCurrency(tx.amount, tx.currency)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleProceedToConfigureMonthly}
                      disabled={selectedTransactionIds.length === 0}
                    >
                      {t("common.continue")} ({selectedTransactionIds.length})
                    </Button>
                  </div>
                )}
              </>
            )}

            {mode === "single" && (
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={handleClose}>
                  {t("common.cancel")}
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "configure" && (
          <div className="space-y-4">
            {/* Selected Transaction Info */}
            <div className="rounded-lg bg-muted p-4">
              {mode === "single" && selectedTransaction ? (
                <>
                  <p className="font-medium">{selectedTransaction.description || selectedTransaction.categoryName}</p>
                  <p className="text-sm text-muted-foreground">{selectedTransaction.accountName}</p>
                  <p className="mt-2 text-xl font-bold">
                    {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">{t("creditCard.bulkPlanTitle")}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTransactionIds.length} {t("creditCard.transactions")} • {selectedAccountData?.account.name}
                  </p>
                  <p className="mt-2 text-xl font-bold">
                    {formatCurrency(totalSelectedAmount, selectedCurrency)}
                  </p>
                </>
              )}
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
                          <span>{formatCurrency(preview.totalFee, selectedCurrency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("creditCard.totalAmount")}:</span>
                          <span className="font-semibold">{formatCurrency(preview.totalAmount, selectedCurrency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("creditCard.amountPerInstallment")}:</span>
                          <span className="font-semibold">{formatCurrency(preview.amountPerInstallment, selectedCurrency)}</span>
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
                          <span>{formatCurrency(preview.totalInterest, selectedCurrency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("creditCard.totalAmount")}:</span>
                          <span className="font-semibold">{formatCurrency(preview.totalAmount, selectedCurrency)}</span>
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
              <Button
                onClick={handleSubmit}
                isLoading={createMutation.isPending || createBulkMutation.isPending}
              >
                {mode === "monthly"
                  ? t("creditCard.createPlans", { count: selectedTransactionIds.length })
                  : t("creditCard.createPlan")
                }
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
