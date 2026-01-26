import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Button, Input, Label, Select, EmojiPicker } from "@/components/ui"
import { accountsApi } from "@/api"
import { useAuth } from "@/context/AuthContext"
import { VALIDATION } from "@/lib/validation"
import type { Account, AccountRequest } from "@/types"

interface AccountFormModalProps {
  isOpen: boolean
  onClose: () => void
  account: Account | null
}

// Format number with thousand separators
const formatNumberWithSeparator = (value: number | string, locale: string): string => {
  const num = typeof value === "string" ? parseFloat(value.replace(/[^\d.-]/g, "")) : value
  if (isNaN(num)) return ""
  // Use locale-specific formatting
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : locale === "ja" ? "ja-JP" : "en-US").format(num)
}

export function AccountFormModal({ isOpen, onClose, account }: AccountFormModalProps) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isEditing = !!account
  const [balanceDisplay, setBalanceDisplay] = useState("")
  const [creditLimitDisplay, setCreditLimitDisplay] = useState("")

  const defaultCurrency = user?.defaultCurrency || "VND"

  const accountSchema = z.object({
    name: z.string()
      .min(1, t("validation.required"))
      .max(VALIDATION.NAME_MAX, t("errors.validation.maxLength", { field: t("accounts.accountName"), max: VALIDATION.NAME_MAX })),
    type: z.enum(["CASH", "BANK", "E_WALLET", "CREDIT_CARD"]),
    currency: z.string(),
    initialBalance: z.number().min(0, t("validation.balanceMin")).max(VALIDATION.AMOUNT_MAX),
    icon: z.string().optional(),
    color: z.string().optional(),
    // Credit card specific fields
    creditLimit: z.number().min(0).max(VALIDATION.AMOUNT_MAX).optional(),
    billingDay: z.number().min(VALIDATION.BILLING_DAY_MIN).max(VALIDATION.BILLING_DAY_MAX).optional(),
    paymentDueDay: z.number().min(VALIDATION.BILLING_DAY_MIN).max(VALIDATION.BILLING_DAY_MAX).optional(),
  })

  type AccountForm = z.infer<typeof accountSchema>

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      type: "CASH",
      currency: defaultCurrency,
      initialBalance: 0,
      creditLimit: undefined,
      billingDay: undefined,
      paymentDueDay: undefined,
    },
  })

  const iconValue = watch("icon")
  const typeValue = watch("type")

  // Handle balance input change with formatting
  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "")
    const numValue = parseInt(rawValue) || 0
    setValue("initialBalance", numValue)
    setBalanceDisplay(rawValue ? formatNumberWithSeparator(numValue, i18n.language) : "")
  }

  // Handle credit limit input change with formatting
  const handleCreditLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "")
    const numValue = parseInt(rawValue) || 0
    setValue("creditLimit", numValue || undefined)
    setCreditLimitDisplay(rawValue ? formatNumberWithSeparator(numValue, i18n.language) : "")
  }

  useEffect(() => {
    if (!isOpen) return
    if (account) {
      reset({
        name: account.name,
        type: account.type,
        currency: account.currency,
        initialBalance: account.initialBalance,
        icon: account.icon || "",
        color: account.color || "",
        creditLimit: account.creditLimit || undefined,
        billingDay: account.billingDay || undefined,
        paymentDueDay: account.paymentDueDay || undefined,
      })
      setBalanceDisplay(formatNumberWithSeparator(account.initialBalance, i18n.language))
      setCreditLimitDisplay(account.creditLimit ? formatNumberWithSeparator(account.creditLimit, i18n.language) : "")
    } else {
      reset({
        name: "",
        type: "CASH",
        currency: defaultCurrency,
        initialBalance: 0,
        icon: "",
        color: "",
        creditLimit: undefined,
        billingDay: undefined,
        paymentDueDay: undefined,
      })
      setBalanceDisplay("")
      setCreditLimitDisplay("")
    }
  }, [isOpen, account, reset, defaultCurrency, i18n.language])

  const createMutation = useMutation({
    mutationFn: (data: AccountRequest) => accountsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: AccountRequest) => accountsApi.update(account!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      onClose()
    },
  })

  const onSubmit = (data: AccountForm) => {
    const request: AccountRequest = {
      name: data.name,
      type: data.type,
      currency: data.currency,
      initialBalance: data.initialBalance,
      icon: data.icon || undefined,
      color: data.color || undefined,
      // Include credit card fields only for credit card type
      creditLimit: data.type === "CREDIT_CARD" ? data.creditLimit : undefined,
      billingDay: data.type === "CREDIT_CARD" ? data.billingDay : undefined,
      paymentDueDay: data.type === "CREDIT_CARD" ? data.paymentDueDay : undefined,
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
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditing ? t("accounts.editAccount") : t("accounts.addAccount")}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" required>{t("accounts.accountName")}</Label>
            <Input
              id="name"
              placeholder={t("accounts.accountNamePlaceholder")}
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" required>{t("accounts.accountType")}</Label>
              <Select id="type" {...register("type")}>
                <option value="CASH">{t("accounts.types.CASH")}</option>
                <option value="BANK">{t("accounts.types.BANK")}</option>
                <option value="E_WALLET">{t("accounts.types.E_WALLET")}</option>
                <option value="CREDIT_CARD">{t("accounts.types.CREDIT_CARD")}</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" required>{t("accounts.currency")}</Label>
              <Select id="currency" {...register("currency")}>
                <option value="VND">VND</option>
                <option value="JPY">JPY</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialBalance" required>{t("accounts.initialBalance")}</Label>
            <Input
              id="initialBalance"
              type="text"
              inputMode="numeric"
              placeholder={t("accounts.initialBalancePlaceholder")}
              value={balanceDisplay}
              onChange={handleBalanceChange}
              error={errors.initialBalance?.message}
            />
          </div>

          {/* Credit card specific fields */}
          {typeValue === "CREDIT_CARD" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">{t("accounts.creditLimit")}</Label>
                <Input
                  id="creditLimit"
                  type="text"
                  inputMode="numeric"
                  placeholder={t("accounts.creditLimitPlaceholder")}
                  value={creditLimitDisplay}
                  onChange={handleCreditLimitChange}
                  error={errors.creditLimit?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingDay">{t("accounts.billingDay")}</Label>
                  <Input
                    id="billingDay"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="1-31"
                    {...register("billingDay", { valueAsNumber: true })}
                    error={errors.billingDay?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDueDay">{t("accounts.paymentDueDay")}</Label>
                  <Input
                    id="paymentDueDay"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="1-31"
                    {...register("paymentDueDay", { valueAsNumber: true })}
                    error={errors.paymentDueDay?.message}
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("accounts.icon")}</Label>
              <EmojiPicker
                value={iconValue}
                onChange={(emoji) => setValue("icon", emoji)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">{t("accounts.color")}</Label>
              <Input
                id="color"
                type="color"
                className="h-10 p-1"
                {...register("color")}
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
