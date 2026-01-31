import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Plus, Users, User, TrendingUp, Trash2 } from "lucide-react"
import { savingsGoalsApi } from "@/api"
import type { SavingsGoalStatus, SavingsContribution } from "@/types"
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, AlertDialog } from "@/components/ui"
import ContributeModal from "./ContributeModal"

const statusColors: Record<SavingsGoalStatus, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function SavingsDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedContribution, setSelectedContribution] = useState<SavingsContribution | null>(null)
  const [errorDialog, setErrorDialog] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  })

  const { data: goal, isLoading: goalLoading } = useQuery({
    queryKey: ["savings-goal", id],
    queryFn: () => savingsGoalsApi.getById(id!),
    enabled: !!id,
  })

  const { data: contributions } = useQuery({
    queryKey: ["savings-contributions", id],
    queryFn: () => savingsGoalsApi.getContributions(id!),
    enabled: !!id,
  })

  const { data: contributors } = useQuery({
    queryKey: ["savings-contributors", id],
    queryFn: () => savingsGoalsApi.getContributors(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => savingsGoalsApi.deleteContribution(id!, selectedContribution!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goal", id] })
      queryClient.invalidateQueries({ queryKey: ["savings-contributions", id] })
      queryClient.invalidateQueries({ queryKey: ["savings-contributors", id] })
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      setIsDeleteDialogOpen(false)
      setSelectedContribution(null)
    },
    onError: (error: any) => {
      setErrorDialog({ isOpen: true, message: error.response?.data?.message || t("errors.system.internal") })
    },
  })

  const handleDeleteClick = (contribution: SavingsContribution) => {
    setSelectedContribution(contribution)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    deleteMutation.mutate()
  }

  if (goalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!goal) {
    return <div>{t("savings.notFound")}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/savings")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{goal.icon || "🎯"}</span>
            <h1 className="text-2xl font-bold">{goal.name}</h1>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[goal.status]}`}>
              {t(`savings.statuses.${goal.status}`)}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">{goal.description || t("savings.noDescription")}</p>
        </div>
        {goal.status === "ACTIVE" && (
          <Button onClick={() => setIsContributeModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t("savings.contribute")}
          </Button>
        )}
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("savings.saved")}</p>
              <p className="text-3xl font-bold">
                {formatCurrency(goal.currentAmount, goal.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t("savings.target")}</p>
              <p className="text-xl font-semibold">
                {formatCurrency(goal.targetAmount, goal.currency)}
              </p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-4">
            <div
              className="bg-primary h-4 rounded-full transition-all"
              style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{goal.progressPercentage.toFixed(1)}% {t("savings.completed")}</span>
            <span>
              {t("savings.remaining")} {formatCurrency(goal.targetAmount - goal.currentAmount, goal.currency)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contributors */}
        {contributors && contributors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t("savings.contributors")} ({contributors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contributors.map((contributor) => (
                  <div
                    key={contributor.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                        {contributor.userName.charAt(0).toUpperCase()}
                      </div>
                      <span>{contributor.userName}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(contributor.totalAmount, goal.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {contributor.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent contributions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t("savings.contributionHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contributions && contributions.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {contributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{contribution.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(contribution.contributionDate).toLocaleDateString("vi-VN")}
                        {contribution.note && ` • ${contribution.note}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-green-600">
                        +{formatCurrency(contribution.amount, contribution.currency)}
                      </p>
                      <button
                        onClick={() => handleDeleteClick(contribution)}
                        className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t("common.delete")}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {t("savings.noContributions")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">{t("savings.type")}: </span>
              {goal.familyId ? (
                <span className="flex items-center gap-1 inline-flex">
                  <Users className="w-4 h-4" />
                  {goal.familyName}
                </span>
              ) : (
                <span className="flex items-center gap-1 inline-flex">
                  <User className="w-4 h-4" />
                  {t("savings.personal")}
                </span>
              )}
            </div>
            {goal.targetDate && (
              <div>
                <span className="text-muted-foreground">{t("savings.targetDate")}: </span>
                {new Date(goal.targetDate).toLocaleDateString("vi-VN")}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">{t("savings.createdDate")}: </span>
              {new Date(goal.createdAt).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </CardContent>
      </Card>

      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        goalId={id!}
        goalName={goal.name}
        currency={goal.currency}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedContribution(null)
        }}
        onConfirm={handleConfirmDelete}
        title={t("savings.deleteContribution")}
        message={t("savings.deleteContributionConfirm", {
          amount: selectedContribution ? formatCurrency(selectedContribution.amount, goal.currency) : ""
        })}
        confirmText={t("common.delete")}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />

      {/* Error Dialog */}
      <AlertDialog
        isOpen={errorDialog.isOpen}
        onClose={() => setErrorDialog({ isOpen: false, message: "" })}
        title={t("common.error")}
        message={errorDialog.message}
        variant="error"
      />
    </div>
  )
}
