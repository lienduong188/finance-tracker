import { useQuery } from "@tanstack/react-query"
import { Bell } from "lucide-react"
import { Link } from "react-router-dom"
import { invitationsApi } from "@/api"

interface NotificationBellProps {
  onClick?: () => void
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { data: count = 0 } = useQuery({
    queryKey: ["pending-invitations-count"],
    queryFn: invitationsApi.countPending,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  return (
    <Link
      to="/invitations"
      onClick={onClick}
      className="relative rounded-lg p-2 hover:bg-accent"
      title="Lời mời"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  )
}
