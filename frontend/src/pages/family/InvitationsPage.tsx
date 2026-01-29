import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Mail, Check, X, Users } from "lucide-react"
import { invitationsApi } from "@/api"
import { Button, Card, CardContent } from "@/components/ui"

export default function InvitationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["received-invitations"],
    queryFn: invitationsApi.getReceived,
  })

  const acceptMutation = useMutation({
    mutationFn: invitationsApi.accept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["received-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["families"] })
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || t("errors.system.internal"))
    },
  })

  const declineMutation = useMutation({
    mutationFn: invitationsApi.decline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["received-invitations"] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("family.invitationsTitle")}</h1>
        <p className="text-muted-foreground">{t("family.invitationsSubtitle")}</p>
      </div>

      {!invitations || invitations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t("family.noInvitations")}</h3>
            <p className="text-muted-foreground text-center">
              {t("family.noInvitationsHint")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{invitation.familyName}</h3>
                      <p className="text-muted-foreground">
                        {t("family.invitedBy")} {invitation.inviterName} ({invitation.inviterEmail})
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Role: {t(`family.roles.${invitation.role}`)}
                      </p>
                      {invitation.message && (
                        <p className="mt-2 text-sm bg-muted p-2 rounded">
                          "{invitation.message}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("family.expiresAt")}: {new Date(invitation.expiresAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => declineMutation.mutate(invitation.token)}
                      disabled={declineMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {t("family.decline")}
                    </Button>
                    <Button
                      onClick={() => acceptMutation.mutate(invitation.token)}
                      disabled={acceptMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {t("family.accept")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
