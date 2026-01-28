import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { savingsGoalsApi, accountsApi } from "@/api"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"

const contributeSchema = z.object({
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  accountId: z.string().min(1, "Chọn tài khoản nguồn"),
  note: z.string().optional(),
  contributionDate: z.string().optional(),
})

type ContributeForm = z.infer<typeof contributeSchema>

interface ContributeModalProps {
  isOpen: boolean
  onClose: () => void
  goalId: string
  goalName: string
  currency: string
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ContributeModal({
  isOpen,
  onClose,
  goalId,
  goalName,
  currency,
}: ContributeModalProps) {
  const queryClient = useQueryClient()

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const filteredAccounts = accounts?.filter(
    (a) => a.isActive && a.currency === currency
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ContributeForm>({
    resolver: zodResolver(contributeSchema),
    defaultValues: {
      amount: 0,
      accountId: "",
      note: "",
      contributionDate: new Date().toISOString().split("T")[0],
    },
  })

  const selectedAccountId = watch("accountId")
  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId)

  const contributeMutation = useMutation({
    mutationFn: (data: ContributeForm) =>
      savingsGoalsApi.contribute(goalId, {
        amount: data.amount,
        accountId: data.accountId,
        note: data.note,
        contributionDate: data.contributionDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goal", goalId] })
      queryClient.invalidateQueries({ queryKey: ["savings-contributions", goalId] })
      queryClient.invalidateQueries({ queryKey: ["savings-contributors", goalId] })
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Có lỗi xảy ra")
    },
  })

  const onSubmit = (data: ContributeForm) => {
    contributeMutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đóng góp vào "{goalName}"</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tài khoản nguồn *</label>
            <select
              {...register("accountId")}
              className="w-full border rounded-md p-2"
            >
              <option value="">Chọn tài khoản</option>
              {filteredAccounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatCurrency(account.currentBalance, account.currency)}
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-sm text-destructive mt-1">{errors.accountId.message}</p>
            )}
            {selectedAccount && (
              <p className="text-sm text-muted-foreground mt-1">
                Số dư hiện tại: {formatCurrency(selectedAccount.currentBalance, selectedAccount.currency)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Số tiền đóng góp *</label>
            <Input
              {...register("amount", { valueAsNumber: true })}
              type="number"
              placeholder="1,000,000"
            />
            {errors.amount && (
              <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ngày đóng góp</label>
            <Input {...register("contributionDate")} type="date" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <Input {...register("note")} placeholder="Ghi chú (tùy chọn)" />
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="text-muted-foreground">
              Số tiền sẽ được trừ từ tài khoản nguồn và thêm vào mục tiêu tiết kiệm
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={contributeMutation.isPending}>
              {contributeMutation.isPending ? "Đang xử lý..." : "Đóng góp"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
