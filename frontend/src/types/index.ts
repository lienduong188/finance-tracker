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
  locale?: string
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
  // Credit card specific fields
  creditLimit: number | null
  billingDay: number | null
  paymentDueDay: number | null
  linkedAccountId: string | null
  linkedAccountName: string | null
}

export interface AccountRequest {
  name: string
  type: AccountType
  currency: string
  initialBalance: number
  icon?: string
  color?: string
  // Credit card specific fields
  creditLimit?: number
  billingDay?: number
  paymentDueDay?: number
  linkedAccountId?: string
}

// Category types
export type CategoryType = "INCOME" | "EXPENSE"

export interface Category {
  id: string
  name: string
  nameVi: string | null
  nameEn: string | null
  nameJa: string | null
  type: CategoryType
  icon: string | null
  color: string | null
  parentId: string | null
  isSystem: boolean
  children: Category[]
}

export interface CategoryRequest {
  name: string
  nameVi?: string
  nameEn?: string
  nameJa?: string
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
  messageKey?: string
  errors?: Record<string, string>
  errorKeys?: Record<string, string>
}

export interface LogoutRequest {
  refreshToken: string
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
  lastLoginAt: string | null
  lastLoginIp: string | null
  lastLoginLocation: string | null
  lastUserAgent: string | null
  accountsCount: number
  transactionsCount: number
}

export interface UpdateUserRoleRequest {
  role: Role
}

export interface AdminCategoryRequest {
  name: string
  nameVi?: string
  nameEn?: string
  nameJa?: string
  type: CategoryType
  icon?: string
  color?: string
  parentId?: string
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  disabledUsers: number
  adminUsers: number
  totalAccounts: number
  totalTransactions: number
  totalBudgets: number
  totalCategories: number
  usersLast7Days: number
  usersLast30Days: number
  transactionsLast7Days: number
  transactionsLast30Days: number
}

// Recurring Transaction types
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
export type RecurringStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED"

export interface RecurringTransaction {
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

  toAccountId: string | null
  toAccountName: string | null
  exchangeRate: number | null

  frequency: RecurrenceFrequency
  intervalValue: number
  dayOfWeek: number | null
  dayOfMonth: number | null

  startDate: string
  endDate: string | null
  nextExecutionDate: string
  lastExecutionDate: string | null

  status: RecurringStatus
  executionCount: number
  maxExecutions: number | null

  createdAt: string
}

export interface RecurringTransactionRequest {
  accountId: string
  categoryId?: string
  type: TransactionType
  amount: number
  currency?: string
  description?: string

  toAccountId?: string
  exchangeRate?: number

  frequency: RecurrenceFrequency
  intervalValue?: number
  dayOfWeek?: number
  dayOfMonth?: number

  startDate: string
  endDate?: string
  maxExecutions?: number
}

export interface UpcomingTransaction {
  recurringId: string
  description: string | null
  amount: number
  currency: string
  type: TransactionType
  accountName: string
  categoryName: string | null
  categoryIcon: string | null
  scheduledDate: string
}

// Chat types
export type ChatRole = "USER" | "ASSISTANT"

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

export interface ChatRequest {
  message: string
  language?: string
}

export interface ChatResponse {
  id: string
  role: string
  content: string
  createdAt: string
}

export interface ChatHistoryResponse {
  messages: ChatResponse[]
  totalCount: number
}

// Debt types
export type DebtType = "LEND" | "BORROW"
export type DebtStatus = "ACTIVE" | "PARTIALLY_PAID" | "PAID" | "CANCELLED"

export interface Debt {
  id: string
  type: DebtType
  personName: string
  amount: number
  currency: string
  description: string | null
  startDate: string
  dueDate: string | null
  status: DebtStatus
  paidAmount: number
  remainingAmount: number
  note: string | null
  overdue: boolean
  createdAt: string
  updatedAt: string
}

export interface DebtRequest {
  type: DebtType
  personName: string
  amount: number
  currency?: string
  description?: string
  startDate: string
  dueDate?: string
  note?: string
}

