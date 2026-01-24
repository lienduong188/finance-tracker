import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { format } from "date-fns"
import { Button, Input, Label, Select } from "@/components/ui"
import { recurringApi, accountsApi, categoriesApi } from "@/api"
import { cn } from "@/lib/utils"
import type { RecurringTransaction, RecurringTransactionRequest, TransactionType } from "@/types"

const recurringSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive(),
  description: z.string().optional(),
  toAccountId: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  intervalValue: z.number().min(1),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  maxExecutions: z.number().optional(),
})

type RecurringForm = z.output<typeof recurringSchema>

interface RecurringTransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  recurring: RecurringTransaction | null
}

export function RecurringTransactionFormModal({
  isOpen,
  onClose,
  recurring,
}: RecurringTransactionFormModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEditing = !!recurring
  const [selectedType, setSelectedType] = useState<TransactionType>("EXPENSE")

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      type: "EXPENSE",
      frequency: "MONTHLY",
      intervalValue: 1,
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  })

  const watchType = watch("type")
  const watchFrequency = watch("frequency")

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const { data: categories } = useQuery({
    queryKey: ["categories", selectedType === "TRANSFER" ? "EXPENSE" : selectedType],
    queryFn: () =>
      categoriesApi.getByType(selectedType === "TRANSFER" ? "EXPENSE" : selectedType),
    enabled: selectedType !== "TRANSFER",
  })

  useEffect(() => {
    if (recurring) {
      reset({
        accountId: recurring.accountId,
        categoryId: recurring.categoryId || "",
        type: recurring.type,
        amount: recurring.amount,
        description: recurring.description || "",
        toAccountId: recurring.toAccountId || "",
        frequency: recurring.frequency,
        intervalValue: recurring.intervalValue,
        dayOfWeek: recurring.dayOfWeek ?? undefined,
        dayOfMonth: recurring.dayOfMonth ?? undefined,
        startDate: recurring.startDate,
        endDate: recurring.endDate || "",
        maxExecutions: recurring.maxExecutions ?? undefined,
      })
      setSelectedType(recurring.type)
    } else {
      reset({
        accountId: "",
        categoryId: "",
        type: "EXPENSE",
        amount: 0,
        description: "",
        toAccountId: "",
        frequency: "MONTHLY",
        intervalValue: 1,
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: "",
      })
      setSelectedType("EXPENSE")
    }
  }, [recurring, reset])

  useEffect(() => {
    setSelectedType(watchType)
  }, [watchType])

  const createMutation = useMutation({
    mutationFn: (data: RecurringTransactionRequest) => recurringApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: RecurringTransactionRequest) =>
      recurringApi.update(recurring!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] })
      onClose()
    },
  })

  const onSubmit = (data: RecurringForm) => {
    const request: RecurringTransactionRequest = {
      accountId: data.accountId,
      categoryId: data.categoryId || undefined,
      type: data.type,
      amount: data.amount,
      description: data.description || undefined,
      toAccountId: data.type === "TRANSFER" ? data.toAccountId : undefined,
      frequency: data.frequency,
      intervalValue: data.intervalValue,
      dayOfWeek: data.frequency === "WEEKLY" ? data.dayOfWeek : undefined,
      dayOfMonth: data.frequency === "MONTHLY" ? data.dayOfMonth : undefined,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      maxExecutions: data.maxExecutions || undefined,
    }

    if (isEditing) {
      updateMutation.mutate(request)
    } else {
      createMutation.mutate(request)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  if (!isOpen) return null

  const daysOfWeek = [
    { value: 0, label: t("recurring.days.sunday") },
    { value: 1, label: t("recurring.days.monday") },
    { value: 2, label: t("recurring.days.tuesday") },
    { value: 3, label: t("recurring.days.wednesday") },
    { value: 4, label: t("recurring.days.thursday") },
    { value: 5, label: t("recurring.days.friday") },
    { value: 6, label: t("recurring.days.saturday") },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-background p-4 shadow-lg md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold md:text-xl">
            {isEditing ? t("recurring.editRecurring") : t("recurring.addRecurring")}
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
                  "flex-1 rounded-md px-2 py-2 text-xs font-medium transition-colors md:px-3 md:text-sm",
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
              type="number"
              placeholder="0"
              error={errors.amount?.message}
              {...register("amount", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId" required>
              {t("transactions.account")}
            </Label>
            <Select id="accountId" error={errors.accountId?.message} {...register("accountId")}>
              <option value="">{t("validation.required")}</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </Select>
          </div>

          {watchType === "TRANSFER" && (
            <div className="space-y-2">
              <Label htmlFor="toAccountId" required>
                {t("transactions.toAccount")}
              </Label>
              <Select id="toAccountId" {...register("toAccountId")}>
                <option value="">{t("validation.required")}</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {watchType !== "TRANSFER" && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">{t("transactions.category")}</Label>
              <Select id="categoryId" {...register("categoryId")}>
                <option value="">{t("common.all")}</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">{t("transactions.description")}</Label>
            <Input
              id="description"
              placeholder={t("transactions.description")}
              {...register("description")}
            />
          </div>

          {/* Frequency Section */}
          <div className="border-t pt-4">
            <h3 className="mb-3 font-medium">{t("recurring.frequency")}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="frequency" required>
                  {t("recurring.repeatEvery")}
                </Label>
                <Select id="frequency" {...register("frequency")}>
                  <option value="DAILY">{t("recurring.daily")}</option>
                  <option value="WEEKLY">{t("recurring.weekly")}</option>
                  <option value="MONTHLY">{t("recurring.monthly")}</option>
                  <option value="YEARLY">{t("recurring.yearly")}</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervalValue">{t("recurring.interval")}</Label>
                <Input
                  id="intervalValue"
                  type="number"
                  min={1}
                  {...register("intervalValue", { valueAsNumber: true })}
                />
              </div>
            </div>

            {watchFrequency === "WEEKLY" && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="dayOfWeek">{t("recurring.dayOfWeek")}</Label>
                <Select id="dayOfWeek" {...register("dayOfWeek", { valueAsNumber: true })}>
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {watchFrequency === "MONTHLY" && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="dayOfMonth">{t("recurring.dayOfMonth")}</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="1-31"
                  {...register("dayOfMonth", { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          {/* Schedule Section */}
          <div className="border-t pt-4">
            <h3 className="mb-3 font-medium">{t("recurring.schedule")}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startDate" required>
                  {t("recurring.startDate")}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">{t("recurring.endDate")}</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                />
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <Label htmlFor="maxExecutions">{t("recurring.maxExecutions")}</Label>
              <Input
                id="maxExecutions"
                type="number"
                min={1}
                placeholder={t("recurring.unlimited")}
                {...register("maxExecutions", { valueAsNumber: true })}
              />
            </div>
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
