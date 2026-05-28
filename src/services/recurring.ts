import { createClient } from '@/lib/supabase/client'
import type { RecurringRule, CreateRecurringRuleInput } from '@/types/app'
import { format, addDays, addWeeks, addMonths, addYears, parseISO } from 'date-fns'
import { emptyStringsToNull } from '@/utils/sanitize'

export async function getRecurringRules(): Promise<RecurringRule[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recurring_rules')
    .select('*')
    .eq('is_active', true)
    .order('description')

  if (error) throw error
  return data || []
}

export async function createRecurringRule(input: CreateRecurringRuleInput): Promise<RecurringRule> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('recurring_rules')
    .insert({ ...emptyStringsToNull(input), user_id: user.id })
    .select()
    .single()

  if (error) throw error

  // If auto_generate, create transactions for next 12 months
  if (input.auto_generate) {
    await generateRecurringTransactions(data)
  }

  return data
}

export async function generateRecurringTransactions(rule: RecurringRule, months = 12): Promise<void> {
  const supabase = createClient()
  const transactions = []
  let currentDate = parseISO(rule.start_date)
  const endDate = rule.end_date ? parseISO(rule.end_date) : addMonths(new Date(), months)

  while (currentDate <= endDate && transactions.length < 365) {
    transactions.push({
      user_id: rule.user_id,
      description: rule.description,
      amount: rule.amount,
      type: rule.type,
      category_id: rule.category_id,
      account_id: rule.account_id,
      date: format(currentDate, 'yyyy-MM-dd'),
      status: 'pending' as const,
      recurring_rule_id: rule.id,
      is_deleted: false,
    })

    switch (rule.frequency) {
      case 'daily': currentDate = addDays(currentDate, rule.interval || 1); break
      case 'weekly': currentDate = addWeeks(currentDate, rule.interval || 1); break
      case 'monthly': currentDate = addMonths(currentDate, rule.interval || 1); break
      case 'yearly': currentDate = addYears(currentDate, rule.interval || 1); break
      default: break
    }
  }

  if (transactions.length > 0) {
    const { error } = await supabase.from('transactions').insert(transactions)
    if (error) throw error

    await supabase
      .from('recurring_rules')
      .update({ last_generated: format(new Date(), 'yyyy-MM-dd') })
      .eq('id', rule.id)
  }
}

export async function updateRecurringRule(id: string, input: Partial<CreateRecurringRuleInput>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('recurring_rules')
    .update({ ...emptyStringsToNull(input), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteRecurringRule(id: string, deleteTransactions = false): Promise<void> {
  const supabase = createClient()

  if (deleteTransactions) {
    await supabase
      .from('transactions')
      .update({ is_deleted: true })
      .eq('recurring_rule_id', id)
      .eq('status', 'pending')
  }

  const { error } = await supabase
    .from('recurring_rules')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}
