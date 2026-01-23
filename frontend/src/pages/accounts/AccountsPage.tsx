import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Wallet, Building2, Smartphone, CreditCard, Pencil, Trash2 } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { accountsApi } from "@/api"
import { formatCurrency } from "@/lib/utils"
import type { Account, AccountType } from "@/types"
import { AccountFormModal } from "./AccountFormModal"

const accountTypeIcons: Record<AccountType, typeof Wallet> = {
  CASH: Wallet,
  BANK: Building2,
  E_WALLET: Smartphone,
  CREDIT_CARD: CreditCard,
}

const accountTypeLabels: Record<AccountType, string> = {
  CASH: "Tiền mặt",
  BANK: "Ngân hàng",
  E_WALLET: "Ví điện tử",
  CREDIT_CARD: "Thẻ tín dụng",
}

export function AccountsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
    },
  })

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.currentBalance, 0) || 0

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xóa tài khoản này?")) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAccount(null)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tài khoản</h1>
          <p className="text-muted-foreground">
            Quản lý các nguồn tiền của bạn
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm tài khoản
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <p className="text-sm opacity-90">Tổng số dư</p>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="mt-2 text-sm opacity-75">
            {accounts?.length || 0} tài khoản đang hoạt động
          </p>
        </CardContent>
      </Card>

      {/* Account List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((account) => {
          const Icon = accountTypeIcons[account.type]
          return (
            <Card key={account.id} className="group relative">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: account.color || "#e2e8f0" }}
                  >
                    {account.icon ? (
                      <span className="text-xl">{account.icon}</span>
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{account.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {accountTypeLabels[account.type]}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(account)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(account.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(account.currentBalance, account.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Số dư ban đầu: {formatCurrency(account.initialBalance, account.currency)}
                </p>
              </CardContent>
            </Card>
          )
        })}

        {/* Add Account Card */}
        <Card
          className="flex cursor-pointer items-center justify-center border-dashed hover:border-primary hover:bg-accent/50"
          onClick={() => setIsModalOpen(true)}
        >
          <CardContent className="flex flex-col items-center p-6 text-muted-foreground">
            <Plus className="mb-2 h-8 w-8" />
            <p>Thêm tài khoản mới</p>
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      <AccountFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        account={editingAccount}
      />
    </div>
  )
}
