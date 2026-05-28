import { createClient } from '@/lib/supabase/client'
import type { CreateTransactionInput, TransactionFilters, TransactionWithRelations, PaginatedResult } from '@/types/app'
import { format, addMonths } from 'date-fns'
import { emptyStringsToNull } from '@/utils/sanitize'

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<PaginatedResult<TransactionWithRelations>> {
  const supabase = createClient()
  const {
    search,
    month,
    year,
    category_id,
    type,
    status,
    account_id,
    sort_by = 'date',
    sort_order = 'desc',
    page = 1,
    per_page = 20,
  } = filters

  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*),
      account:accounts(*),
      credit_card:credit_cards(*)
    `, { count: 'exact' })
    .eq('is_deleted', false)

  if (search) {
    query = query.ilike('description', `%${search}%`)
  }

  if (month && year) {
    const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd')
    const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd')
    query = query.gte('date', startDate).lte('date', endDate)
  } else if (year) {
    query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`)
  }

  if (category_id) query = query.eq('category_id', category_id)
  if (type && type !== 'all') query = query.eq('type', type)
  if (status && status !== 'all') query = query.eq('status', status)
  if (account_id) query = query.eq('account_id', account_id)

  const sortColumn = sort_by === 'amount' ? 'amount' : sort_by === 'description' ? 'description' : 'date'
  query = query.order(sortColumn, { ascending: sort_order === 'asc' })

  const from = (page - 1) * per_page
  query = query.range(from, from + per_page - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: (data || []) as TransactionWithRelations[],
    count: count || 0,
    page,
    per_page,
    total_pages: Math.ceil((count || 0) / per_page),
  }
}

export async function getTransactionById(id: string): Promise<TransactionWithRelations | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select(`*, category:categories(*), account:accounts(*), credit_card:credit_cards(*)`)
    .eq('id', id)
    .single()

  if (error) return null
  return data as TransactionWithRelations
}

export async function createTransaction(input: CreateTransactionInput): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  if (input.is_installment && input.installment_count && input.installment_count >= 2) {
    // Create installment group
    const { data: group, error: groupError } = await supabase
      .from('installment_groups')
      .insert({
        user_id: user.id,
        description: input.description,
        total_amount: input.amount,
        installment_count: input.installment_count,
      })
      .select()
      .single()

    if (groupError) throw groupError

    const installmentAmount = input.amount / input.installment_count
    const installments = Array.from({ length: input.installment_count }, (_, i) => {
      const installmentDate = format(
        addMonths(new Date(input.date), i),
        'yyyy-MM-dd'
      )
      return {
        user_id: user.id,
        description: `${input.description} (${i + 1}/${input.installment_count})`,
        amount: Math.round(installmentAmount * 100) / 100,
        type: input.type as 'income' | 'expense',
        category_id: input.category_id || null,
        account_id: input.account_id,
        credit_card_id: input.credit_card_id || null,
        installment_group_id: group.id,
        installment_number: i + 1,
        installment_total: input.installment_count,
        date: installmentDate,
        due_date: input.due_date || null,
        status: i === 0 ? input.status : 'pending' as const,
        payment_method: input.payment_method || null,
        notes: input.notes || null,
        is_deleted: false,
      }
    })

    const { error } = await supabase.from('transactions').insert(installments)
    if (error) throw error
  } else if (input.type === 'transfer' && input.transfer_account_id) {
    // Create two transactions for transfers
    const { error: error1 } = await supabase.from('transactions').insert({
      user_id: user.id,
      description: input.description,
      amount: input.amount,
      type: 'expense',
      category_id: null,
      account_id: input.account_id,
      date: input.date,
      status: input.status,
      payment_method: 'bank_transfer',
      notes: `Transferência para conta`,
      transfer_account_id: input.transfer_account_id,
      is_deleted: false,
    })
    if (error1) throw error1

    const { error: error2 } = await supabase.from('transactions').insert({
      user_id: user.id,
      description: input.description,
      amount: input.amount,
      type: 'income',
      category_id: null,
      account_id: input.transfer_account_id,
      date: input.date,
      status: input.status,
      payment_method: 'bank_transfer',
      notes: `Transferência de conta`,
      transfer_account_id: input.account_id,
      is_deleted: false,
    })
    if (error2) throw error2
  } else {
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      description: input.description,
      amount: input.amount,
      type: input.type,
      category_id: input.category_id || null,
      account_id: input.account_id,
      credit_card_id: input.credit_card_id || null,
      date: input.date,
      due_date: input.due_date || null,
      status: input.status,
      payment_method: input.payment_method || null,
      notes: input.notes || null,
      is_deleted: false,
    })
    if (error) throw error
  }
}

