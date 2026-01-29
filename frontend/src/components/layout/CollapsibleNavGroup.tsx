import { useState, useEffect } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { ChevronDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

interface CollapsibleNavGroupProps {
  title: string
  icon: LucideIcon
  items: NavItem[]
  onNavClick?: () => void
}

export function CollapsibleNavGroup({
  title,
  icon: GroupIcon,
  items,
  onNavClick,
}: CollapsibleNavGroupProps) {
  const location = useLocation()
  const isAnyItemActive = items.some((item) => item.to === location.pathname)
  const [isOpen, setIsOpen] = useState(isAnyItemActive)

  // Auto expand when navigating to an item in this group
  useEffect(() => {
    if (isAnyItemActive && !isOpen) {
      setIsOpen(true)
    }
  }, [isAnyItemActive, isOpen])

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isAnyItemActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <GroupIcon className="h-5 w-5" />
          {title}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="ml-4 space-y-1 border-l pl-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavClick}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
