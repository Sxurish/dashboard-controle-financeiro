import { createClient } from '@/lib/supabase/client'
import type { CreditCard, CreditCardInvoice, CreateCreditCardInput, Transaction } from '@/types/app'
import { format, addMonths, parseISO, startOfMonth, getDaysInMonth } from 'date-fns'

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

/* ---------------------------------------------------------------------------
 * Invoices (faturas)
 *
 * Invoice membership is computed on the fly from each transaction's date and
 * the card's closing day, so it always reflects reality without needing an
 * extra invoice_id column. The credit_card_invoices table is used only to
 * persist the "paid" state of a given reference month.
 * ------------------------------------------------------------------------- */

export interface ComputedInvoice {
  referenceMonth: string // 'yyyy-MM-01'
  label: string
  closeDate: string // 'yyyy-MM-dd'
  dueDate: string // 'yyyy-MM-dd'
  total: number
  status: 'open' | 'closed' | 'paid'
  paidAt: string | null
  transactions: Transaction[]
}

/** Clamp a day to the number of days in the given month. */
function clampDay(year: number, monthIndex0: number, day: number): number {
  const days = getDaysInMonth(new Date(year, monthIndex0, 1))
  return Math.min(day, days)
}

/** Reference month (first day) of the invoice a transaction date belongs to. */
function referenceMonthFor(dateISO: string, closingDay: number): string {
  const d = parseISO(dateISO)
  const ref = d.getDate() <= closingDay ? startOfMonth(d) : startOfMonth(addMonths(d, 1))
  return format(ref, 'yyyy-MM-01')
}

function closeDateFor(referenceMonth: string, closingDay: number): string {
  const ref = parseISO(referenceMonth)
  const day = clampDay(ref.getFullYear(), ref.getMonth(), closingDay)
  return format(new Date(ref.getFullYear(), ref.getMonth(), day), 'yyyy-MM-dd')
}

function dueDateFor(referenceMonth: string, dueDay: number): string {
  const ref = parseISO(referenceMonth)
  const day = clampDay(ref.getFullYear(), ref.getMonth(), dueDay)
  return format(new Date(ref.getFullYear(), ref.getMonth(), day), 'yyyy-MM-dd')
}

/**
 * Computes the invoices for a card over a window of months, merging in any
 * persisted "paid" state. Returns invoices ordered most-recent first.
 */
export async function getCardInvoicesComputed(
  card: CreditCard,
  monthsBack = 6,
  monthsForward = 1
): Promise<ComputedInvoice[]> {
  const supabase = createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  // Window of transactions to consider (a bit wider than the invoice window
  // so late-cycle purchases land in the right invoice).
  const windowStart = format(startOfMonth(addMonths(new Date(), -(monthsBack + 1))), 'yyyy-MM-dd')

  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('credit_card_id', card.id)
    .eq('is_deleted', false)
    .eq('type', 'expense')
    .gte('date', windowStart)
    .order('date', { ascending: false })

  if (txError) throw txError
  const transactions = (txData || []) as Transaction[]

  // Persisted paid state keyed by reference month.
  const { data: paidRows } = await supabase
    .from('credit_card_invoices')
    .select('*')
    .eq('credit_card_id', card.id)
  const paidMap = new Map<string, CreditCardInvoice>()
  for (const row of (paidRows || []) as CreditCardInvoice[]) {
    paidMap.set(row.reference_month, row)
  }

  // Build the set of reference months to show: every month in the window
  // plus any month that actually has transactions or a paid record.
  const refMonths = new Set<string>()
  for (let i = -monthsForward; i <= monthsBack; i++) {
    refMonths.add(format(startOfMonth(addMonths(new Date(), -i)), 'yyyy-MM-01'))
  }
  for (const t of transactions) refMonths.add(referenceMonthFor(t.date, card.closing_day))
  for (const m of paidMap.keys()) refMonths.add(m)

  const grouped = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const ref = referenceMonthFor(t.date, card.closing_day)
    if (!grouped.has(ref)) grouped.set(ref, [])
    grouped.get(ref)!.push(t)
  }

  const invoices: ComputedInvoice[] = Array.from(refMonths).map((referenceMonth) => {
    const txs = grouped.get(referenceMonth) || []
    const total = txs.reduce((sum, t) => sum + t.amount, 0)
    const closeDate = closeDateFor(referenceMonth, card.closing_day)
    const dueDate = dueDateFor(referenceMonth, card.due_day)
    const paidRow = paidMap.get(referenceMonth)

    let status: ComputedInvoice['status']
    if (paidRow && paidRow.status === 'paid') status = 'paid'
    else if (today > closeDate) status = 'closed'
    else status = 'open'

    return {
      referenceMonth,
      label: format(parseISO(referenceMonth), 'MM/yyyy'),
      closeDate,
      dueDate,
      total,
      status,
      paidAt: paidRow?.paid_at ?? null,
      transactions: txs,
    }
  })

  return invoices.sort((a, b) => (a.referenceMonth < b.referenceMonth ? 1 : -1))
}

/**
 * Used limit = sum of every invoice not yet paid (open + closed).
 * Available = limit - used.
 */
export function computeUsedLimit(invoices: ComputedInvoice[]): number {
  return invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)
}

/** Persist a paid invoice for the given reference month. */
export async function payInvoice(card: CreditCard, invoice: ComputedInvoice): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { error } = await supabase
    .from('credit_card_invoices')
    .upsert(
      {
        credit_card_id: card.id,
        user_id: user.id,
        reference_month: invoice.referenceMonth,
        total_amount: invoice.total,
        status: 'paid',
        due_date: invoice.dueDate,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'credit_card_id,reference_month' }
    )

  if (error) throw error
}

/** Revert a previously paid invoice back to its computed (unpaid) state. */
export async function unpayInvoice(card: CreditCard, referenceMonth: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('credit_card_invoices')
    .delete()
    .eq('credit_card_id', card.id)
    .eq('reference_month', referenceMonth)

  if (error) throw error
}

/* ----- legacy helpers kept for compatibility ----- */

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
