import { useState, useEffect, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { spendingPlansApi, accountsApi, exchangeRatesApi } from "@/api"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, CurrencyInput, AlertDialog } from "@/components/ui"
import { ArrowRight } from "lucide-react"
import type { SpendingPlanItem } from "@/types"

const createExpenseSchema = (t: (key: string) => string) => z.object({
  amount: z.number().positive(t("spendingPlans.validation.amountPositive")),
  accountId: z.string().min(1, t("spendingPlans.validation.accountRequired")),
  note: z.string().optional(),
  expenseDate: z.string().optional(),
})

type ExpenseForm = z.infer<ReturnType<typeof createExpenseSchema>>

interface RecordExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  planId: string
  item: SpendingPlanItem | null
  planCurrency: string
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function RecordExpenseModal({
  isOpen,
  onClose,
  planId,
  item,
  planCurrency,
}: RecordExpenseModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [accountAmount, setAccountAmount] = useState<number>(0)
  const [planAmount, setPlanAmount] = useState<number>(0)
  const [exchangeRate, setExchangeRate] = useState<number>(1)
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  })

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const activeAccounts = accounts?.filter((a) => a.isActive)

  const expenseSchema = createExpenseSchema(t)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      accountId: "",
      note: "",
      expenseDate: new Date().toISOString().split("T")[0],
    },
  })

  const selectedAccountId = watch("accountId")
  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId)
  const accountCurrency = selectedAccount?.currency || planCurrency
  const isSameCurrency = accountCurrency === planCurrency

  const { data: rateData } = useQuery({
    queryKey: ["exchange-rate", accountCurrency, planCurrency],
    queryFn: () => exchangeRatesApi.getLatest(accountCurrency, planCurrency),
    enabled: !isSameCurrency && !!selectedAccountId,
  })

  useEffect(() => {
    if (rateData) {
      setExchangeRate(rateData.rate)
    } else if (isSameCurrency) {
      setExchangeRate(1)
    }
  }, [rateData, isSameCurrency])

  useEffect(() => {
    if (isOpen) {
      reset({
        amount: 0,
        accountId: "",
        note: "",
        expenseDate: new Date().toISOString().split("T")[0],
      })
      setAccountAmount(0)
      setPlanAmount(0)
    }
  }, [isOpen, reset])

  const handleAccountAmountChange = useCallback((value: number) => {
    setAccountAmount(value)
    if (isSameCurrency) {
      setPlanAmount(value)
      setValue("amount", value)
    } else {
      const converted = Math.round(value * exchangeRate)
      setPlanAmount(converted)
      setValue("amount", value)
    }
  }, [exchangeRate, isSameCurrency, setValue])

  const handlePlanAmountChange = useCallback((value: number) => {
    setPlanAmount(value)
    if (isSameCurrency) {
      setAccountAmount(value)
      setValue("amount", value)
    } else {
      const converted = Math.round(value / exchangeRate)
      setAccountAmount(converted)
      setValue("amount", converted)
    }
  }, [exchangeRate, isSameCurrency, setValue])

  const recordExpenseMutation = useMutation({
    mutationFn: (data: ExpenseForm) =>
      spendingPlansApi.recordExpense(planId, item!.id, {
        amount: data.amount,
        accountId: data.accountId,
        note: data.note,
        expenseDate: data.expenseDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-plan", planId] })
      queryClient.invalidateQueries({ queryKey: ["spending-plan-expenses", planId] })
      queryClient.invalidateQueries({ queryKey: ["spending-plans"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      reset()
      setAccountAmount(0)
      setPlanAmount(0)
      onClose()
    },
    onError: (error: any) => {
      setErrorDialog({ isOpen: true, message: error.response?.data?.message || t("errors.system.internal") })
    },
  })

  const onSubmit = (data: ExpenseForm) => {
    recordExpenseMutation.mutate(data)
  }

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("spendingPlans.expenses.recordFor", { name: item.name })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("spendingPlans.expenses.sourceAccount")} *</label>
            <select
              {...register("accountId")}
              className="w-full border rounded-md p-2 bg-background"
            >
              <option value="">{t("spendingPlans.expenses.selectAccount")}</option>
              {activeAccounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatCurrency(account.currentBalance, account.currency)}
                  {account.currency !== planCurrency && ` (${account.currency})`}
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-sm text-destructive mt-1">{errors.accountId.message}</p>
            )}
            {selectedAccount && (
              <p className="text-sm text-muted-foreground mt-1">
                {t("spendingPlans.expenses.currentBalance")}: {formatCurrency(selectedAccount.currentBalance, selectedAccount.currency)}
              </p>
            )}
          </div>

          {isSameCurrency ? (
            <div>
              <label className="block text-sm font-medium mb-1">{t("spendingPlans.expenses.amount")} *</label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    placeholder="1.000.000"
                    currency={planCurrency}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v)
                      setAccountAmount(v)
                      setPlanAmount(v)
                    }}
                    onBlur={field.onBlur}
                    error={errors.amount?.message}
                  />
                )}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("savings.fromAccount")} ({accountCurrency})
                  </label>
                  <CurrencyInput
                    placeholder="0"
                    currency={accountCurrency}
                    value={accountAmount}
                    onChange={handleAccountAmountChange}
                  />
                </div>
                <div className="flex items-center justify-center pb-2">
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("spendingPlans.estimated")} ({planCurrency})
                  </label>
                  <CurrencyInput
                    placeholder="0"
                    currency={planCurrency}
                    value={planAmount}
                    onChange={handlePlanAmountChange}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-2 rounded-lg text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t("savings.exchangeRate")}:</span>
                  <span>1 {accountCurrency} = {exchangeRate.toLocaleString("vi-VN", { maximumFractionDigits: 4 })} {planCurrency}</span>
                </div>
              </div>

              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t("spendingPlans.expenses.date")}</label>
            <Input {...register("expenseDate")} type="date" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("spendingPlans.expenses.note")}</label>
            <Input {...register("note")} placeholder="" />
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="text-muted-foreground">
              {isSameCurrency
                ? t("spendingPlans.expenses.hint")
                : t("spendingPlans.expenses.hintDifferentCurrency", {
                    accountAmount: formatCurrency(accountAmount, accountCurrency),
                    planAmount: formatCurrency(planAmount, planCurrency)
                  })
              }
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={recordExpenseMutation.isPending}>
              {recordExpenseMutation.isPending ? t("common.loading") : t("spendingPlans.expenses.record")}
            </Button>
          </div>
        </form>
      </DialogContent>

      <AlertDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog({ isOpen: false, message: "" })}
        title={t("common.error")}
        message={errorDialog.message}
        variant="error"
      />
    </Dialog>
  )
}
