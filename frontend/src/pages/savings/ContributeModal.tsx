import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { savingsGoalsApi, accountsApi } from "@/api"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"

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
  currency,
}: ContributeModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

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
      onClose()
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || t("errors.system.internal"))
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
                  {account.currency !== currency && ` (${account.currency})`}
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-sm text-destructive mt-1">{errors.accountId.message}</p>
            )}
            {selectedAccount && (
              <>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("savings.currentBalance")}: {formatCurrency(selectedAccount.currentBalance, selectedAccount.currency)}
                </p>
                {selectedAccount.currency !== currency && (
                  <p className="text-sm text-amber-600 mt-1">
                    {t("savings.currencyMismatchWarning", {
                      accountCurrency: selectedAccount.currency,
                      goalCurrency: currency
                    })}
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("savings.contributeAmount")} *</label>
            <Input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              placeholder="1,000,000"
            />
            {errors.amount && (
              <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
            )}
          </div>

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
              {t("savings.contributeHint")}
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
    </Dialog>
  )
}
