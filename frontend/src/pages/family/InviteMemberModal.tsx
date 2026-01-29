import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { invitationsApi } from "@/api"
import type { FamilyRole } from "@/types"
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui"

const createInviteSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t("validation.emailInvalid")),
  role: z.enum(["ADMIN", "MEMBER"]),
  message: z.string().optional(),
})

type InviteForm = z.output<ReturnType<typeof createInviteSchema>>

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
}

export default function InviteMemberModal({ isOpen, onClose, familyId }: InviteMemberModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const inviteSchema = createInviteSchema(t)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
      message: "",
    },
  })

  const inviteMutation = useMutation({
    mutationFn: (data: InviteForm) =>
      invitationsApi.send({
        familyId,
        email: data.email,
        role: data.role as FamilyRole,
        message: data.message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-invitations", familyId] })
      reset()
      onClose()
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || t("errors.system.internal"))
    },
  })

  const onSubmit = (data: InviteForm) => {
    inviteMutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("family.inviteTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("family.inviteeEmail")} *</label>
            <Input
              {...register("email")}
              type="email"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t("family.inviteeEmailHint")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select {...register("role")} className="w-full border rounded-md p-2">
              <option value="MEMBER">{t("family.roles.MEMBER")}</option>
              <option value="ADMIN">{t("family.roles.ADMIN")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("family.inviteMessage")}</label>
            <Input
              {...register("message")}
              placeholder={t("family.inviteMessagePlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? t("family.sending") : t("family.sendInvite")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
