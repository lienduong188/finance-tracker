import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  Bell,
  Check,
  CheckCheck,
  Users,
  Calendar,
  Wallet,
  PiggyBank,
  TrendingUp,
  UserPlus,
  UserMinus,
  AlertCircle,
  CreditCard,
} from "lucide-react"
import { notificationsApi, invitationsApi } from "@/api"
import type { Notification } from "@/api/notifications"
import { Button, Card, CardContent } from "@/components/ui"
import { formatDistanceToNow, type Locale } from "date-fns"
import { vi, enUS, ja } from "date-fns/locale"
import i18n from "@/i18n"

const localeMap: Record<string, Locale> = {
  vi: vi,
  en: enUS,
  ja: ja,
}

const typeIcons: Record<string, React.ReactNode> = {
  INVITATION_RECEIVED: <UserPlus className="w-5 h-5 text-blue-500" />,
  INVITATION_ACCEPTED: <Check className="w-5 h-5 text-green-500" />,
  RECURRING_DUE_SOON: <Calendar className="w-5 h-5 text-orange-500" />,
  DEBT_DUE_SOON: <Wallet className="w-5 h-5 text-red-500" />,
  CREDIT_CARD_PAYMENT_DUE: <CreditCard className="w-5 h-5 text-orange-500" />,
  CREDIT_CARD_PAYMENT_OVERDUE: <CreditCard className="w-5 h-5 text-red-500" />,
  BUDGET_WARNING: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  BUDGET_EXCEEDED: <AlertCircle className="w-5 h-5 text-red-500" />,
  ACCOUNT_LOW_BALANCE: <Wallet className="w-5 h-5 text-yellow-500" />,
  ACCOUNT_EMPTY: <Wallet className="w-5 h-5 text-red-500" />,
  EXCHANGE_RATE_ALERT: <TrendingUp className="w-5 h-5 text-purple-500" />,
  SAVINGS_CONTRIBUTION: <PiggyBank className="w-5 h-5 text-green-500" />,
  SAVINGS_GOAL_REACHED: <PiggyBank className="w-5 h-5 text-green-600" />,
  MEMBER_JOINED: <UserPlus className="w-5 h-5 text-blue-500" />,
  MEMBER_LEFT: <UserMinus className="w-5 h-5 text-gray-500" />,
  USER_ACCOUNT_DELETED: <AlertCircle className="w-5 h-5 text-red-500" />,
}

export default function NotificationsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: notificationsPage, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll(0, 50),
    refetchInterval: 15000, // Real-time: refetch mỗi 15 giây
  })

  const { data: pendingInvitations } = useQuery({
    queryKey: ["received-invitations"],
    queryFn: invitationsApi.getReceived,
    refetchInterval: 15000, // Real-time: refetch mỗi 15 giây
  })

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] })
    },
  })

  const acceptInvitationMutation = useMutation({
    mutationFn: invitationsApi.accept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["received-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["families"] })
      queryClient.invalidateQueries({ queryKey: ["pending-invitations-count"] })
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      alert(error.response?.data?.message || t("errors.system.internal"))
    },
  })

  const declineInvitationMutation = useMutation({
    mutationFn: invitationsApi.decline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["received-invitations"] })
      queryClient.invalidateQueries({ queryKey: ["pending-invitations-count"] })
    },
  })

  const notifications = notificationsPage?.content || []
  const hasUnread = notifications.some((n) => !n.isRead)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("notifications.title")}</h1>
          <p className="text-muted-foreground">{t("notifications.subtitle")}</p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("notifications.pendingInvitations")} ({pendingInvitations.length})
          </h2>
          {pendingInvitations.map((invitation) => (
            <Card key={invitation.id} className="border-primary/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.familyName}</p>
                      <p className="text-sm text-muted-foreground">
                        {invitation.inviterName} {t("notifications.invitedToJoin")}
                      </p>
                      {invitation.message && (
                        <p className="mt-1 text-sm bg-muted p-2 rounded">"{invitation.message}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => declineInvitationMutation.mutate(invitation.token)}
                      disabled={declineInvitationMutation.isPending}
                    >
                      {t("notifications.decline")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => acceptInvitationMutation.mutate(invitation.token)}
                      disabled={acceptInvitationMutation.isPending}
                    >
                      {t("notifications.accept")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All Notifications Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t("notifications.allNotifications")}
        </h2>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t("notifications.noNotifications")}</h3>
              <p className="text-muted-foreground text-center">
                {t("notifications.noNotificationsHint")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification
  onMarkAsRead: () => void
}) {
  const { t } = useTranslation()
  const icon = typeIcons[notification.type] || <Bell className="w-5 h-5" />
  const currentLocale = localeMap[i18n.language] || vi

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead()
    }
  }

  // Get localized title and message
  const getLocalizedTitle = () => {
    const key = `notifications.types.${notification.type}`
    const translated = t(key)
    // Fallback to backend title if translation key not found
    return translated !== key ? translated : notification.title
  }

  const getLocalizedMessage = () => {
    const key = `notifications.messages.${notification.type}`
    const data = notification.data || {}
    const translated = t(key, data as Record<string, string>)
    // Fallback to backend message if translation key not found
    return translated !== key ? translated : notification.message
  }

  return (
    <Card
      className={`${notification.isRead ? "opacity-60" : ""} ${!notification.isRead ? "cursor-pointer hover:bg-accent/50 transition-colors" : ""}`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{getLocalizedTitle()}</p>
                <p className="text-sm text-muted-foreground">{getLocalizedMessage()}</p>
              </div>
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" title={t("notifications.markAsRead")} />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: currentLocale,
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
