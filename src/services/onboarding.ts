import { createClient } from '@/lib/supabase/client'
import type { AccountType, CategoryType } from '@/types/app'

const DEFAULT_CATEGORIES: Array<{ name: string; type: CategoryType; color: string; icon: string }> = [
  // Despesas
  { name: 'Moradia', type: 'expense', color: '#3b82f6', icon: 'home' },
  { name: 'Alimentação', type: 'expense', color: '#f59e0b', icon: 'utensils' },
  { name: 'Transporte', type: 'expense', color: '#06b6d4', icon: 'car' },
  { name: 'Saúde', type: 'expense', color: '#ef4444', icon: 'heart' },
  { name: 'Lazer', type: 'expense', color: '#ec4899', icon: 'gamepad' },
  { name: 'Educação', type: 'expense', color: '#8b5cf6', icon: 'book' },
  { name: 'Compras', type: 'expense', color: '#f97316', icon: 'shopping-bag' },
  { name: 'Assinaturas', type: 'expense', color: '#64748b', icon: 'repeat' },
  // Receitas
  { name: 'Salário', type: 'income', color: '#22c55e', icon: 'briefcase' },
  { name: 'Freelance', type: 'income', color: '#84cc16', icon: 'laptop' },
  { name: 'Investimentos', type: 'income', color: '#10b981', icon: 'trending-up' },
  { name: 'Outros', type: 'income', color: '#14b8a6', icon: 'plus' },
]

export interface OnboardingData {
  accountName: string
  accountType: AccountType
  accountBalance: number
  seedCategories: boolean
}

/**
 * A user needs onboarding when they have no active accounts yet.
 */
export async function needsOnboarding(): Promise<boolean> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) return false
  return (count ?? 0) === 0
}

export async function completeOnboarding(data: OnboardingData): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // 1. Create the first account
  const { error: accError } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: data.accountName,
    type: data.accountType,
    balance: data.accountBalance,
    is_active: true,
  })
  if (accError) throw accError

  // 2. Seed default categories (only the ones the user doesn't have yet)
  if (data.seedCategories) {
    const { data: existing } = await supabase
      .from('categories')
      .select('name')
      .eq('user_id', user.id)

    const existingNames = new Set((existing || []).map(c => c.name.toLowerCase()))
    const toCreate = DEFAULT_CATEGORIES
      .filter(c => !existingNames.has(c.name.toLowerCase()))
      .map(c => ({ ...c, user_id: user.id }))

    if (toCreate.length > 0) {
      const { error: catError } = await supabase.from('categories').insert(toCreate)
      if (catError) throw catError
    }
  }
}
