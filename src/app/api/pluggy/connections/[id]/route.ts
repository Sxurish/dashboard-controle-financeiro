import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteItem, isPluggyConfigured } from '@/services/pluggy'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data: conn } = await admin
    .from('pluggy_connections')
    .select('pluggy_item_id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!conn) return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })

  try {
    if (isPluggyConfigured()) {
      await deleteItem(conn.pluggy_item_id).catch(() => null) // best-effort
    }
    await admin.from('pluggy_connections').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao desconectar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
