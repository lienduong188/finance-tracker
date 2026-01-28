import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { familiesApi } from "@/api"
import type { Family } from "@/types"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"

const familySchema = z.object({
  name: z.string().min(1, "Tên gia đình là bắt buộc").max(100),
  description: z.string().optional(),
  currency: z.string().length(3, "Mã tiền tệ phải đúng 3 ký tự").optional(),
})

type FamilyForm = z.output<typeof familySchema>

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
      description: "",
      currency: "VND",
    },
  })

  useEffect(() => {
    if (family) {
      reset({
        name: family.name,
        description: family.description || "",
        currency: family.currency,
      })
    } else {
      reset({
        name: "",
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
          <DialogTitle>{isEditing ? "Chỉnh sửa gia đình" : "Tạo gia đình mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên gia đình *</label>
            <Input {...register("name")} placeholder="Ví dụ: Gia đình Nguyễn" />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <Input {...register("description")} placeholder="Mô tả về gia đình" />
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
