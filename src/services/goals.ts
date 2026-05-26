import { createClient } from '@/lib/supabase/client'
import type { Goal, CreateGoalInput } from '@/types/app'

export async function getGoals(): Promise<Goal[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('goals')
    .insert({ ...input, user_id: user.id, current_amount: input.current_amount || 0 })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateGoal(id: string, input: Partial<CreateGoalInput>): Promise<void> {
  const supabase = createClient()
  const goal = await getGoalById(id)
  const current = input.current_amount ?? goal?.current_amount ?? 0
  const target = input.target_amount ?? goal?.target_amount ?? 1

  const { error } = await supabase
    .from('goals')
    .update({
      ...input,
      is_completed: current >= target,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

export async function deleteGoal(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}

export async function getGoalById(id: string): Promise<Goal | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('goals').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function addToGoal(id: string, amount: number): Promise<void> {
  const supabase = createClient()
  const goal = await getGoalById(id)
  if (!goal) throw new Error('Meta não encontrada')

  const newAmount = Math.min(goal.current_amount + amount, goal.target_amount)
  await updateGoal(id, { current_amount: newAmount })
}
