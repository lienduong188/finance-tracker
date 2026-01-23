import { NavLink } from "react-router-dom"
import { Users, FolderTree, ArrowLeft, Shield, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const adminNavItems = [
  { to: "/admin/users", icon: Users, label: "Quản lý Users" },
  { to: "/admin/categories", icon: FolderTree, label: "System Categories" },
]

export function AdminSidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Shield className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
        </div>

        {/* Back to App */}
        <NavLink
          to="/"
          className="flex items-center gap-3 border-b px-6 py-3 text-sm text-muted-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại ứng dụng
        </NavLink>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {adminNavItems.map((item) => (
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
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {user?.fullName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  )
}
