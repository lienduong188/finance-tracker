import { useState } from "react"
import { Outlet, Navigate } from "react-router-dom"
import { Menu } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "./Sidebar"
import { ChatWidget } from "@/components/chat/ChatWidget"

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
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      {/* Mobile/Tablet header with hamburger */}
      <header className="fixed left-0 right-0 top-0 z-20 flex h-14 items-center border-b bg-card px-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 hover:bg-accent"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="ml-3 text-lg font-bold text-primary">Finance Tracker</h1>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content - full width on mobile/tablet, offset on desktop */}
      <main className="min-h-screen pt-14 lg:ml-64 lg:pt-0">
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>

      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  )
}
