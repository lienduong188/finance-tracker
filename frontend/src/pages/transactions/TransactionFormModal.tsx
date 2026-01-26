import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { format } from "date-fns"
import { Button, Input, Label, Select } from "@/components/ui"
import { transactionsApi, accountsApi, categoriesApi } from "@/api"
import { cn, getCategoryName } from "@/lib/utils"
import type { Transaction, TransactionRequest, TransactionType } from "@/types"

// Format number with thousand separators
const formatNumberWithSeparator = (value: number | string, locale: string): string => {
  const num = typeof value === "string" ? parseFloat(value.replace(/[^\d.-]/g, "")) : value
  if (isNaN(num) || num === 0) return ""
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : locale === "ja" ? "ja-JP" : "en-US").format(num)
}

const baseTransactionSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive(),
  description: z.string().optional(),
  transactionDate: z.string(),
  toAccountId: z.string().optional(),
})

type TransactionForm = z.infer<typeof baseTransactionSchema>

interface TransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
}

export function TransactionFormModal({
  isOpen,
  onClose,
  transaction,
}: TransactionFormModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const isEditing = !!transaction
  const [selectedType, setSelectedType] = useState<TransactionType>("EXPENSE")
  const [amountDisplay, setAmountDisplay] = useState("")

  const transactionSchema = z.object({
    accountId: z.string().min(1, t("validation.required")),
    categoryId: z.string().optional(),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    amount: z.number().positive(t("validation.balanceMin")),
    description: z.string().optional(),
    transactionDate: z.string(),
    toAccountId: z.string().optional(),
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      transactionDate: format(new Date(), "yyyy-MM-dd"),
    },
  })

  const watchType = watch("type")

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const { data: categoriesRaw } = useQuery({
    queryKey: ["categories", selectedType === "TRANSFER" ? "EXPENSE" : selectedType],
    queryFn: () =>
      categoriesApi.getByType(selectedType === "TRANSFER" ? "EXPENSE" : selectedType),
    enabled: selectedType !== "TRANSFER",
  })

  // Filter out duplicate categories by name
  const categories = categoriesRaw?.filter(
    (category, index, self) => self.findIndex((c) => c.name === category.name) === index
  )

  // Handle amount input change with formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "")
    const numValue = parseInt(rawValue) || 0
    setValue("amount", numValue)
    setAmountDisplay(rawValue ? formatNumberWithSeparator(numValue, i18n.language) : "")
  }

  useEffect(() => {
    if (!isOpen) return
    if (transaction) {
      reset({
        accountId: transaction.accountId,
        categoryId: transaction.categoryId || "",
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || "",
        transactionDate: transaction.transactionDate,
        toAccountId: transaction.toAccountId || "",
      })
      setSelectedType(transaction.type)
      setAmountDisplay(formatNumberWithSeparator(transaction.amount, i18n.language))
    } else {
      reset({
        accountId: "",
        categoryId: "",
        type: "EXPENSE",
        amount: 0,
        description: "",
        transactionDate: format(new Date(), "yyyy-MM-dd"),
        toAccountId: "",
      })
      setSelectedType("EXPENSE")
      setAmountDisplay("")
    }
  }, [isOpen, transaction, reset, i18n.language])

  useEffect(() => {
    setSelectedType(watchType)
  }, [watchType])

  const createMutation = useMutation({
    mutationFn: (data: TransactionRequest) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: TransactionRequest) =>
      transactionsApi.update(transaction!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      onClose()
    },
  })

  const onSubmit = (data: TransactionForm) => {
    const request: TransactionRequest = {
      accountId: data.accountId,
      categoryId: data.categoryId || undefined,
      type: data.type,
      amount: data.amount,
      description: data.description || undefined,
      transactionDate: data.transactionDate,
      toAccountId: data.type === "TRANSFER" ? data.toAccountId : undefined,
    }

    if (isEditing) {
      updateMutation.mutate(request)
    } else {
      createMutation.mutate(request)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditing ? t("transactions.editTransaction") : t("transactions.addTransaction")}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Transaction Type Tabs */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue("type", type)}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  watchType === type
                    ? type === "INCOME"
                      ? "bg-income text-white"
                      : type === "EXPENSE"
                        ? "bg-expense text-white"
                        : "bg-transfer text-white"
                    : "hover:bg-background"
                )}
              >
                {t(`transactions.types.${type}`)}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" required>
              {t("transactions.amount")}
            </Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amountDisplay}
              onChange={handleAmountChange}
              error={errors.amount?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId" required>
              {watchType === "TRANSFER" ? t("transactions.account") : t("transactions.account")}
            </Label>
            <Select id="accountId" error={errors.accountId?.message} {...register("accountId")}>
              <option value="">{t("validation.required")}</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currentBalance.toLocaleString()} {account.currency})
                </option>
              ))}
            </Select>
          </div>

          {watchType === "TRANSFER" && (
            <div className="space-y-2">
              <Label htmlFor="toAccountId">
                {t("transactions.toAccount")}
              </Label>
              <Input
                id="toAccountId"
                placeholder={t("transactions.toAccountPlaceholder")}
                {...register("toAccountId")}
              />
            </div>
          )}

          {watchType !== "TRANSFER" && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">{t("transactions.category")}</Label>
              <Select id="categoryId" {...register("categoryId")}>
                <option value="">{t("common.all")}</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {getCategoryName(category, i18n.language)}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="transactionDate" required>
              {t("transactions.date")}
            </Label>
            <Input
              id="transactionDate"
              type="date"
              {...register("transactionDate")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("transactions.description")}</Label>
            <Input
              id="description"
              placeholder={t("transactions.description")}
              {...register("description")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEditing ? t("common.update") : t("common.add")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
