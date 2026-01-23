import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { LanguageSwitch } from "@/components/LanguageSwitch"

const navItems = [
  { to: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { to: "/accounts", icon: Wallet, labelKey: "nav.accounts" },
  { to: "/transactions", icon: ArrowLeftRight, labelKey: "nav.transactions" },
  { to: "/budgets", icon: PiggyBank, labelKey: "nav.budgets" },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold text-primary">Finance Tracker</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
        </div>
      </div>
    </aside>
  )
}
