import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { familiesApi } from "@/api"
import type { Family, GroupType } from "@/types"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"

const familySchema = z.object({
  name: z.string().min(1, "Tên nhóm là bắt buộc").max(100),
  type: z.enum(["FAMILY", "FRIENDS", "WORK", "OTHER"]),
  description: z.string().optional(),
  currency: z.string().length(3, "Mã tiền tệ phải đúng 3 ký tự").optional(),
})

type FamilyForm = z.infer<typeof familySchema>

const groupTypeOptions: { value: GroupType; label: string }[] = [
  { value: "FAMILY", label: "Gia đình" },
  { value: "FRIENDS", label: "Bạn bè" },
  { value: "WORK", label: "Công việc" },
  { value: "OTHER", label: "Khác" },
]

interface FamilyFormModalProps {
  isOpen: boolean
  onClose: () => void
  family: Family | null
}

export default function FamilyFormModal({ isOpen, onClose, family }: FamilyFormModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!family

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FamilyForm>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      name: "",
      type: "FAMILY",
      description: "",
      currency: "VND",
    },
  })

  useEffect(() => {
    if (family) {
      reset({
        name: family.name,
        type: family.type || "FAMILY",
        description: family.description || "",
        currency: family.currency,
      })
    } else {
      reset({
        name: "",
        type: "FAMILY",
        description: "",
        currency: "VND",
      })
    }
  }, [family, reset])

  const createMutation = useMutation({
    mutationFn: familiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FamilyForm) => familiesApi.update(family!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] })
      onClose()
    },
  })

  const onSubmit = (data: FamilyForm) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Chỉnh sửa nhóm" : "Tạo nhóm mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên nhóm *</label>
            <Input {...register("name")} placeholder="Ví dụ: Gia đình Nguyễn, Hội bạn thân..." />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Loại nhóm *</label>
            <select {...register("type")} className="w-full border rounded-md p-2">
              {groupTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <Input {...register("description")} placeholder="Mô tả về nhóm" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tiền tệ mặc định</label>
            <select {...register("currency")} className="w-full border rounded-md p-2">
              <option value="VND">VND - Việt Nam Đồng</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : isEditing ? "Cập nhật" : "Tạo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
