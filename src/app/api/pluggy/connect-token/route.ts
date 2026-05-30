import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createConnectToken, isPluggyConfigured } from '@/services/pluggy'

export async function POST(req: Request) {
  if (!isPluggyConfigured()) {
    return NextResponse.json({ error: 'Open Finance não configurado', configured: false }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const token = await createConnectToken(body.itemId)
    return NextResponse.json({ token })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao gerar token'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
