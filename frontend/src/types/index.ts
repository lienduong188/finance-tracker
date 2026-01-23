// Role type
export type Role = "USER" | "ADMIN"

// User types
export interface User {
  id: string
  email: string
  fullName: string
  defaultCurrency: string
  role: Role
  createdAt: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  defaultCurrency?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  userId: string
  email: string
  fullName: string
  defaultCurrency: string
  role: Role
}

export interface UpdateProfileRequest {
  fullName: string
  defaultCurrency: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// Account types
export type AccountType = "CASH" | "BANK" | "E_WALLET" | "CREDIT_CARD"

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: string
  initialBalance: number
  currentBalance: number
  icon: string | null
  color: string | null
  isActive: boolean
  createdAt: string
}

export interface AccountRequest {
  name: string
  type: AccountType
  currency: string
  initialBalance: number
  icon?: string
  color?: string
}

// Category types
export type CategoryType = "INCOME" | "EXPENSE"

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  parentId: string | null
  isSystem: boolean
  children: Category[]
}

export interface CategoryRequest {
  name: string
  type: CategoryType
  icon?: string
  color?: string
  parentId?: string
}

// Transaction types
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER"

export interface Transaction {
  id: string
  accountId: string
  accountName: string
  categoryId: string | null
  categoryName: string | null
  categoryIcon: string | null
  type: TransactionType
  amount: number
  currency: string
  description: string | null
  transactionDate: string
  toAccountId: string | null
  toAccountName: string | null
  exchangeRate: number | null
  createdAt: string
}

export interface TransactionRequest {
  accountId: string
  categoryId?: string
  type: TransactionType
  amount: number
  currency?: string
  description?: string
  transactionDate: string
  toAccountId?: string
  exchangeRate?: number
}

// Budget types
export type BudgetPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM"

export interface Budget {
  id: string
  name: string
  categoryId: string | null
  categoryName: string | null
  categoryIcon: string | null
  amount: number
  currency: string
  period: BudgetPeriod
  startDate: string
  endDate: string | null
  spentAmount: number
  remainingAmount: number
  spentPercentage: number
  alertThreshold: number
  isActive: boolean
  isOverBudget: boolean
  isNearLimit: boolean
  createdAt: string
}

export interface BudgetRequest {
  name: string
  categoryId?: string
  amount: number
  currency?: string
  period: BudgetPeriod
  startDate: string
  endDate?: string
  alertThreshold?: number
}

// Dashboard types
export interface DashboardSummary {
  totalBalance: number
  totalIncome: number
  totalExpense: number
  netCashflow: number
  currency: string
  accountsCount: number
  budgetsOverLimit: number
}

export interface CashflowReport {
  startDate: string
  endDate: string
  totalIncome: number
  totalExpense: number
  netCashflow: number
  dailyData: DailyCashflow[]
}

export interface DailyCashflow {
  date: string
  income: number
  expense: number
  net: number
}

export interface CategoryReport {
  type: TransactionType
  totalAmount: number
  categories: CategoryBreakdown[]
}

export interface CategoryBreakdown {
  categoryId: string
  categoryName: string
  icon: string | null
  color: string | null
  amount: number
  percentage: number
}

// API Response types
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ApiError {
  timestamp: string
  status: number
  code: string
  message: string
  errors?: Record<string, string>
}

// Admin types
export interface AdminUser {
  id: string
  email: string
  fullName: string
  defaultCurrency: string
  role: Role
  enabled: boolean
  createdAt: string
  updatedAt: string
  accountsCount: number
  transactionsCount: number
}

export interface UpdateUserRoleRequest {
  role: Role
}

export interface AdminCategoryRequest {
  name: string
  type: CategoryType
  icon?: string
  color?: string
  parentId?: string
}
