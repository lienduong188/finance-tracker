import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Plus, Wallet, Building2, Smartphone, CreditCard, Pencil, Trash2 } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog } from "@/components/ui"
import { accountsApi } from "@/api"
import { useAuth } from "@/context/AuthContext"
import { formatCurrency } from "@/lib/utils"
import type { Account, AccountType } from "@/types"
import { AccountFormModal } from "./AccountFormModal"

const accountTypeIcons: Record<AccountType, typeof Wallet> = {
  CASH: Wallet,
  BANK: Building2,
  E_WALLET: Smartphone,
  CREDIT_CARD: CreditCard,
}

export function AccountsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; accountId: string | null }>({
    isOpen: false,
    accountId: null,
  })

  const defaultCurrency = user?.defaultCurrency || "VND"

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] })
    },
    onError: (error: Error) => {
      alert(t("common.error") + ": " + error.message)
    },
  })

  // Group balances by currency
  const balancesByCurrency = accounts?.reduce((acc, account) => {
    const currency = account.currency
    acc[currency] = (acc[currency] || 0) + account.currentBalance
    return acc
  }, {} as Record<string, number>) || {}

  // Get primary balance (user's default currency)
  const primaryBalance = balancesByCurrency[defaultCurrency] || 0

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, accountId: id })
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.accountId) {
      await deleteMutation.mutateAsync(deleteConfirm.accountId)
      setDeleteConfirm({ isOpen: false, accountId: null })
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("accounts.title")}</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("accounts.createFirst").split(".")[0]}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("accounts.addAccount")}
        </Button>
      </div>

      {/* Total Balance Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-4 md:p-6">
          <p className="text-sm opacity-90">{t("dashboard.totalBalance")}</p>
          <p className="text-2xl font-bold md:text-3xl">
            {formatCurrency(primaryBalance, defaultCurrency)}
          </p>
          {/* Show other currencies if any */}
          {Object.entries(balancesByCurrency)
            .filter(([currency]) => currency !== defaultCurrency)
            .map(([currency, balance]) => (
              <p key={currency} className="text-lg opacity-90">
                {formatCurrency(balance, currency)}
              </p>
            ))}
          <p className="mt-2 text-xs opacity-75 md:text-sm">
            {accounts?.length || 0} {t("accounts.title").toLowerCase()}
          </p>
        </CardContent>
      </Card>

      {/* Account List */}
      <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {accounts?.map((account) => {
          const Icon = accountTypeIcons[account.type]
          return (
            <Card key={account.id} className="group relative">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-2 md:p-6 md:pb-2">
                <div className="flex min-w-0 items-center gap-2 md:gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full md:h-10 md:w-10"
                    style={{ backgroundColor: account.color || "#e2e8f0" }}
                  >
                    {account.icon ? (
                      <span className="text-lg md:text-xl">{account.icon}</span>
                    ) : (
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-sm md:text-base">{account.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t(`accounts.types.${account.type}`)}
                    </p>
                  </div>
                </div>

                {/* Actions - visible on mobile, hover on desktop */}
                <div className="flex gap-1 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(account)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                <p className="text-xl font-bold md:text-2xl">
                  {formatCurrency(account.currentBalance, account.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("accounts.initialBalance")}: {formatCurrency(account.initialBalance, account.currency)}
                </p>
                {/* Credit card specific info */}
                {account.type === "CREDIT_CARD" && account.creditLimit && (
                  <div className="mt-2 space-y-1 border-t pt-2 text-xs text-muted-foreground">
                    <p>
                      {t("accounts.creditLimit")}: {formatCurrency(account.creditLimit, account.currency)}
                    </p>
                    {account.billingDay && (
                      <p>{t("accounts.billingDay")}: {account.billingDay}</p>
                    )}
                    {account.paymentDueDay && (
                      <p>{t("accounts.paymentDueDay")}: {account.paymentDueDay}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Add Account Card */}
        <Card
          className="flex min-h-[120px] cursor-pointer items-center justify-center border-dashed hover:border-primary hover:bg-accent/50 md:min-h-[150px]"
          onClick={() => setIsModalOpen(true)}
        >
          <CardContent className="flex flex-col items-center p-4 text-muted-foreground md:p-6">
            <Plus className="mb-2 h-6 w-6 md:h-8 md:w-8" />
            <p className="text-sm md:text-base">{t("accounts.addAccount")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form Modal */}
      <AccountFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        account={editingAccount}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, accountId: null })}
        onConfirm={handleDeleteConfirm}
        title={t("accounts.deleteAccount", "Xóa tài khoản")}
        message={t("accounts.deleteConfirm", "Tài khoản sẽ bị ẩn nhưng các giao dịch vẫn được giữ lại. Bạn có chắc chắn?")}
        confirmText={t("common.delete", "Xóa")}
        cancelText={t("common.cancel", "Hủy")}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