export interface DebtPaymentRequest {
  amount: number
  paymentDate?: string
  accountId?: string
  note?: string
}

export interface DebtSummary {
  totalLent: number
  totalBorrowed: number
  netBalance: number
  activeDebtsCount: number
  overdueCount: number
}

// Token Usage types (Admin)
export interface TokenUsageStats {
  totalTokens: number
  totalInputTokens: number
  totalOutputTokens: number
  tokensLast7Days: number
  tokensLast30Days: number
  totalRequests: number
  requestsLast7Days: number
  requestsLast30Days: number
  uniqueUsers: number
  uniqueUsersLast7Days: number
  uniqueUsersLast30Days: number
  topUsers: TopUserUsage[]
  dailyUsage: DailyTokenUsage[]
  modelUsage: ModelUsage[]
  // Groq Free Tier: 14,400 requests/day
  dailyRequestLimit: number
  requestsToday: number
  remainingRequestsToday: number
  tokensToday: number
}

export interface TopUserUsage {
  id: string
  email: string
  fullName: string
  totalTokens: number
}

export interface DailyTokenUsage {
  date: string
  tokens: number
}

export interface ModelUsage {
  model: string
  tokens: number
  requests: number
}

// Group/Family types
export type GroupType = "FAMILY" | "FRIENDS" | "WORK" | "OTHER"
export type FamilyRole = "OWNER" | "ADMIN" | "MEMBER"
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED"
export type AccountVisibility = "PRIVATE" | "FAMILY_VISIBLE" | "SPECIFIC_MEMBERS"
export type SavingsGoalStatus = "ACTIVE" | "COMPLETED" | "CANCELLED"

export interface Family {
  id: string
  name: string
  type: GroupType
  description: string | null
  currency: string
  createdById: string
  createdByName: string
  memberCount: number
  myRole: FamilyRole
  createdAt: string
}

export interface FamilyRequest {
  name: string
  type?: GroupType
  description?: string
  currency?: string
}

export interface FamilyMember {
  id: string
  userId: string
  email: string
  fullName: string
  role: FamilyRole
  joinedAt: string
}

export interface UpdateMemberRoleRequest {
  role: FamilyRole
}

// Invitation types
export interface Invitation {
  id: string
  familyId: string
  familyName: string
  inviterEmail: string
  inviterName: string
  inviteeEmail: string
  role: FamilyRole
  status: InvitationStatus
  token: string
  message: string | null
  expiresAt: string
  createdAt: string
}

export interface InvitationRequest {
  familyId: string
  email: string
  role?: FamilyRole
  message?: string
}

// Savings Goal types
export interface SavingsGoal {
  id: string
  name: string
  description: string | null
  targetAmount: number
  currentAmount: number
  currency: string
  icon: string | null
  color: string | null
  targetDate: string | null
  status: SavingsGoalStatus
  familyId: string | null
  familyName: string | null
  userId: string | null
  userName: string | null
  progressPercentage: number
  contributorsCount: number
  createdAt: string
}

export interface SavingsGoalRequest {
  name: string
  description?: string
  targetAmount: number
  currency?: string
  icon?: string
  color?: string
  targetDate?: string
  familyId?: string
}

export interface SavingsContribution {
  id: string
  goalId: string
  userId: string
  userName: string
  accountId: string
  accountName: string
  transactionId: string | null
  amount: number
  note: string | null
  contributionDate: string
  createdAt: string
}

export interface SavingsContributionRequest {
  amount: number
  accountId: string
  note?: string
  contributionDate?: string
}

export interface ContributorSummary {
  userId: string
  userName: string
  totalAmount: number
  percentage: number
}

// Account Permission types
export interface AccountPermission {
  id: string
  userId: string
  userEmail: string
  userName: string
  canView: boolean
  canTransact: boolean
}

export interface AccountVisibilityRequest {
  visibility: AccountVisibility
  familyId?: string
  permissions?: AccountPermissionRequest[]
}

export interface AccountPermissionRequest {
  userId: string
  canView?: boolean
  canTransact?: boolean
}
