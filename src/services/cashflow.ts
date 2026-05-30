import { createClient } from '@/lib/supabase/client'
import { getTotalBalance } from './accounts'
import { getCreditCards, getCardInvoicesComputed } from './credit-cards'
import {
  format, parseISO, addDays, addWeeks, addMonths, addYears,
  isAfter, isBefore, startOfDay, isSameDay,
} from 'date-fns'
import type { RecurringRule } from '@/types/app'

export interface CashFlowEvent {
  date: string // yyyy-MM-dd
  description: string
  amount: number // positive = inflow, negative = outflow
  kind: 'recurring' | 'pending' | 'invoice'
}

export interface CashFlowPoint {
  date: string // yyyy-MM-dd
  label: string // dd/MM
  balance: number
  inflow: number
  outflow: number
  events: CashFlowEvent[]
}

export interface CashFlowProjection {
  startBalance: number
  endBalance: number
  lowestBalance: number
  lowestDate: string
  totalInflow: number
  totalOutflow: number
  points: CashFlowPoint[]
  negativeAhead: boolean
}

/** Generate occurrences of a recurring rule between two dates (inclusive). */
function recurringOccurrences(rule: RecurringRule, from: Date, to: Date): string[] {
  const result: string[] = []
  const start = parseISO(rule.start_date)
  const end = rule.end_date ? parseISO(rule.end_date) : null
  const step = Math.max(1, rule.interval)

  // Walk forward from start_date until past `to`, collecting dates within window.
  let cursor = start
  let guard = 0
  while (!isAfter(cursor, to) && guard < 2000) {
    guard++
    const withinEnd = !end || !isAfter(cursor, end)
    if (withinEnd && !isBefore(cursor, from)) {
      result.push(format(cursor, 'yyyy-MM-dd'))
    }
    switch (rule.frequency) {
      case 'daily': cursor = addDays(cursor, step); break
      case 'weekly': cursor = addWeeks(cursor, step); break
      case 'monthly': cursor = addMonths(cursor, step); break
      case 'yearly': cursor = addYears(cursor, step); break
      default: cursor = addMonths(cursor, step)
    }
    if (end && isAfter(cursor, end)) break
  }
  return result
}

/**
 * Projects daily cash balance for the next `days` days, combining:
 *  - current total account balance (starting point)
 *  - active recurring rules (future occurrences)
 *  - pending/overdue non-card transactions (by due date, else date)
 *  - unpaid credit card invoices (outflow on their due date)
 */
export async function getCashFlowProjection(days = 90): Promise<CashFlowProjection> {
  const supabase = createClient()
  const today = startOfDay(new Date())
  const horizon = addDays(today, days)

  const [startBalance, rules, creditCards, pendingRes] = await Promise.all([
    getTotalBalance(),
    getActiveRules(supabase),
    getCreditCards(),
    supabase
      .from('transactions')
      .select('id, description, amount, type, date, due_date, status, credit_card_id')
      .eq('is_deleted', false)
      .is('credit_card_id', null)
      .in('status', ['pending', 'overdue']),
  ])

  const events: CashFlowEvent[] = []

  // 1. Recurring occurrences
  for (const rule of rules) {
    const dates = recurringOccurrences(rule, today, horizon)
    for (const d of dates) {
      events.push({
        date: d,
        description: rule.description,
        amount: rule.type === 'income' ? rule.amount : -rule.amount,
        kind: 'recurring',
      })
    }
  }

  // 2. Pending / overdue transactions (non-card). Overdue ones land on today.
  for (const t of (pendingRes.data || []) as Array<{
    description: string; amount: number; type: string; date: string; due_date: string | null
  }>) {
    const ref = t.due_date || t.date
    const refDate = parseISO(ref)
    const effective = isBefore(refDate, today) ? today : refDate
    if (isAfter(effective, horizon)) continue
    events.push({
      date: format(effective, 'yyyy-MM-dd'),
      description: t.description,
      amount: t.type === 'income' ? t.amount : -t.amount,
      kind: 'pending',
    })
  }

  // 3. Unpaid credit card invoices → outflow on due date
  for (const card of creditCards) {
    const invoices = await getCardInvoicesComputed(card, 2, 3)
    for (const inv of invoices) {
      if (inv.status === 'paid' || inv.total <= 0) continue
      const due = parseISO(inv.dueDate)
      const effective = isBefore(due, today) ? today : due
      if (isAfter(effective, horizon)) continue
      events.push({
        date: format(effective, 'yyyy-MM-dd'),
        description: `Fatura ${card.name} (${inv.label})`,
        amount: -inv.total,
        kind: 'invoice',
      })
    }
  }

  // Build daily points
  const points: CashFlowPoint[] = []
  let running = startBalance
  let lowestBalance = startBalance
  let lowestDate = format(today, 'yyyy-MM-dd')
  let totalInflow = 0
  let totalOutflow = 0

  for (let i = 0; i <= days; i++) {
    const day = addDays(today, i)
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day))

    let inflow = 0
    let outflow = 0
    for (const e of dayEvents) {
      if (e.amount >= 0) inflow += e.amount
      else outflow += Math.abs(e.amount)
    }
    running += inflow - outflow
    totalInflow += inflow
    totalOutflow += outflow

    if (running < lowestBalance) {
      lowestBalance = running
      lowestDate = dayStr
    }

    points.push({
      date: dayStr,
      label: format(day, 'dd/MM'),
      balance: Math.round(running * 100) / 100,
      inflow,
      outflow,
      events: dayEvents,
    })
  }

  return {
    startBalance,
    endBalance: points[points.length - 1]?.balance ?? startBalance,
    lowestBalance: Math.round(lowestBalance * 100) / 100,
    lowestDate,
    totalInflow,
    totalOutflow,
    points,
    negativeAhead: lowestBalance < 0,
  }
}

async function getActiveRules(
  supabase: ReturnType<typeof createClient>
): Promise<RecurringRule[]> {
  const { data } = await supabase
    .from('recurring_rules')
    .select('*')
    .eq('is_active', true)
  return (data || []) as RecurringRule[]
}
