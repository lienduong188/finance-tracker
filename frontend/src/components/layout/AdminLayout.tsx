import { useState } from "react"
import { Outlet, Navigate } from "react-router-dom"
import { Menu } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { AdminSidebar } from "./AdminSidebar"

export function AdminLayout() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-card px-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-primary">Admin Panel</h1>
      </header>

      {/* Main content */}
      <main className="min-h-screen p-4 lg:ml-64 lg:p-6">
        <Outlet />
      </main>
    </div>
  )
}
