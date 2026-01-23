import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { format } from "date-fns"
import { Button, Input, Label, Select } from "@/components/ui"
import { transactionsApi, accountsApi, categoriesApi } from "@/api"
import { cn } from "@/lib/utils"
import type { Transaction, TransactionRequest, TransactionType } from "@/types"

const transactionSchema = z.object({
  accountId: z.string().min(1, "Chọn tài khoản"),
  categoryId: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  description: z.string().optional(),
  transactionDate: z.string(),
  toAccountId: z.string().optional(),
})

type TransactionForm = z.infer<typeof transactionSchema>

interface TransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
}

export function TransactionFormModal({
  isOpen,
  onClose,
  transaction,
}: TransactionFormModalProps) {
  const queryClient = useQueryClient()
  const isEditing = !!transaction
  const [selectedType, setSelectedType] = useState<TransactionType>("EXPENSE")

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      transactionDate: format(new Date(), "yyyy-MM-dd"),
    },
  })

  const watchType = watch("type")

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const { data: categories } = useQuery({
    queryKey: ["categories", selectedType === "TRANSFER" ? "EXPENSE" : selectedType],
    queryFn: () =>
      categoriesApi.getByType(selectedType === "TRANSFER" ? "EXPENSE" : selectedType),
    enabled: selectedType !== "TRANSFER",
  })

  useEffect(() => {
    if (transaction) {
      reset({
        accountId: transaction.accountId,
        categoryId: transaction.categoryId || "",
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || "",
        transactionDate: transaction.transactionDate,
        toAccountId: transaction.toAccountId || "",
      })
      setSelectedType(transaction.type)
    } else {
      reset({
        accountId: "",
        categoryId: "",
        type: "EXPENSE",
        amount: 0,
        description: "",
        transactionDate: format(new Date(), "yyyy-MM-dd"),
        toAccountId: "",
      })
      setSelectedType("EXPENSE")
    }
  }, [transaction, reset])

  useEffect(() => {
    setSelectedType(watchType)
  }, [watchType])

  const createMutation = useMutation({
    mutationFn: (data: TransactionRequest) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: TransactionRequest) =>
      transactionsApi.update(transaction!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
      onClose()
    },
  })

  const onSubmit = (data: TransactionForm) => {
    const request: TransactionRequest = {
      accountId: data.accountId,
      categoryId: data.categoryId || undefined,
      type: data.type,
      amount: data.amount,
      description: data.description || undefined,
      transactionDate: data.transactionDate,
      toAccountId: data.type === "TRANSFER" ? data.toAccountId : undefined,
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
            {isEditing ? "Chỉnh sửa giao dịch" : "Thêm giao dịch mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Transaction Type Tabs */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue("type", type)}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  watchType === type
                    ? type === "INCOME"
                      ? "bg-income text-white"
                      : type === "EXPENSE"
                        ? "bg-expense text-white"
                        : "bg-transfer text-white"
                    : "hover:bg-background"
                )}
              >
                {type === "INCOME"
                  ? "Thu nhập"
                  : type === "EXPENSE"
                    ? "Chi tiêu"
                    : "Chuyển khoản"}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" required>
              Số tiền
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              error={errors.amount?.message}
              {...register("amount", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId" required>
              {watchType === "TRANSFER" ? "Từ tài khoản" : "Tài khoản"}
            </Label>
            <Select id="accountId" error={errors.accountId?.message} {...register("accountId")}>
              <option value="">Chọn tài khoản</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currentBalance.toLocaleString()} {account.currency})
                </option>
              ))}
            </Select>
          </div>

          {watchType === "TRANSFER" && (
            <div className="space-y-2">
              <Label htmlFor="toAccountId" required>
                Đến tài khoản
              </Label>
              <Select id="toAccountId" {...register("toAccountId")}>
                <option value="">Chọn tài khoản</option>
                {accounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {watchType !== "TRANSFER" && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">Danh mục</Label>
              <Select id="categoryId" {...register("categoryId")}>
                <option value="">Chọn danh mục</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="transactionDate" required>
              Ngày giao dịch
            </Label>
            <Input
              id="transactionDate"
              type="date"
              {...register("transactionDate")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Ghi chú</Label>
            <Input
              id="description"
              placeholder="Mô tả giao dịch..."
              {...register("description")}
            />
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
