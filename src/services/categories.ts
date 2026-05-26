import { createClient } from '@/lib/supabase/client'
import type { Category, CreateCategoryInput } from '@/types/app'

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user?.id}`)
    .order('name')

  if (error) throw error
  return data || []
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(id: string, input: Partial<CreateCategoryInput>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('categories')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
