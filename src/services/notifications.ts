import { createClient } from '@/lib/supabase/client'
import { format, addDays } from 'date-fns'
import { getBudgetsWithSpending } from './budgets'

export type NotificationType = 'overdue' | 'upcoming' | 'goal' | 'budget'
export type NotificationSeverity = 'error' | 'warning' | 'success' | 'info'

export interface AppNotification {
  id: string            // stable key so read-state persists across refreshes
  type: NotificationType
  severity: NotificationSeverity
  title: string
  message: string
  date?: string
  href: string
}

/**
 * Aggregates actionable notifications from across the app:
 * overdue bills, bills due in the next 5 days, goals reached,
 * and budgets exceeded for the current month.
 */
export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = createClient()
  const notifications: AppNotification[] = []

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const soonStr = format(addDays(today, 5), 'yyyy-MM-dd')

  const [overdueRes, upcomingRes, goalsRes] = await Promise.all([
    // Overdue: pending bills past their due date
    supabase
      .from('transactions')
      .select('id, description, amount, due_date')
      .eq('is_deleted', false)
      .eq('status', 'pending')
      .lt('due_date', todayStr)
      .order('due_date', { ascending: true })
      .limit(20),
    // Upcoming: pending bills due within 5 days
    supabase
      .from('transactions')
      .select('id, description, amount, due_date')
      .eq('is_deleted', false)
      .eq('status', 'pending')
      .gte('due_date', todayStr)
      .lte('due_date', soonStr)
      .order('due_date', { ascending: true })
      .limit(20),
    // Goals reached
    supabase
      .from('goals')
      .select('id, name, target_amount, current_amount, is_completed')
      .eq('is_completed', true)
      .limit(20),
  ])

  for (const t of overdueRes.data || []) {
    notifications.push({
      id: `overdue-${t.id}`,
      type: 'overdue',
      severity: 'error',
      title: 'Conta em atraso',
      message: `${t.description} venceu em ${formatBR(t.due_date)}.`,
      date: t.due_date ?? undefined,
      href: '/dashboard/transactions',
    })
  }

  for (const t of upcomingRes.data || []) {
    notifications.push({
      id: `upcoming-${t.id}`,
      type: 'upcoming',
      severity: 'warning',
      title: 'Vencimento próximo',
      message: `${t.description} vence em ${formatBR(t.due_date)}.`,
      date: t.due_date ?? undefined,
      href: '/dashboard/transactions',
    })
  }

  for (const g of goalsRes.data || []) {
    notifications.push({
      id: `goal-${g.id}`,
      type: 'goal',
      severity: 'success',
      title: 'Meta alcançada! 🎉',
      message: `Você atingiu a meta "${g.name}".`,
      href: '/dashboard/goals',
    })
  }

  // Budgets exceeded this month
  try {
    const budgets = await getBudgetsWithSpending(today.getFullYear(), today.getMonth() + 1)
    for (const b of budgets) {
      if (b.status === 'exceeded') {
        notifications.push({
          id: `budget-${b.category_id}-${today.getFullYear()}-${today.getMonth() + 1}`,
          type: 'budget',
          severity: 'error',
          title: 'Orçamento estourado',
          message: `Você ultrapassou o limite de "${b.category_name}" (${b.percentage.toFixed(0)}%).`,
          href: '/dashboard/budget',
        })
      }
    }
  } catch {
    // budgets table may not exist yet — ignore silently
  }

  return notifications
}

function formatBR(date: string | null): string {
  if (!date) return ''
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}
