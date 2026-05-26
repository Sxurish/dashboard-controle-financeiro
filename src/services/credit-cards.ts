import { createClient } from '@/lib/supabase/client'
import type { CreditCard, CreditCardInvoice, CreateCreditCardInput } from '@/types/app'
import { format, addMonths } from 'date-fns'

export async function getCreditCards(): Promise<CreditCard[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data || []
}

export async function createCreditCard(input: CreateCreditCardInput): Promise<CreditCard> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('credit_cards')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCreditCard(id: string, input: Partial<CreateCreditCardInput>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('credit_cards')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteCreditCard(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('credit_cards')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function getCardInvoices(cardId: string): Promise<CreditCardInvoice[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('credit_card_invoices')
    .select('*')
    .eq('credit_card_id', cardId)
    .order('reference_month', { ascending: false })
    .limit(12)

  if (error) throw error
  return data || []
}

export async function getOrCreateCurrentInvoice(card: CreditCard): Promise<CreditCardInvoice> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const now = new Date()
  const referenceMonth = format(now.getDate() > card.closing_day ? addMonths(now, 1) : now, 'yyyy-MM-01')

  const { data: existing } = await supabase
    .from('credit_card_invoices')
    .select('*')
    .eq('credit_card_id', card.id)
    .eq('reference_month', referenceMonth)
    .single()

  if (existing) return existing

  const dueDate = new Date(
    parseInt(referenceMonth.substring(0, 4)),
    parseInt(referenceMonth.substring(5, 7)) - 1,
    card.due_day
  )

  const { data, error } = await supabase
    .from('credit_card_invoices')
    .insert({
      credit_card_id: card.id,
      user_id: user.id,
      reference_month: referenceMonth,
      total_amount: 0,
      status: 'open',
      due_date: format(dueDate, 'yyyy-MM-dd'),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getCardUsedLimit(cardId: string): Promise<number> {
  const supabase = createClient()
  const now = new Date()
  const startOfMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')
  const endOfMonth = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('credit_card_id', cardId)
    .eq('is_deleted', false)
    .eq('type', 'expense')
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)

  if (error) return 0
  return (data || []).reduce((sum, t) => sum + t.amount, 0)
}
