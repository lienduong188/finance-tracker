import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { savingsGoalsApi, familiesApi } from "@/api"
import type { SavingsGoal } from "@/types"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, CurrencyInput } from "@/components/ui"

const createSavingsSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t("savings.validation.nameRequired")).max(100),
  description: z.string().optional(),
  targetAmount: z.number().positive(t("savings.validation.amountPositive")),
  currency: z.string().length(3).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  targetDate: z.string().optional(),
  familyId: z.string().optional(),
})

type SavingsForm = z.infer<ReturnType<typeof createSavingsSchema>>

interface SavingsFormModalProps {
  isOpen: boolean
  onClose: () => void
  goal: SavingsGoal | null
}

const iconOptions = ["🎯", "✈️", "🎂", "🏠", "🚗", "💻", "📱", "🎓", "💍", "🏥"]

export default function SavingsFormModal({ isOpen, onClose, goal }: SavingsFormModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEditing = !!goal

  const { data: families } = useQuery({
    queryKey: ["families"],
    queryFn: familiesApi.getAll,
  })

  const savingsSchema = createSavingsSchema(t)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<SavingsForm>({
    resolver: zodResolver(savingsSchema),
    defaultValues: {
      name: "",
      description: "",
      targetAmount: 0,
      currency: "VND",
      icon: "🎯",
      targetDate: "",
      familyId: "",
    },
  })

  const selectedIcon = watch("icon")
  const watchCurrency = watch("currency")

  useEffect(() => {
    if (goal) {
      reset({
        name: goal.name,
        description: goal.description || "",
        targetAmount: goal.targetAmount,
        currency: goal.currency,
        icon: goal.icon || "🎯",
        color: goal.color || "",
        targetDate: goal.targetDate || "",
        familyId: goal.familyId || "",
      })
    } else {
      reset({
        name: "",
        description: "",
        targetAmount: 0,
        currency: "VND",
        icon: "🎯",
        targetDate: "",
        familyId: "",
      })
    }
  }, [goal, reset])

  const createMutation = useMutation({
    mutationFn: savingsGoalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: SavingsForm) =>
      savingsGoalsApi.update(goal!.id, {
        ...data,
        familyId: data.familyId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      onClose()
    },
  })

  const onSubmit = (data: SavingsForm) => {
    const payload = {
      ...data,
      familyId: data.familyId || undefined,
    }
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t("savings.editGoal") : t("savings.newGoal")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`text-2xl p-2 rounded-lg border ${
                    selectedIcon === icon ? "border-primary bg-primary/10" : "border-muted"
                  }`}
                  onClick={() => setValue("icon", icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("savings.goalName")} *</label>
            <Input {...register("name")} placeholder={t("savings.goalNamePlaceholder")} />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("savings.goalDescription")}</label>
            <Input {...register("description")} placeholder={t("savings.goalDescriptionPlaceholder")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("savings.targetAmount")} *</label>
              <Controller
                name="targetAmount"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    placeholder="10.000.000"
                    currency={watchCurrency || "VND"}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.targetAmount?.message}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("accounts.currency")}</label>
              <select {...register("currency")} className="w-full border rounded-md p-2">
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("savings.targetDate")}</label>
            <Input {...register("targetDate")} type="date" />
          </div>

          {!isEditing && families && families.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">{t("savings.group")}</label>
              <select {...register("familyId")} className="w-full border rounded-md p-2">
                <option value="">{t("savings.personalGoal")}</option>
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {t("savings.groupGoalHint")}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("common.loading") : isEditing ? t("common.update") : t("common.add")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
