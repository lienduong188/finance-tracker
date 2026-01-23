import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { X } from "lucide-react"
import { adminApi } from "@/api"
import { Button, Input, Label, Select } from "@/components/ui"
import type { Category } from "@/types"

const categorySchema = z.object({
  name: z.string().min(1, "Tên category là bắt buộc"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
  color: z.string().optional(),
})

type CategoryForm = z.output<typeof categorySchema>

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
  const queryClient = useQueryClient()
  const isEditing = !!category

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "EXPENSE",
      icon: "",
      color: "#3b82f6",
    },
  })

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        type: category.type,
        icon: category.icon || "",
        color: category.color || "#3b82f6",
      })
    } else {
      reset({
        name: "",
        type: "EXPENSE",
        icon: "",
        color: "#3b82f6",
      })
    }
  }, [category, reset])

  const createMutation = useMutation({
    mutationFn: adminApi.createSystemCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryForm }) =>
      adminApi.updateSystemCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      onClose()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
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
          <div>
            <Label htmlFor="name">Tên category</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ví dụ: Ăn uống"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
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
