import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { savingsGoalsApi } from "@/api"
import type { SavingsContribution } from "@/types"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"

const editContributionSchema = z.object({
  note: z.string().optional(),
  contributionDate: z.string().optional(),
})

type EditContributionForm = z.infer<typeof editContributionSchema>

interface EditContributionModalProps {
  isOpen: boolean
  onClose: () => void
  contribution: SavingsContribution | null
  goalId: string
  currency: string
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function EditContributionModal({
  isOpen,
  onClose,
  contribution,
  goalId,
  currency,
}: EditContributionModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<EditContributionForm>({
    resolver: zodResolver(editContributionSchema),
  })

  useEffect(() => {
    if (contribution) {
      reset({
        note: contribution.note || "",
        contributionDate: contribution.contributionDate,
      })
    }
  }, [contribution, reset])

  const updateMutation = useMutation({
    mutationFn: (data: EditContributionForm) =>
      savingsGoalsApi.updateContribution(goalId, contribution!.id, {
        note: data.note,
        contributionDate: data.contributionDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-contributions", goalId] })
      onClose()
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || t("errors.system.internal"))
    },
  })

  const onSubmit = (data: EditContributionForm) => {
    updateMutation.mutate(data)
  }

  if (!contribution) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("savings.editContribution")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("savings.contributeAmount")}</span>
              <span className="font-semibold text-green-600">
                +{formatCurrency(contribution.amount, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-muted-foreground">{t("savings.sourceAccount")}</span>
              <span className="text-sm">{contribution.accountName}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("savings.contributeDate")}</label>
            <Input {...register("contributionDate")} type="date" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("transactions.description")}</label>
            <Input {...register("note")} placeholder={t("savings.contributeNote")} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
