import { useState, useEffect, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { savingsGoalsApi, accountsApi, exchangeRatesApi } from "@/api"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, CurrencyInput, AlertDialog } from "@/components/ui"
import { ArrowRight } from "lucide-react"

const createContributeSchema = (t: (key: string) => string) => z.object({
  amount: z.number().positive(t("savings.validation.amountPositive")),
  accountId: z.string().min(1, t("savings.validation.accountRequired")),
  note: z.string().optional(),
  contributionDate: z.string().optional(),
})

type ContributeForm = z.infer<ReturnType<typeof createContributeSchema>>

interface ContributeModalProps {
  isOpen: boolean
  onClose: () => void
  goalId: string
  goalName: string
  currency: string
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ContributeModal({
  isOpen,
  onClose,
  goalId,
  goalName,
  currency: goalCurrency,
}: ContributeModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // State for dual currency input
  const [accountAmount, setAccountAmount] = useState<number>(0)
  const [goalAmount, setGoalAmount] = useState<number>(0)
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

  const contributeSchema = createContributeSchema(t)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<ContributeForm>({
    resolver: zodResolver(contributeSchema),
    defaultValues: {
      amount: 0,
      accountId: "",
      note: "",
      contributionDate: new Date().toISOString().split("T")[0],
    },
  })

  const selectedAccountId = watch("accountId")
  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId)
  const accountCurrency = selectedAccount?.currency || goalCurrency
  const isSameCurrency = accountCurrency === goalCurrency

  // Fetch exchange rate when currencies differ
  const { data: rateData } = useQuery({
    queryKey: ["exchange-rate", accountCurrency, goalCurrency],
    queryFn: () => exchangeRatesApi.getLatest(accountCurrency, goalCurrency),
    enabled: !isSameCurrency && !!selectedAccountId,
  })

  // Update exchange rate when data changes
  useEffect(() => {
    if (rateData) {
      setExchangeRate(rateData.rate)
    } else if (isSameCurrency) {
      setExchangeRate(1)
    }
  }, [rateData, isSameCurrency])

  // Reset amounts when modal opens or account changes
  useEffect(() => {
    if (isOpen) {
      setAccountAmount(0)
      setGoalAmount(0)
    }
  }, [isOpen, selectedAccountId])

  // Calculate the other amount based on exchange rate
  const handleAccountAmountChange = useCallback((value: number) => {
    setAccountAmount(value)
    if (isSameCurrency) {
      setGoalAmount(value)
      setValue("amount", value)
    } else {
      const converted = Math.round(value * exchangeRate)
      setGoalAmount(converted)
      setValue("amount", value) // amount is always in account currency
    }
  }, [exchangeRate, isSameCurrency, setValue])

  const handleGoalAmountChange = useCallback((value: number) => {
    setGoalAmount(value)
    if (isSameCurrency) {
      setAccountAmount(value)
      setValue("amount", value)
    } else {
      const converted = Math.round(value / exchangeRate)
      setAccountAmount(converted)
      setValue("amount", converted) // amount is always in account currency
    }
  }, [exchangeRate, isSameCurrency, setValue])

  const contributeMutation = useMutation({
    mutationFn: (data: ContributeForm) =>
      savingsGoalsApi.contribute(goalId, {
        amount: data.amount,
        accountId: data.accountId,
        note: data.note,
        contributionDate: data.contributionDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goal", goalId] })
      queryClient.invalidateQueries({ queryKey: ["savings-contributions", goalId] })
      queryClient.invalidateQueries({ queryKey: ["savings-contributors", goalId] })
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      reset()
      setAccountAmount(0)
      setGoalAmount(0)
      onClose()
    },
    onError: (error: any) => {
      setErrorDialog({ isOpen: true, message: error.response?.data?.message || t("errors.system.internal") })
    },
  })

  const onSubmit = (data: ContributeForm) => {
    contributeMutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("savings.contributeTo", { name: goalName })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("savings.sourceAccount")} *</label>
            <select
              {...register("accountId")}
              className="w-full border rounded-md p-2"
            >
              <option value="">{t("savings.selectAccount")}</option>
              {activeAccounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatCurrency(account.currentBalance, account.currency)}
                  {account.currency !== goalCurrency && ` (${account.currency})`}
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-sm text-destructive mt-1">{errors.accountId.message}</p>
            )}
            {selectedAccount && (
              <p className="text-sm text-muted-foreground mt-1">
                {t("savings.currentBalance")}: {formatCurrency(selectedAccount.currentBalance, selectedAccount.currency)}
              </p>
            )}
          </div>

          {/* Amount inputs */}
          {isSameCurrency ? (
            // Same currency - single input
            <div>
              <label className="block text-sm font-medium mb-1">{t("savings.contributeAmount")} *</label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    placeholder="1.000.000"
                    currency={goalCurrency}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v)
                      setAccountAmount(v)
                      setGoalAmount(v)
                    }}
                    onBlur={field.onBlur}
                    error={errors.amount?.message}
                  />
                )}
              />
            </div>
          ) : (
            // Different currencies - dual input with exchange rate
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
                    {t("savings.toGoal")} ({goalCurrency})
                  </label>
                  <CurrencyInput
                    placeholder="0"
                    currency={goalCurrency}
                    value={goalAmount}
                    onChange={handleGoalAmountChange}
                  />
                </div>
              </div>

              {/* Exchange rate info */}
              <div className="bg-muted/50 p-2 rounded-lg text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t("savings.exchangeRate")}:</span>
                  <span>1 {accountCurrency} = {exchangeRate.toLocaleString("vi-VN", { maximumFractionDigits: 4 })} {goalCurrency}</span>
                </div>
              </div>

              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t("savings.contributeDate")}</label>
            <Input {...register("contributionDate")} type="date" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("transactions.description")}</label>
            <Input {...register("note")} placeholder={t("savings.contributeNote")} />
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="text-muted-foreground">
              {isSameCurrency
                ? t("savings.contributeHint")
                : t("savings.contributeHintDifferentCurrency", {
                    accountAmount: formatCurrency(accountAmount, accountCurrency),
                    goalAmount: formatCurrency(goalAmount, goalCurrency)
                  })
              }
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={contributeMutation.isPending}>
              {contributeMutation.isPending ? t("common.loading") : t("savings.contribute")}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Error Dialog */}
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
