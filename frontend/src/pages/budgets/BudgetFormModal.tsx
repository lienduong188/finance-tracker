import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { format } from "date-fns"
import { Button, Input, Label, Select } from "@/components/ui"
import { budgetsApi, categoriesApi } from "@/api"
import type { Budget, BudgetRequest } from "@/types"

const budgetSchema = z.object({
  name: z.string().min(1, "Tên ngân sách là bắt buộc"),
  categoryId: z.string().optional(),
  amount: z.number().positive("Hạn mức phải lớn hơn 0"),
  currency: z.string(),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]),
  startDate: z.string(),
  endDate: z.string().optional(),
  alertThreshold: z.number().min(1).max(100),
})

type BudgetForm = z.infer<typeof budgetSchema>

interface BudgetFormModalProps {
  isOpen: boolean
  onClose: () => void
  budget: Budget | null
}

export function BudgetFormModal({ isOpen, onClose, budget }: BudgetFormModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!budget

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      period: "MONTHLY",
      currency: "VND",
      alertThreshold: 80,
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  })

  const watchPeriod = watch("period")

  const { data: categories } = useQuery({
    queryKey: ["categories", "EXPENSE"],
    queryFn: () => categoriesApi.getByType("EXPENSE"),
  })

  useEffect(() => {
    if (budget) {
      reset({
        name: budget.name,
        categoryId: budget.categoryId || "",
        amount: budget.amount,
        currency: budget.currency,
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate || "",
        alertThreshold: budget.alertThreshold,
      })
    } else {
      reset({
        name: "",
        categoryId: "",
        amount: 0,
        currency: "VND",
        period: "MONTHLY",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: "",
        alertThreshold: 80,
      })
    }
  }, [budget, reset])

  const createMutation = useMutation({
    mutationFn: (data: BudgetRequest) => budgetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: BudgetRequest) => budgetsApi.update(budget!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      onClose()
    },
  })

  const onSubmit = (data: BudgetForm) => {
    const request: BudgetRequest = {
      name: data.name,
      categoryId: data.categoryId || undefined,
      amount: data.amount,
      currency: data.currency,
      period: data.period,
      startDate: data.startDate,
      endDate: data.period === "CUSTOM" && data.endDate ? data.endDate : undefined,
      alertThreshold: data.alertThreshold,
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
            {isEditing ? "Chỉnh sửa ngân sách" : "Thêm ngân sách mới"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" required>Tên ngân sách</Label>
            <Input
              id="name"
              placeholder="VD: Chi tiêu tháng 1, Tiền ăn..."
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">{t("transactions.category")}</Label>
            <Select id="categoryId" {...register("categoryId")}>
              <option value="">{t("common.all")}</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {t(`categories.${category.name}`, category.name)}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" required>Hạn mức</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                error={errors.amount?.message}
                {...register("amount", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Tiền tệ</Label>
              <Select id="currency" {...register("currency")}>
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="period" required>Chu kỳ</Label>
            <Select id="period" {...register("period")}>
              <option value="DAILY">Hằng ngày</option>
              <option value="WEEKLY">Hằng tuần</option>
              <option value="MONTHLY">Hằng tháng</option>
              <option value="YEARLY">Hằng năm</option>
              <option value="CUSTOM">Tùy chỉnh</option>
            </Select>
          </div>

          {watchPeriod === "CUSTOM" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" required>Ngày bắt đầu</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" required>Ngày kết thúc</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="alertThreshold">Ngưỡng cảnh báo (%)</Label>
            <Input
              id="alertThreshold"
              type="number"
              min={1}
              max={100}
              placeholder="80"
              {...register("alertThreshold", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Bạn sẽ được cảnh báo khi chi tiêu đạt ngưỡng này
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEditing ? "Cập nhật" : "Thêm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
