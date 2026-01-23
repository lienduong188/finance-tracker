import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight, Pencil, Trash2 } from "lucide-react"
import { Button, Card, CardContent, Select } from "@/components/ui"
import { transactionsApi, accountsApi } from "@/api"
import { formatCurrency, formatFullDate, cn } from "@/lib/utils"
import type { Transaction, TransactionType } from "@/types"
import { TransactionFormModal } from "./TransactionFormModal"

const transactionTypeIcons: Record<TransactionType, typeof TrendingUp> = {
  INCOME: TrendingUp,
  EXPENSE: TrendingDown,
  TRANSFER: ArrowLeftRight,
}

const transactionTypeColors: Record<TransactionType, string> = {
  INCOME: "text-income",
  EXPENSE: "text-expense",
  TRANSFER: "text-transfer",
}

export function TransactionsPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [filters, setFilters] = useState({
    accountId: "",
    type: "",
    page: 0,
    size: 20,
  })

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => transactionsApi.getAll(filters),
  })

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: accountsApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
    },
  })

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm(t("common.confirm") + "?")) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
  }

  // Group transactions by date
  const groupedTransactions = transactions?.content?.reduce(
    (groups, transaction) => {
      const date = transaction.transactionDate
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(transaction)
      return groups
    },
    {} as Record<string, Transaction[]>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("transactions.title")}</h1>
          <p className="text-muted-foreground">
            {t("transactions.createFirst").split(".")[0]}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("transactions.addTransaction")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 p-4">
          <div className="w-48">
            <Select
              value={filters.accountId}
              onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
            >
              <option value="">{t("common.all")} {t("accounts.title").toLowerCase()}</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <Select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">{t("common.all")} {t("transactions.type").toLowerCase()}</option>
              <option value="INCOME">{t("transactions.types.INCOME")}</option>
              <option value="EXPENSE">{t("transactions.types.EXPENSE")}</option>
              <option value="TRANSFER">{t("transactions.types.TRANSFER")}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTransactions && Object.entries(groupedTransactions).map(([date, txns]) => (
            <div key={date}>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                {formatFullDate(date, lang)}
              </h3>
              <Card>
                <CardContent className="divide-y p-0">
                  {txns.map((transaction) => {
                    const Icon = transactionTypeIcons[transaction.type]
                    return (
                      <div
                        key={transaction.id}
                        className="group flex items-center justify-between p-4 hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full",
                              transaction.type === "INCOME" && "bg-income/10",
                              transaction.type === "EXPENSE" && "bg-expense/10",
                              transaction.type === "TRANSFER" && "bg-transfer/10"
                            )}
                          >
                            {transaction.categoryIcon ? (
                              <span className="text-xl">{transaction.categoryIcon}</span>
                            ) : (
                              <Icon
                                className={cn(
                                  "h-5 w-5",
                                  transactionTypeColors[transaction.type]
                                )}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {transaction.categoryName || t(`transactions.types.${transaction.type}`)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.accountName}
                              {transaction.type === "TRANSFER" &&
                                ` → ${transaction.toAccountName}`}
                            </p>
                            {transaction.description && (
                              <p className="text-sm text-muted-foreground">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <p
                            className={cn(
                              "text-lg font-semibold",
                              transactionTypeColors[transaction.type]
                            )}
                          >
                            {transaction.type === "INCOME" ? "+" : "-"}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>

                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(transaction.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          ))}

          {transactions?.content?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">{t("transactions.noTransactions")}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("transactions.addTransaction")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {transactions && transactions.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={filters.page === 0}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                ←
              </Button>
              <span className="flex items-center px-4">
                {filters.page + 1} / {transactions.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={filters.page >= transactions.totalPages - 1}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transaction={editingTransaction}
      />
    </div>
  )
}
