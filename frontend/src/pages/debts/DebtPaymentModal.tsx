import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { X, AlertCircle } from "lucide-react"
import { AxiosError } from "axios"
import { format } from "date-fns"
import { Button, Input, Label, Select } from "@/components/ui"
import { debtsApi, accountsApi } from "@/api"
import { formatCurrency } from "@/lib/utils"
import type { Debt, ApiError } from "@/types"

function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value
  if (isNaN(num)) return ""
  return num.toLocaleString("en-US")
}

function parseNumber(value: string): number {
  const num = parseFloat(value.replace(/,/g, ""))
  return isNaN(num) ? 0 : num
}

interface DebtPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  debt: Debt | null
}

export function DebtPaymentModal({ isOpen, onClose, debt }: DebtPaymentModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [amountDisplay, setAmountDisplay] = useState("")
  const [amount, setAmount] = useState(0)
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [accountId, setAccountId] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
    enabled: isOpen,
  })

  const paymentMutation = useMutation({
    mutationFn: () =>
      debtsApi.recordPayment(debt!.id, {
        amount,
        paymentDate: paymentDate || undefined,
        accountId: accountId || undefined,
        note: note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      handleClose()
    },
    onError: (err: unknown) => {
      let message = t("errors.debt.paymentFailed")
      if (err instanceof AxiosError && err.response?.data) {
        const apiError = err.response.data as ApiError
        message = apiError.message || err.message
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
      console.error("Record payment error:", err)
    },
  })

  const handleClose = () => {
    setAmountDisplay("")
    setAmount(0)
    setPaymentDate(format(new Date(), "yyyy-MM-dd"))
    setAccountId("")
    setNote("")
    setError("")
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (amount <= 0) {
      setError(t("debts.amountRequired"))
      return
    }

    if (debt && amount > debt.remainingAmount) {
      setError(t("debts.amountExceedsRemaining"))
      return
    }

    paymentMutation.mutate()
  }

  if (!isOpen || !debt) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-4 shadow-lg md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold md:text-xl">{t("debts.recordPayment")}</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-muted p-3">
          <p className="font-medium">{debt.personName}</p>
          <p className="text-sm text-muted-foreground">
            {t("debts.remaining")}: {formatCurrency(debt.remainingAmount, debt.currency)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="paymentAmount" required>
              {t("debts.paymentAmount")}
            </Label>
            <Input
              id="paymentAmount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amountDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.]/g, "")
                const num = parseNumber(raw)
                setAmountDisplay(raw ? formatNumber(num) : "")
                setAmount(num)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate" required>
              {t("debts.paymentDate")}
            </Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">{t("debts.paymentAccount")}</Label>
            <Select
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">{t("common.select")}</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentNote">{t("debts.note")}</Label>
            <Input
              id="paymentNote"
              placeholder={t("debts.paymentNotePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isLoading={paymentMutation.isPending}>
              {t("debts.confirm")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
