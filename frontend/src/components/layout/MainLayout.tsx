import { useState } from "react"
import { Outlet, Navigate } from "react-router-dom"
import { Menu } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "./Sidebar"

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth()
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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header with hamburger */}
      <header className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center border-b bg-card px-4 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="ml-3 text-lg font-bold text-primary">Finance Tracker</h1>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content - responsive padding and margin */}
      <main className="min-h-screen pt-14 md:ml-64 md:pt-0">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
