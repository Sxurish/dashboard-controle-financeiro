import { createClient } from '@/lib/supabase/client'
import type { ParsedEntry } from '@/utils/statement-parser'

export interface ImportRow extends ParsedEntry {
  selected: boolean
  category_id: string | null
}

export interface ImportPayload {
  account_id: string
  rows: ImportRow[]
}

export interface ImportSummary {
  inserted: number
  skipped: number
}

/**
 * Bulk-inserts selected statement rows as transactions for the given account.
 * Imported entries are marked as 'paid' (they already happened in the bank).
 */
export async function importTransactions(payload: ImportPayload): Promise<ImportSummary> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const selected = payload.rows.filter(r => r.selected)
  if (selected.length === 0) return { inserted: 0, skipped: 0 }

  const records = selected.map(r => ({
    user_id: user.id,
    description: r.description,
    amount: r.amount,
    type: r.type,
    category_id: r.category_id || null,
    account_id: payload.account_id,
    date: r.date,
    status: 'paid' as const,
    notes: 'Importado de extrato',
    is_deleted: false,
  }))

  const { error } = await supabase.from('transactions').insert(records)
  if (error) throw error

  return { inserted: records.length, skipped: payload.rows.length - records.length }
}

/**
 * Returns the set of "date|amount|type" keys already present for the account,
 * so the import preview can flag likely duplicates.
 */
export async function getExistingKeys(accountId: string, dates: string[]): Promise<Set<string>> {
  if (dates.length === 0) return new Set()
  const supabase = createClient()

  const min = dates.reduce((a, b) => (a < b ? a : b))
  const max = dates.reduce((a, b) => (a > b ? a : b))

  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount, type')
    .eq('account_id', accountId)
    .eq('is_deleted', false)
    .gte('date', min)
    .lte('date', max)

  if (error) throw error

  const keys = new Set<string>()
  for (const t of data || []) {
    keys.add(`${t.date}|${t.amount}|${t.type}`)
  }
  return keys
}
