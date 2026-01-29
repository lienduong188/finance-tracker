import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  Crown,
  Shield,
  User,
  UserPlus,
  MoreVertical,
  LogOut,
  Trash2,
} from "lucide-react"
import { familiesApi, invitationsApi } from "@/api"
import type { FamilyRole, FamilyMember } from "@/types"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { useAuth } from "@/context/AuthContext"
import InviteMemberModal from "./InviteMemberModal"

const roleIcons: Record<FamilyRole, React.ReactNode> = {
  OWNER: <Crown className="w-4 h-4 text-yellow-500" />,
  ADMIN: <Shield className="w-4 h-4 text-blue-500" />,
  MEMBER: <User className="w-4 h-4 text-gray-500" />,
}

export default function FamilyDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const { data: family, isLoading: familyLoading } = useQuery({
    queryKey: ["family", id],
    queryFn: () => familiesApi.getById(id!),
    enabled: !!id,
  })

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["family-members", id],
    queryFn: () => familiesApi.getMembers(id!),
    enabled: !!id,
  })

  const { data: invitations } = useQuery({
    queryKey: ["family-invitations", id],
    queryFn: () => invitationsApi.getByFamily(id!),
    enabled: !!id && (family?.myRole === "OWNER" || family?.myRole === "ADMIN"),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: FamilyRole }) =>
      familiesApi.updateMemberRole(id!, memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", id] })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => familiesApi.removeMember(id!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-members", id] })
      queryClient.invalidateQueries({ queryKey: ["family", id] })
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => familiesApi.leave(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families"] })
      navigate("/family")
    },
  })

  const cancelInvitationMutation = useMutation({
    mutationFn: invitationsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family-invitations", id] })
    },
  })

  const handleChangeRole = (member: FamilyMember, newRole: FamilyRole) => {
    if (confirm(t("family.confirmChangeRole", { name: member.fullName, role: t(`family.roles.${newRole}`) }))) {
      updateRoleMutation.mutate({ memberId: member.id, role: newRole })
    }
  }

  const handleRemoveMember = (member: FamilyMember) => {
    if (confirm(t("family.confirmRemoveMember", { name: member.fullName }))) {
      removeMemberMutation.mutate(member.id)
    }
  }

  const handleLeave = () => {
    if (confirm(t("family.confirmLeave"))) {
      leaveMutation.mutate()
    }
  }

  if (familyLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!family) {
    return <div>{t("family.notFound")}</div>
  }

  const canManageMembers = family.myRole === "OWNER" || family.myRole === "ADMIN"
  const pendingInvitations = invitations?.filter((i) => i.status === "PENDING") || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/family")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{family.name}</h1>
          <p className="text-muted-foreground">{family.description || t("family.noDescription")}</p>
        </div>
        {family.myRole !== "OWNER" && (
          <Button variant="outline" onClick={handleLeave}>
            <LogOut className="w-4 h-4 mr-2" />
            {t("family.leaveGroup")}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("family.membersCount")} ({members?.length || 0})</CardTitle>
            {canManageMembers && (
              <Button size="sm" onClick={() => setIsInviteModalOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                {t("family.invite")}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {member.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.fullName}
                        {member.userId === user?.id && (
                          <span className="text-muted-foreground ml-1">({t("family.you")})</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1" title={t(`family.roles.${member.role}`)}>
                      {roleIcons[member.role]}
                      <span className="text-sm">{t(`family.roles.${member.role}`)}</span>
                    </div>
                    {canManageMembers && member.userId !== user?.id && member.role !== "OWNER" && (
                      <div className="relative group">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-lg hidden group-hover:block z-10 min-w-[150px]">
                          {family.myRole === "OWNER" && (
                            <>
                              {member.role !== "ADMIN" && (
                                <button
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => handleChangeRole(member, "ADMIN")}
                                >
                                  {t("family.promoteAdmin")}
                                </button>
                              )}
                              {member.role === "ADMIN" && (
                                <button
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => handleChangeRole(member, "MEMBER")}
                                >
                                  {t("family.demoteMember")}
                                </button>
                              )}
                            </>
                          )}
                          <button
                            className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                            onClick={() => handleRemoveMember(member)}
                          >
                            {t("family.removeFromGroup")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {canManageMembers && pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("family.pendingInvitations")} ({pendingInvitations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{invitation.inviteeEmail}</p>
                      <p className="text-sm text-muted-foreground">
                        Role: {t(`family.roles.${invitation.role}`)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        familyId={id!}
      />
    </div>
  )
}
