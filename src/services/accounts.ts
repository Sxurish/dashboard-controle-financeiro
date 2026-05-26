import { createClient } from '@/lib/supabase/client'
import type { Account, CreateAccountInput } from '@/types/app'

export async function getAccounts(): Promise<Account[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data || []
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAccount(id: string, input: Partial<CreateAccountInput>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('accounts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteAccount(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('accounts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function getTotalBalance(): Promise<number> {
  const accounts = await getAccounts()
  return accounts
    .filter(a => a.type !== 'credit')
    .reduce((sum, a) => sum + a.balance, 0)
}
