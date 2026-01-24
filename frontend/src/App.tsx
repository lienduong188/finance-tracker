import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "./context/AuthContext"
import { MainLayout, AdminLayout } from "./components/layout"
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "./pages/auth"
import { DashboardPage } from "./pages/dashboard"
import { AccountsPage } from "./pages/accounts"
import { TransactionsPage } from "./pages/transactions"
import { BudgetsPage } from "./pages/budgets"
import { RecurringTransactionsPage } from "./pages/recurring"
import { SettingsPage } from "./pages/settings"
import { AdminUsersPage, AdminCategoriesPage } from "./pages/admin"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/recurring" element={<RecurringTransactionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Admin routes */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
