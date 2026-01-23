import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "./Sidebar"

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth()

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
      <Sidebar />
      <main className="ml-64 min-h-screen p-6">
        <Outlet />
      </main>
    </div>
  )
}
