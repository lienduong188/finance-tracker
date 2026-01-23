import { useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { Button, Input, Label, Select } from "@/components/ui"
import { accountsApi } from "@/api"
import type { Account, AccountRequest } from "@/types"

const accountSchema = z.object({
  name: z.string().min(1, "Tên tài khoản là bắt buộc"),
  type: z.enum(["CASH", "BANK", "E_WALLET", "CREDIT_CARD"]),
  currency: z.string(),
  initialBalance: z.number().min(0, "Số dư không được âm"),
  icon: z.string().optional(),
  color: z.string().optional(),
})

type AccountForm = z.infer<typeof accountSchema>

interface AccountFormModalProps {
  isOpen: boolean
  onClose: () => void
  account: Account | null
}

export function AccountFormModal({ isOpen, onClose, account }: AccountFormModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!account

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      type: "CASH",
      currency: "VND",
      initialBalance: 0,
    },
  })

  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        type: account.type,
        currency: account.currency,
        initialBalance: account.initialBalance,
        icon: account.icon || "",
        color: account.color || "",
      })
    } else {
      reset({
        name: "",
        type: "CASH",
        currency: "VND",
        initialBalance: 0,
        icon: "",
        color: "",
      })
    }
  }, [account, reset])

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
            {isEditing ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" required>Tên tài khoản</Label>
            <Input
              id="name"
              placeholder="VD: Vietcombank, Tiền mặt, MoMo"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" required>Loại tài khoản</Label>
              <Select id="type" {...register("type")}>
                <option value="CASH">Tiền mặt</option>
                <option value="BANK">Ngân hàng</option>
                <option value="E_WALLET">Ví điện tử</option>
                <option value="CREDIT_CARD">Thẻ tín dụng</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" required>Tiền tệ</Label>
              <Select id="currency" {...register("currency")}>
                <option value="VND">VND</option>
                <option value="JPY">JPY</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialBalance" required>Số dư ban đầu</Label>
            <Input
              id="initialBalance"
              type="number"
              placeholder="0"
              error={errors.initialBalance?.message}
              {...register("initialBalance", { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (emoji)</Label>
              <Input
                id="icon"
                placeholder="💰"
                {...register("icon")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Màu sắc</Label>
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
