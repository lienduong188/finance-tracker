import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { spendingPlansApi, familiesApi } from "@/api"
import type { SpendingPlan } from "@/types"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"

const createSpendingPlanSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t("spendingPlans.validation.nameRequired")).max(100),
  description: z.string().optional(),
  currency: z.string().length(3).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  familyId: z.string().optional(),
})

type SpendingPlanForm = z.infer<ReturnType<typeof createSpendingPlanSchema>>

interface SpendingPlanFormModalProps {
  isOpen: boolean
  onClose: () => void
  plan: SpendingPlan | null
}

const iconOptions = ["📋", "✈️", "🎂", "🏠", "💒", "🎉", "🎁", "🏖️", "🎓", "💼"]

export default function SpendingPlanFormModal({ isOpen, onClose, plan }: SpendingPlanFormModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEditing = !!plan

  const { data: families } = useQuery({
    queryKey: ["families"],
    queryFn: familiesApi.getAll,
  })

  const planSchema = createSpendingPlanSchema(t)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SpendingPlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      currency: "VND",
      icon: "📋",
      startDate: "",
      endDate: "",
      familyId: "",
    },
  })

  const selectedIcon = watch("icon")

  useEffect(() => {
    if (plan) {
      reset({
        name: plan.name,
        description: plan.description || "",
        currency: plan.currency,
        icon: plan.icon || "📋",
        color: plan.color || "",
        startDate: plan.startDate || "",
        endDate: plan.endDate || "",
        familyId: plan.familyId || "",
      })
    } else {
      reset({
        name: "",
        description: "",
        currency: "VND",
        icon: "📋",
        startDate: "",
        endDate: "",
        familyId: "",
      })
    }
  }, [plan, reset])

  const createMutation = useMutation({
    mutationFn: spendingPlansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-plans"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: SpendingPlanForm) =>
      spendingPlansApi.update(plan!.id, {
        ...data,
        familyId: data.familyId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-plans"] })
      queryClient.invalidateQueries({ queryKey: ["spending-plan", plan!.id] })
      onClose()
    },
  })

  const onSubmit = (data: SpendingPlanForm) => {
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
          <DialogTitle>{isEditing ? t("spendingPlans.editPlan") : t("spendingPlans.addPlan")}</DialogTitle>
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
            <label className="block text-sm font-medium mb-1">{t("spendingPlans.planName")} *</label>
            <Input {...register("name")} placeholder={t("spendingPlans.planNamePlaceholder")} />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("spendingPlans.planDescription")}</label>
            <Input {...register("description")} placeholder={t("spendingPlans.planDescriptionPlaceholder")} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("accounts.currency")}</label>
            <select {...register("currency")} className="w-full border rounded-md p-2 bg-background">
              <option value="VND">VND</option>
              <option value="JPY">JPY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("spendingPlans.startDate")}</label>
              <Input {...register("startDate")} type="date" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("spendingPlans.endDate")}</label>
              <Input {...register("endDate")} type="date" />
            </div>
          </div>

          {families && families.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">{t("spendingPlans.group")}</label>
              <select {...register("familyId")} className="w-full border rounded-md p-2 bg-background">
                <option value="">{t("spendingPlans.personalPlan")}</option>
                {families.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {t("spendingPlans.groupPlanHint")}
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
