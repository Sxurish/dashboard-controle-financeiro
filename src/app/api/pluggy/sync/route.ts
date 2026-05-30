import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getItem, getTransactions, isPluggyConfigured } from '@/services/pluggy'
import { format, subDays } from 'date-fns'

export async function POST(req: Request) {
  if (!isPluggyConfigured()) {
    return NextResponse.json({ error: 'Open Finance não configurado' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { connectionId } = await req.json()
  if (!connectionId) return NextResponse.json({ error: 'connectionId obrigatório' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // Verify ownership
  const { data: conn } = await admin
    .from('pluggy_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('user_id', user.id)
    .single()

  if (!conn) return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })

  try {
    // Refresh item status from Pluggy
    const item = await getItem(conn.pluggy_item_id)
    if (item.status === 'LOGIN_ERROR' || item.status === 'ERROR') {
      await admin
        .from('pluggy_connections')
        .update({ status: 'error', error_message: item.error?.message ?? 'Credenciais inválidas', updated_at: new Date().toISOString() })
        .eq('id', connectionId)
      return NextResponse.json({ error: 'Conexão com erro. Reconecte o banco.' }, { status: 409 })
    }

    // Pull last 30 days of transactions
    const from = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const to = format(new Date(), 'yyyy-MM-dd')

    const { data: pluggyAccounts } = await admin
      .from('pluggy_accounts')
      .select('pluggy_account_id, kaivo_account_id, balance')
      .eq('connection_id', connectionId)

    let imported = 0
    for (const pa of (pluggyAccounts ?? []) as Array<{ pluggy_account_id: string; kaivo_account_id: string | null; balance: number | null }>) {
      if (!pa.kaivo_account_id) continue

      const txs = await getTransactions(pa.pluggy_account_id, from, to)

      for (const tx of txs) {
        const { error } = await admin
          .from('transactions')
          .upsert(
            {
              user_id: user.id,
              account_id: pa.kaivo_account_id,
              description: tx.description || tx.descriptionRaw || 'Transação importada',
              amount: Math.abs(tx.amount),
              type: tx.type === 'CREDIT' ? 'income' : 'expense',
              date: tx.date.slice(0, 10),
              status: tx.status === 'PENDING' ? 'pending' : 'paid',
              external_id: tx.id,
              notes: 'Importado via Open Finance (Pluggy)',
              is_deleted: false,
            },
            { onConflict: 'user_id,external_id', ignoreDuplicates: true }
          )
        if (!error) imported++
      }

      // Refresh Kaivo account balance
      if (pa.kaivo_account_id) {
        await admin
          .from('accounts')
          .update({ balance: pa.balance ?? 0, updated_at: new Date().toISOString() })
          .eq('id', pa.kaivo_account_id)
      }
    }

    await admin
      .from('pluggy_connections')
      .update({ last_synced_at: new Date().toISOString(), status: 'connected', error_message: null, updated_at: new Date().toISOString() })
      .eq('id', connectionId)

    return NextResponse.json({ imported })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro na sincronização'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
