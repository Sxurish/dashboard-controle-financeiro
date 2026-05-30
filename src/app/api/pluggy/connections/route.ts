import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('pluggy_connections' as never)
    .select(`
      id, institution_name, institution_primary_color, status,
      last_synced_at, error_message, created_at,
      pluggy_accounts:pluggy_accounts(id, name, type, balance, number, kaivo_account_id)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ connections: data ?? [] })
}