export async function updateTransaction(id: string, input: Partial<CreateTransactionInput>): Promise<void> {
  const supabase = createClient()
  // Exclude app-only fields that don't exist in the DB schema
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { is_installment, installment_count, ...dbFields } = input
  const { error } = await supabase
    .from('transactions')
    .update({ ...emptyStringsToNull(dbFields), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('transactions')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function getMonthlyKPIs(year: number, month: number) {
  const supabase = createClient()
  const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd')
  const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd')

  const prevDate = new Date(year, month - 2, 1)
  const prevStart = format(new Date(prevDate.getFullYear(), prevDate.getMonth(), 1), 'yyyy-MM-dd')
  const prevEnd = format(new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0), 'yyyy-MM-dd')

  const [current, previous] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('is_deleted', false)
      .neq('type', 'transfer')
      .gte('date', startDate)
      .lte('date', endDate),
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('is_deleted', false)
      .neq('type', 'transfer')
      .gte('date', prevStart)
      .lte('date', prevEnd),
  ])

  const calcKPIs = (rows: { amount: number; type: string }[]) => ({
    income: rows.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0),
    expense: rows.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0),
  })

  const curr = calcKPIs(current.data || [])
  const prev = calcKPIs(previous.data || [])

  return {
    monthIncome: curr.income,
    monthExpense: curr.expense,
    monthResult: curr.income - curr.expense,
    prevMonthIncome: prev.income,
    prevMonthExpense: prev.expense,
    prevMonthResult: prev.income - prev.expense,
  }
}

export async function getChartData(year: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, date')
    .eq('is_deleted', false)
    .neq('type', 'transfer')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)

  if (error) throw error

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthData = (data || []).filter(t => {
      const tMonth = new Date(t.date).getMonth()
      return tMonth === i
    })
    return {
      name: format(new Date(year, i, 1), 'MMM', { locale: undefined }),
      income: monthData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: monthData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    }
  })

  return months
}

export async function getCategoryChartData(year: number, month: number) {
  const supabase = createClient()
  const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd')
  const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd')

  type CategoryRow = { amount: number; type: string; category: { name: string; color: string } | null }
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, type, category:categories(name, color)')
    .eq('is_deleted', false)
    .eq('type', 'expense')
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error

  const rows = (data || []) as unknown as CategoryRow[]
  const categoryMap = new Map<string, { name: string; value: number; color: string }>()
  const total = rows.reduce((sum, t) => sum + t.amount, 0)

  rows.forEach(t => {
    const catName = t.category?.name || 'Sem categoria'
    const catColor = t.category?.color || '#6b7280'
    const key = catName
    if (categoryMap.has(key)) {
      categoryMap.get(key)!.value += t.amount
    } else {
      categoryMap.set(key, { name: catName, value: t.amount, color: catColor })
    }
  })

  return Array.from(categoryMap.values())
    .sort((a, b) => b.value - a.value)
    .map(cat => ({
      ...cat,
      percentage: total > 0 ? (cat.value / total) * 100 : 0,
    }))
}

export async function getRecentTransactions(limit = 8): Promise<TransactionWithRelations[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select(`*, category:categories(*), account:accounts(*), credit_card:credit_cards(*)`)
    .eq('is_deleted', false)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []) as TransactionWithRelations[]
}

export async function getOverdueTransactions() {
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('is_deleted', false)
    .eq('status', 'pending')
    .lt('due_date', today)
    .limit(50)

  if (error) throw error

  // Auto-mark as overdue
  if (data && data.length > 0) {
    await supabase
      .from('transactions')
      .update({ status: 'overdue' })
      .in('id', data.map(t => t.id))
  }

  return data || []
}

export async function exportTransactionsCSV(filters: TransactionFilters = {}): Promise<string> {
  const result = await getTransactions({ ...filters, per_page: 10000 })
  const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Conta', 'Valor', 'Status', 'Método']
  const rows = result.data.map(t => [
    t.date,
    t.description,
    t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
    (t.category as { name: string } | null)?.name || '',
    (t.account as { name: string } | null)?.name || '',
    t.amount.toFixed(2).replace('.', ','),
    t.status,
    t.payment_method || '',
  ])

  return [headers, ...rows].map(row => row.join(';')).join('\n')
}
