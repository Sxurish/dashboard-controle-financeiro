import type { Database } from './database'

// Raw DB row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type InstallmentGroup = Database['public']['Tables']['installment_groups']['Row']
export type RecurringRule = Database['public']['Tables']['recurring_rules']['Row']
export type CreditCard = Database['public']['Tables']['credit_cards']['Row']
export type CreditCardInvoice = Database['public']['Tables']['credit_card_invoices']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Settings = Database['public']['Tables']['settings']['Row']

// Enums
export type AccountType = Account['type']
export type TransactionType = Transaction['type']
export type TransactionStatus = Transaction['status']
export type PaymentMethod = NonNullable<Transaction['payment_method']>
export type CategoryType = Category['type']
export type RecurringFrequency = RecurringRule['frequency']
export type InvoiceStatus = CreditCardInvoice['status']

// Extended types with joins
export type TransactionWithRelations = Transaction & {
  category: Category | null
  account: Account | null
  credit_card: CreditCard | null
}

// Dashboard KPIs
export interface DashboardKPIs {
  currentBalance: number
  monthIncome: number
  monthExpense: number
  monthResult: number
  prevMonthIncome: number
  prevMonthExpense: number
  prevMonthResult: number
  incomeChange: number
  expenseChange: number
  resultChange: number
}

// Chart data
export interface ChartDataPoint {
  name: string
  income: number
  expense: number
}

export interface CategoryChartData {
  name: string
  value: number
  color: string
  percentage: number
}

export interface MonthlyEvolutionData {
  month: string
  balance: number
  income: number
  expense: number
}

// Filters
export interface TransactionFilters {
  search?: string
  month?: number
  year?: number
  category_id?: string
  type?: TransactionType | 'all'
  status?: TransactionStatus | 'all'
  account_id?: string
  sort_by?: 'date' | 'amount' | 'description'
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

// Form types
export type CreateTransactionInput = {
  description: string
  amount: number
  type: TransactionType
  category_id?: string | null
  account_id: string
  credit_card_id?: string | null
  date: string
  due_date?: string | null
  status: TransactionStatus
  payment_method?: PaymentMethod | null
  notes?: string | null
  is_installment?: boolean
  installment_count?: number
  transfer_account_id?: string | null
}

export type CreateAccountInput = {
  name: string
  type: AccountType
  balance: number
  color?: string | null
  icon?: string | null
}

export type CreateCategoryInput = {
  name: string
  type: CategoryType
  color: string
  icon: string
}

export type CreateGoalInput = {
  name: string
  description?: string | null
  target_amount: number
  current_amount?: number
  deadline?: string | null
  color?: string | null
  icon?: string | null
}

export type CreateCreditCardInput = {
  name: string
  limit: number
  closing_day: number
  due_day: number
  color?: string | null
  brand?: string | null
}

export type CreateRecurringRuleInput = {
  description: string
  amount: number
  type: 'income' | 'expense'
  category_id?: string | null
  account_id: string
  frequency: RecurringFrequency
  interval?: number
  start_date: string
  end_date?: string | null
  day_of_month?: number | null
  auto_generate: boolean
}

// Pagination
export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// Alert types
export interface FinancialAlert {
  id: string
  type: 'overdue' | 'upcoming' | 'goal' | 'budget'
  message: string
  severity: 'error' | 'warning' | 'info'
  date?: string
  amount?: number
}
