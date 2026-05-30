import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export interface BudgetWithSpending {
  budget_id?: string
  category_id: string
  category_name: string
  category_color: string
  budget_amount: number | null
  spent_amount: number
  remaining: number
  percentage: number
  status: 'ok' | 'warning' | 'exceeded' | 'unset'
}

export interface CreateBudgetInput {
  category_id: string
  amount: number
  month: number
  year: number
}

export async function getBudgetsWithSpending(year: number, month: number): Promise<BudgetWithSpending[]> {
  const supabase = createClient()

  const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd')
  const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd')

  const [categoriesRes, budgetsRes, transactionsRes] = await Promise.all([
    supabase.from('categories').select('*').eq('type', 'expense').order('name'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('budgets').select('*').eq('month', month).eq('year', year),
    supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('is_deleted', false)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate),
  ])

  if (categoriesRes.error) throw categoriesRes.error

  const categories = categoriesRes.data || []
  const budgets = (budgetsRes.data || []) as Array<{ id: string; category_id: string; amount: number }>
  const transactions = transactionsRes.data || []

  const spendingMap = new Map<string, number>()
  for (const t of transactions) {
    if (t.category_id) {
      spendingMap.set(t.category_id, (spendingMap.get(t.category_id) || 0) + t.amount)
    }
  }

  return categories.map(cat => {
    const budget = budgets.find(b => b.category_id === cat.id)
    const spent = spendingMap.get(cat.id) || 0
    const budgetAmount = budget ? Number(budget.amount) : null
    const remaining = budgetAmount !== null ? budgetAmount - spent : 0
    const percentage = budgetAmount ? Math.min((spent / budgetAmount) * 100, 999) : 0

    let status: BudgetWithSpending['status'] = 'unset'
    if (budgetAmount !== null) {
      if (percentage >= 100) status = 'exceeded'
      else if (percentage >= 80) status = 'warning'
      else status = 'ok'
    }

    return {
      budget_id: budget?.id,
      category_id: cat.id,
      category_name: cat.name,
      category_color: cat.color,
      budget_amount: budgetAmount,
      spent_amount: spent,
      remaining,
      percentage,
      status,
    }
  })
}

export async function upsertBudget(input: CreateBudgetInput): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('budgets').upsert(
    {
      user_id: user.id,
      category_id: input.category_id,
      amount: input.amount,
      month: input.month,
      year: input.year,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,category_id,month,year' }
  )

  if (error) throw error
}

export async function deleteBudget(id: string): Promise<void> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('budgets').delete().eq('id', id)
  if (error) throw error
}
