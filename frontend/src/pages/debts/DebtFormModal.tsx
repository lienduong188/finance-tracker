import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { Button, Input, Label } from "@/components/ui"
import { debtsApi } from "@/api"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import type { Debt, DebtRequest } from "@/types"

function createDebtSchema(t: (key: string) => string) {
  return z.object({
    type: z.enum(["LEND", "BORROW"]),
    personName: z.string().min(1, t("validation.required")),
    amount: z.number().positive(t("validation.balanceMin")),
    currency: z.string().optional(),
    description: z.string().optional(),
    startDate: z.string(),
    dueDate: z.string().optional(),
    note: z.string().optional(),
  })
}

type DebtForm = z.infer<ReturnType<typeof createDebtSchema>>

function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value
  if (isNaN(num)) return ""
  return num.toLocaleString("en-US")
}

function parseNumber(value: string): number {
  const num = parseFloat(value.replace(/,/g, ""))
  return isNaN(num) ? 0 : num
}

interface DebtFormModalProps {
  isOpen: boolean
  onClose: () => void
  debt: Debt | null
}

export function DebtFormModal({ isOpen, onClose, debt }: DebtFormModalProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isEditing = !!debt
  const [amountDisplay, setAmountDisplay] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const debtSchema = createDebtSchema(t)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DebtForm>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      type: "LEND",
      currency: user?.defaultCurrency || "VND",
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  })

  const watchType = watch("type")

  useEffect(() => {
    if (!isOpen) return
    setErrorMessage(null)
    if (debt) {
      reset({
        type: debt.type,
        personName: debt.personName,
        amount: debt.amount,
        currency: debt.currency,
        description: debt.description || "",
        startDate: debt.startDate,
        dueDate: debt.dueDate || "",
        note: debt.note || "",
      })
      setAmountDisplay(formatNumber(debt.amount))
    } else {
      reset({
        type: "LEND",
        personName: "",
        amount: 0,
        currency: user?.defaultCurrency || "VND",
        description: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        dueDate: "",
        note: "",
      })
      setAmountDisplay("")
    }
  }, [isOpen, debt, reset, user])

  const createMutation = useMutation({
    mutationFn: (data: DebtRequest) => debtsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      setErrorMessage(null)
      onClose()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t("errors.debt.createFailed")
      setErrorMessage(message)
      console.error("Create debt error:", error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: DebtRequest) => debtsApi.update(debt!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      setErrorMessage(null)
      onClose()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t("errors.debt.updateFailed")
      setErrorMessage(message)
      console.error("Update debt error:", error)
    },
  })

  const onSubmit = (data: DebtForm) => {
    const request: DebtRequest = {
      type: data.type,
      personName: data.personName,
      amount: data.amount,
      currency: data.currency || undefined,
      description: data.description || undefined,
      startDate: data.startDate,
      dueDate: data.dueDate || undefined,
      note: data.note || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-background p-4 shadow-lg md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold md:text-xl">
            {isEditing ? t("debts.editDebt") : t("debts.addDebt")}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Debt Type Tabs */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(["LEND", "BORROW"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue("type", type)}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  watchType === type
                    ? type === "LEND"
                      ? "bg-income text-white"
                      : "bg-expense text-white"
                    : "hover:bg-background"
                )}
              >
                {t(`debts.types.${type}`)}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="personName" required>
              {t("debts.personName")}
            </Label>
            <Input
              id="personName"
              placeholder={t("debts.personNamePlaceholder")}
              error={errors.personName?.message}
              {...register("personName")}
            />
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
              error={errors.amount?.message}
              value={amountDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.]/g, "")
                const num = parseNumber(raw)
                setAmountDisplay(raw ? formatNumber(num) : "")
                setValue("amount", num)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("transactions.description")}</Label>
            <Input
              id="description"
              placeholder={t("debts.descriptionPlaceholder")}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate" required>
                {t("debts.startDate")}
              </Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">{t("debts.dueDate")}</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t("debts.note")}</Label>
            <Input
              id="note"
              placeholder={t("debts.notePlaceholder")}
              {...register("note")}
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
