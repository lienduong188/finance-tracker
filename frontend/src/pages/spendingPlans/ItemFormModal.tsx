import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { spendingPlansApi, categoriesApi } from "@/api"
import type { SpendingPlanItem } from "@/types"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, CurrencyInput } from "@/components/ui"

const createItemSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t("spendingPlans.validation.itemNameRequired")).max(100),
  estimatedAmount: z.number().positive(t("spendingPlans.validation.amountPositive")),
  categoryId: z.string().optional(),
  icon: z.string().optional(),
  notes: z.string().optional(),
})

type ItemForm = z.infer<ReturnType<typeof createItemSchema>>

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  planId: string
  item: SpendingPlanItem | null
}

const iconOptions = ["📦", "✈️", "🏨", "🍽️", "🚗", "🎫", "🛍️", "📸", "🎁", "💊"]

export default function ItemFormModal({ isOpen, onClose, planId, item }: ItemFormModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEditing = !!item

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  })

  const expenseCategories = categories?.filter(c => c.type === "EXPENSE") || []

  const itemSchema = createItemSchema(t)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      estimatedAmount: 0,
      categoryId: "",
      icon: "📦",
      notes: "",
    },
  })

  const selectedIcon = watch("icon")

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        estimatedAmount: item.estimatedAmount,
        categoryId: item.categoryId || "",
        icon: item.icon || "📦",
        notes: item.notes || "",
      })
    } else {
      reset({
        name: "",
        estimatedAmount: 0,
        categoryId: "",
        icon: "📦",
        notes: "",
      })
    }
  }, [item, reset])

  const createMutation = useMutation({
    mutationFn: (data: ItemForm) => spendingPlansApi.addItem(planId, {
      ...data,
      categoryId: data.categoryId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-plan", planId] })
      queryClient.invalidateQueries({ queryKey: ["spending-plans"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ItemForm) => spendingPlansApi.updateItem(planId, item!.id, {
      ...data,
      categoryId: data.categoryId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-plan", planId] })
      queryClient.invalidateQueries({ queryKey: ["spending-plans"] })
      onClose()
    },
  })

  const onSubmit = (data: ItemForm) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("spendingPlans.items.edit") : t("spendingPlans.items.add")}
          </DialogTitle>
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
            <label className="block text-sm font-medium mb-1">{t("spendingPlans.items.name")} *</label>
            <Input {...register("name")} placeholder={t("spendingPlans.items.namePlaceholder")} />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("spendingPlans.items.estimatedAmount")} *</label>
            <Controller
              name="estimatedAmount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  placeholder="1.000.000"
                  currency="VND"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.estimatedAmount?.message}
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("spendingPlans.items.category")}</label>
            <select {...register("categoryId")} className="w-full border rounded-md p-2 bg-background">
              <option value="">-- {t("common.select")} --</option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("spendingPlans.items.notes")}</label>
            <Input {...register("notes")} placeholder="" />
          </div>

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
