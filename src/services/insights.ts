import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export type InsightSeverity = 'positive' | 'neutral' | 'warning' | 'critical'
export type InsightType =
  | 'result' | 'saving' | 'top-category' | 'category-spike'
  | 'spending-trend' | 'recurring' | 'budget' | 'outlier'

export interface Insight {
  id: string
  type: InsightType
  severity: InsightSeverity
  title: string
  description: string
  metric?: string
}

export interface InsightSummary {
  month: string
  income: number
  expense: number
  result: number
  savingRate: number
  prevExpense: number
  topCategory: { name: string; amount: number; share: number } | null
  recurringMonthly: number
  insights: Insight[]
}

interface TxRow {
  amount: number
  type: string
  date: string
  description: string
  category: { name: string; color: string } | null
}

function pct(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return ((curr - prev) / Math.abs(prev)) * 100
}

export async function getInsights(): Promise<InsightSummary> {
  const supabase = createClient()
  const now = new Date()

  const curStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const curEnd = format(endOfMonth(now), 'yyyy-MM-dd')
  const prev = subMonths(now, 1)
  const prevStart = format(startOfMonth(prev), 'yyyy-MM-dd')
  const prevEnd = format(endOfMonth(prev), 'yyyy-MM-dd')

  const [curRes, prevRes, recurringRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, date, description, category:categories(name, color)')
      .eq('is_deleted', false)
      .neq('type', 'transfer')
      .gte('date', curStart)
      .lte('date', curEnd),
    supabase
      .from('transactions')
      .select('amount, type, date, description, category:categories(name, color)')
      .eq('is_deleted', false)
      .eq('type', 'expense')
      .gte('date', prevStart)
      .lte('date', prevEnd),
    supabase
      .from('recurring_rules')
      .select('amount, type, frequency, interval, is_active')
      .eq('is_active', true),
  ])

  const cur = (curRes.data || []) as unknown as TxRow[]
  const prevTx = (prevRes.data || []) as unknown as TxRow[]

  const income = cur.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const curExpenses = cur.filter(t => t.type === 'expense')
  const expense = curExpenses.reduce((s, t) => s + t.amount, 0)
  const prevExpense = prevTx.reduce((s, t) => s + t.amount, 0)
  const result = income - expense
  const savingRate = income > 0 ? (result / income) * 100 : 0

  // Category aggregation (current vs previous)
  const curByCat = new Map<string, number>()
  for (const t of curExpenses) {
    const name = t.category?.name || 'Sem categoria'
    curByCat.set(name, (curByCat.get(name) || 0) + t.amount)
  }
  const prevByCat = new Map<string, number>()
  for (const t of prevTx) {
    const name = t.category?.name || 'Sem categoria'
    prevByCat.set(name, (prevByCat.get(name) || 0) + t.amount)
  }

  const sortedCats = Array.from(curByCat.entries()).sort((a, b) => b[1] - a[1])
  const topCategory = sortedCats.length > 0
    ? { name: sortedCats[0][0], amount: sortedCats[0][1], share: expense > 0 ? (sortedCats[0][1] / expense) * 100 : 0 }
    : null

  // Monthly equivalent of recurring expenses
  const recurringMonthly = (recurringRes.data || [])
    .filter((r: { type: string }) => r.type === 'expense')
    .reduce((s: number, r: { amount: number; frequency: string; interval: number }) => {
      const interval = Math.max(1, r.interval || 1)
      let monthly = r.amount
      if (r.frequency === 'daily') monthly = (r.amount * 30) / interval
      else if (r.frequency === 'weekly') monthly = (r.amount * 4.345) / interval
      else if (r.frequency === 'monthly') monthly = r.amount / interval
      else if (r.frequency === 'yearly') monthly = r.amount / (12 * interval)
      return s + monthly
    }, 0)

  const insights: Insight[] = []
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // 1. Result of the month
  if (income > 0 || expense > 0) {
    if (result < 0) {
      insights.push({
        id: 'result-negative',
        type: 'result',
        severity: 'critical',
        title: 'Você gastou mais do que ganhou',
        description: `Neste mês suas despesas superaram as receitas em ${fmt(Math.abs(result))}. Reveja gastos não essenciais para reequilibrar.`,
        metric: fmt(result),
      })
    } else if (income > 0) {
      const sev: InsightSeverity = savingRate >= 20 ? 'positive' : savingRate >= 5 ? 'neutral' : 'warning'
      insights.push({
        id: 'saving-rate',
        type: 'saving',
        severity: sev,
        title: savingRate >= 20 ? 'Ótima taxa de poupança!' : savingRate >= 5 ? 'Você está poupando' : 'Margem de poupança baixa',
        description: `Você guardou ${savingRate.toFixed(0)}% da sua renda (${fmt(result)}) este mês.${savingRate < 5 ? ' Tente reservar pelo menos 10%.' : ''}`,
        metric: `${savingRate.toFixed(0)}%`,
      })
    }
  }

  // 2. Top category
  if (topCategory && topCategory.share >= 25) {
    insights.push({
      id: 'top-category',
      type: 'top-category',
      severity: topCategory.share >= 45 ? 'warning' : 'neutral',
      title: `${topCategory.name} concentra seus gastos`,
      description: `${topCategory.name} representa ${topCategory.share.toFixed(0)}% das suas despesas (${fmt(topCategory.amount)}) este mês.`,
      metric: `${topCategory.share.toFixed(0)}%`,
    })
  }

  // 3. Biggest category spike vs last month
  let spike: { name: string; change: number; amount: number } | null = null
  for (const [name, amount] of curByCat.entries()) {
    const prevAmount = prevByCat.get(name) || 0
    if (prevAmount < 50) continue // ignore tiny baselines
    const change = pct(amount, prevAmount)
    if (change >= 30 && (!spike || change > spike.change)) {
      spike = { name, change, amount }
    }
  }
  if (spike) {
    insights.push({
      id: 'category-spike',
      type: 'category-spike',
      severity: spike.change >= 80 ? 'warning' : 'neutral',
      title: `Gastos com ${spike.name} subiram`,
      description: `Seus gastos com ${spike.name} aumentaram ${spike.change.toFixed(0)}% em relação ao mês passado, chegando a ${fmt(spike.amount)}.`,
      metric: `+${spike.change.toFixed(0)}%`,
    })
  }

  // 4. Overall spending trend
  if (prevExpense >= 50 && expense > 0) {
    const change = pct(expense, prevExpense)
    if (Math.abs(change) >= 15) {
      insights.push({
        id: 'spending-trend',
        type: 'spending-trend',
        severity: change > 0 ? 'warning' : 'positive',
        title: change > 0 ? 'Suas despesas aumentaram' : 'Você reduziu despesas',
        description: `O total de despesas ${change > 0 ? 'subiu' : 'caiu'} ${Math.abs(change).toFixed(0)}% comparado ao mês anterior (${fmt(prevExpense)} → ${fmt(expense)}).`,
        metric: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
      })
    }
  }

  // 5. Recurring/subscriptions weight
  if (recurringMonthly > 0) {
    const share = income > 0 ? (recurringMonthly / income) * 100 : 0
    insights.push({
      id: 'recurring',
      type: 'recurring',
      severity: share >= 40 ? 'warning' : 'neutral',
      title: 'Gastos recorrentes',
      description: `Você tem cerca de ${fmt(recurringMonthly)}/mês em despesas recorrentes${share > 0 ? `, o equivalente a ${share.toFixed(0)}% da sua renda` : ''}. Revise assinaturas que não usa.`,
      metric: fmt(recurringMonthly),
    })
  }

  // 6. Outlier transaction
  if (curExpenses.length >= 4) {
    const avg = expense / curExpenses.length
    const largest = curExpenses.reduce((max, t) => (t.amount > max.amount ? t : max), curExpenses[0])
    if (largest.amount >= avg * 3 && largest.amount >= 200) {
      insights.push({
        id: 'outlier',
        type: 'outlier',
        severity: 'neutral',
        title: 'Despesa fora do padrão',
        description: `"${largest.description}" (${fmt(largest.amount)}) foi bem acima da sua média de gastos deste mês (${fmt(avg)}).`,
        metric: fmt(largest.amount),
      })
    }
  }

  // Budgets (best-effort; table may not exist)
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const m = now.getMonth() + 1
      const y = now.getFullYear()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: budgets } = await (supabase as any)
        .from('budgets')
        .select('amount, category_id, category:categories(name)')
        .eq('user_id', user.id)
        .eq('month', m)
        .eq('year', y)
      if (budgets && budgets.length > 0) {
        const spentByCat = new Map<string, number>()
        // Build spent per category_id for the current month
        const { data: catTx } = await supabase
          .from('transactions')
          .select('amount, category_id')
          .eq('is_deleted', false)
          .eq('type', 'expense')
          .gte('date', curStart)
          .lte('date', curEnd)
        for (const t of (catTx || []) as Array<{ amount: number; category_id: string | null }>) {
          if (!t.category_id) continue
          spentByCat.set(t.category_id, (spentByCat.get(t.category_id) || 0) + t.amount)
        }
        for (const b of budgets as Array<{ amount: number; category_id: string; category: { name: string } | null }>) {
          const spent = spentByCat.get(b.category_id) || 0
          if (spent > b.amount) {
            insights.push({
              id: `budget-${b.category_id}`,
              type: 'budget',
              severity: 'critical',
              title: `Orçamento estourado: ${b.category?.name || 'categoria'}`,
              description: `Você gastou ${fmt(spent)} em ${b.category?.name || 'esta categoria'}, ultrapassando o orçamento de ${fmt(b.amount)}.`,
              metric: fmt(spent - b.amount),
            })
          }
        }
      }
    }
  } catch {
    // budgets table unavailable — skip silently
  }

  // Order by severity weight
  const weight: Record<InsightSeverity, number> = { critical: 0, warning: 1, neutral: 2, positive: 3 }
  insights.sort((a, b) => weight[a.severity] - weight[b.severity])

  return {
    month: format(now, 'yyyy-MM'),
    income,
    expense,
    result,
    savingRate,
    prevExpense,
    topCategory,
    recurringMonthly,
    insights,
  }
}
