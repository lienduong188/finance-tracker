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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("transactions.title")}</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            {t("transactions.createFirst").split(".")[0]}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t("transactions.addTransaction")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:gap-4 sm:p-4">
          <div className="w-full sm:w-40 md:w-48">
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
          <div className="w-full sm:w-40 md:w-48">
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
        <div className="space-y-4 md:space-y-6">
          {groupedTransactions && Object.entries(groupedTransactions).map(([date, txns]) => (
            <div key={date}>
              <h3 className="mb-2 text-xs font-medium text-muted-foreground md:mb-3 md:text-sm">
                {formatFullDate(date, lang)}
              </h3>
              <Card>
                <CardContent className="divide-y p-0">
                  {txns.map((transaction) => {
                    const Icon = transactionTypeIcons[transaction.type]
                    return (
                      <div
                        key={transaction.id}
                        className="group p-3 hover:bg-accent/50 md:p-4"
                      >
                        {/* Mobile layout - stacked */}
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full md:h-10 md:w-10",
                              transaction.type === "INCOME" && "bg-income/10",
                              transaction.type === "EXPENSE" && "bg-expense/10",
                              transaction.type === "TRANSFER" && "bg-transfer/10"
                            )}
                          >
                            {transaction.categoryIcon ? (
                              <span className="text-lg md:text-xl">{transaction.categoryIcon}</span>
                            ) : (
                              <Icon
                                className={cn(
                                  "h-4 w-4 md:h-5 md:w-5",
                                  transactionTypeColors[transaction.type]
                                )}
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium md:text-base">
                                  {transaction.categoryName
                                    ? t(`categories.${transaction.categoryName}`, transaction.categoryName)
                                    : t(`transactions.types.${transaction.type}`)}
                                </p>
                                <p className="truncate text-xs text-muted-foreground md:text-sm">
                                  {transaction.accountName}
                                  {transaction.type === "TRANSFER" &&
                                    ` → ${transaction.toAccountName}`}
                                </p>
                              </div>
                              <p
                                className={cn(
                                  "shrink-0 text-sm font-semibold md:text-lg",
                                  transactionTypeColors[transaction.type]
                                )}
                              >
                                {transaction.type === "INCOME" ? "+" : "-"}
                                {formatCurrency(transaction.amount, transaction.currency)}
                              </p>
                            </div>

                            {transaction.description && (
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {transaction.description}
                              </p>
                            )}

                            {/* Actions - visible on mobile, hover on desktop */}
                            <div className="mt-2 flex gap-1 md:mt-0 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleEdit(transaction)}
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                {t("common.edit")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => handleDelete(transaction.id)}
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                {t("common.delete")}
                              </Button>
                            </div>
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
              <CardContent className="flex flex-col items-center justify-center py-8 md:py-12">
                <ArrowLeftRight className="mb-4 h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
                <p className="text-sm text-muted-foreground md:text-base">{t("transactions.noTransactions")}</p>
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
                size="sm"
                disabled={filters.page === 0}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                ←
              </Button>
              <span className="flex items-center px-3 text-sm md:px-4 md:text-base">
                {filters.page + 1} / {transactions.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
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
