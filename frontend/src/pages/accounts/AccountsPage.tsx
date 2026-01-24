import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
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

export function AccountsPage() {
  const { t } = useTranslation()
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
    if (confirm(t("common.confirm") + "?")) {
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
          <p className="text-2xl font-bold md:text-3xl">{formatCurrency(totalBalance)}</p>
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
                    onClick={() => handleDelete(account.id)}
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
    </div>
  )
}
