import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { X, AlertCircle } from "lucide-react"
import { adminApi } from "@/api"
import { Button, Input, Label, Select } from "@/components/ui"
import type { Category } from "@/types"

function createCategorySchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("validation.required")),
    nameVi: z.string().optional(),
    nameEn: z.string().optional(),
    nameJa: z.string().optional(),
    type: z.enum(["INCOME", "EXPENSE"]),
    icon: z.string().optional(),
    color: z.string().optional(),
  })
}

type CategoryForm = z.infer<ReturnType<typeof createCategorySchema>>

interface AdminCategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
}

export function AdminCategoryFormModal({
  isOpen,
  onClose,
  category,
}: AdminCategoryFormModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEditing = !!category
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const categorySchema = createCategorySchema(t)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      nameVi: "",
      nameEn: "",
      nameJa: "",
      type: "EXPENSE",
      icon: "",
      color: "#3b82f6",
    },
  })

  useEffect(() => {
    if (!isOpen) return

    console.log("Edit category data:", category)
    setErrorMessage(null)
    if (category) {
      const formData = {
        name: category.name,
        nameVi: category.nameVi || "",
        nameEn: category.nameEn || "",
        nameJa: category.nameJa || "",
        type: category.type,
        icon: category.icon || "",
        color: category.color || "#3b82f6",
      }
      console.log("Reset form with:", formData)
      reset(formData)
    } else {
      reset({
        name: "",
        nameVi: "",
        nameEn: "",
        nameJa: "",
        type: "EXPENSE",
        icon: "",
        color: "#3b82f6",
      })
    }
  }, [category, reset, isOpen])

  const createMutation = useMutation({
    mutationFn: adminApi.createSystemCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      setErrorMessage(null)
      onClose()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t("errors.category.createFailed")
      setErrorMessage(message)
      console.error("Create category error:", error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryForm }) =>
      adminApi.updateSystemCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      setErrorMessage(null)
      onClose()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t("errors.category.updateFailed")
      setErrorMessage(message)
      console.error("Update category error:", error)
    },
  })

  const onSubmit = (data: CategoryForm) => {
    if (isEditing) {
      updateMutation.mutate({ id: category.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEditing ? "Chỉnh sửa Category" : "Thêm Category mới"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <Label htmlFor="name">Tên mặc định</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ví dụ: Ăn uống"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Multi-language names */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Tên đa ngôn ngữ (tùy chọn)</p>

            <div>
              <Label htmlFor="nameVi" className="flex items-center gap-2">
                <span>Tiếng Việt</span>
              </Label>
              <Input
                id="nameVi"
                {...register("nameVi")}
                placeholder="Ví dụ: Ăn uống"
              />
            </div>

            <div>
              <Label htmlFor="nameEn" className="flex items-center gap-2">
                <span>English</span>
              </Label>
              <Input
                id="nameEn"
                {...register("nameEn")}
                placeholder="e.g. Food & Dining"
              />
            </div>

            <div>
              <Label htmlFor="nameJa" className="flex items-center gap-2">
                <span>Japanese</span>
              </Label>
              <Input
                id="nameJa"
                {...register("nameJa")}
                placeholder="例: 食費"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type">Loại</Label>
            <Select id="type" {...register("type")}>
              <option value="EXPENSE">Chi tiêu (Expense)</option>
              <option value="INCOME">Thu nhập (Income)</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="icon">Icon (emoji)</Label>
            <Input
              id="icon"
              {...register("icon")}
              placeholder="Ví dụ: 🍜"
            />
          </div>

          <div>
            <Label htmlFor="color">Màu sắc</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                {...register("color")}
                className="h-10 w-20 p-1"
              />
              <Input
                {...register("color")}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Đang lưu..."
                : isEditing
                ? "Cập nhật"
                : "Thêm"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
