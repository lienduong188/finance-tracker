import { useQuery } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import { Link } from "react-router-dom"
import { invitationsApi, notificationsApi } from "@/api"

interface NotificationBellProps {
  onClick?: () => void
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { data: invitationsCount = 0 } = useQuery({
    queryKey: ["pending-invitations-count"],
    queryFn: invitationsApi.countPending,
    refetchInterval: 30000,
  })

  const { data: notificationsCount = 0 } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: notificationsApi.countUnread,
    refetchInterval: 30000,
  })

  const totalCount = invitationsCount + notificationsCount

  return (
    <Link
      to="/invitations"
      onClick={onClick}
      className="relative rounded-lg p-2 hover:bg-accent"
      title="Thông báo"
    >
      <Bell className="h-5 w-5" />
      {totalCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
          {totalCount > 9 ? "9+" : totalCount}
        </span>
      )}
    </Link>
  )
}
