import { NavLink, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  Repeat,
  Settings,
  LogOut,
  Shield,
  X,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { LanguageSwitch } from "@/components/LanguageSwitch"

const navItems = [
  { to: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { to: "/accounts", icon: Wallet, labelKey: "nav.accounts" },
  { to: "/transactions", icon: ArrowLeftRight, labelKey: "nav.transactions" },
  { to: "/budgets", icon: PiggyBank, labelKey: "nav.budgets" },
  { to: "/recurring", icon: Repeat, labelKey: "nav.recurring" },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  onOpenChat?: () => void
}

export function Sidebar({ isOpen = true, onClose, onOpenChat }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth()
  const { t } = useTranslation()

  const handleNavClick = () => {
    // Close sidebar on mobile/tablet after navigation
    if (onClose && window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay for mobile/tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card transition-transform duration-300 ease-in-out",
          // Mobile/Tablet: slide in/out
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop (lg+): always visible
          "lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with close button on mobile */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <h1 className="text-xl font-bold text-primary">Finance Tracker</h1>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-accent lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {t(item.labelKey)}
              </NavLink>
            ))}

            {/* AI Assistant - only show on mobile/tablet */}
            <button
              onClick={() => {
                onOpenChat?.()
                onClose?.()
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
            >
              <MessageCircle className="h-5 w-5" />
              {t("chat.title", "AI Assistant")}
            </button>

            {/* Admin Panel Link */}
            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mt-4 border-t pt-4",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <Shield className="h-5 w-5" />
                Admin Panel
              </NavLink>
            )}
          </nav>

          {/* Language Switch */}
          <div className="border-t">
            <LanguageSwitch />
          </div>

          {/* User section */}
          <div className="border-t p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <NavLink
                to="/settings"
                onClick={handleNavClick}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                {t("nav.settings")}
              </NavLink>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                title={t("auth.logout")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Legal links */}
            <div className="mt-3 flex justify-center gap-3 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground hover:underline">
                {t("legal.termsTitle")}
              </Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-foreground hover:underline">
                {t("legal.privacyTitle")}
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
