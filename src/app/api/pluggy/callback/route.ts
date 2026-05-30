/**
 * Called by the frontend after the Pluggy Connect widget succeeds.
 * Stores the connection and linked accounts, then triggers an initial sync.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getItem, getAccounts, isPluggyConfigured } from '@/services/pluggy'
import { format, subDays } from 'date-fns'

export async function POST(req: Request) {
  if (!isPluggyConfigured()) {
    return NextResponse.json({ error: 'Open Finance não configurado' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { itemId } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'itemId obrigatório' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  try {
    const item = await getItem(itemId)

    const statusMap: Record<string, string> = {
      UPDATED: 'connected',
      UPDATING: 'updating',
      LOGIN_ERROR: 'error',
      OUTDATED: 'outdated',
      ERROR: 'error',
    }

    // Upsert connection record
    const { data: conn, error: connErr } = await admin
      .from('pluggy_connections')
      .upsert(
        {
          user_id: user.id,
          pluggy_item_id: itemId,
          institution_name: item.connector.name,
          institution_primary_color: item.connector.primaryColor,
          status: statusMap[item.status] ?? 'connected',
          error_message: item.error?.message ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,pluggy_item_id' }
      )
      .select()
      .single()

    if (connErr) throw connErr

    // Fetch and upsert Pluggy accounts
    const pluggyAccounts = await getAccounts(itemId)
    for (const pa of pluggyAccounts) {
      const { data: existing } = await admin
        .from('pluggy_accounts')
        .select('id, kaivo_account_id')
        .eq('pluggy_account_id', pa.id)
        .maybeSingle()

      let kaivoAccountId = existing?.kaivo_account_id

      if (!existing) {
        // Auto-create a Kaivo account for this Pluggy account
        const { data: newAcc } = await admin
          .from('accounts')
          .insert({
            user_id: user.id,
            name: `${item.connector.name} – ${pa.name}`,
            type: pa.type === 'CREDIT' ? 'credit' : 'bank',
            balance: pa.balance ?? 0,
            color: item.connector.primaryColor ?? '#6b7280',
            icon: 'building-2',
            is_active: true,
          })
          .select()
          .single()

        kaivoAccountId = newAcc?.id
      } else {
        // Update balance on existing Kaivo account
        if (kaivoAccountId) {
          await admin
            .from('accounts')
            .update({ balance: pa.balance ?? 0, updated_at: new Date().toISOString() })
            .eq('id', kaivoAccountId)
        }
      }

      await admin
        .from('pluggy_accounts')
        .upsert(
          {
            connection_id: conn.id,
            user_id: user.id,
            pluggy_account_id: pa.id,
            kaivo_account_id: kaivoAccountId,
            name: pa.name,
            type: pa.type,
            balance: pa.balance,
            currency_code: pa.currencyCode ?? 'BRL',
            number: pa.number ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'pluggy_account_id' }
        )
    }

    // Trigger initial sync (last 90 days)
    const from = format(subDays(new Date(), 90), 'yyyy-MM-dd')
    const to = format(new Date(), 'yyyy-MM-dd')
    await syncConnection(admin, user.id, conn.id, from, to)

    return NextResponse.json({ connectionId: conn.id, accounts: pluggyAccounts.length })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao conectar banco'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function syncConnection(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  connectionId: string,
  from: string,
  to: string
) {
  const { getTransactions } = await import('@/services/pluggy')

  const { data: pluggyAccounts } = await admin
    .from('pluggy_accounts')
    .select('pluggy_account_id, kaivo_account_id')
    .eq('connection_id', connectionId)
    .eq('user_id', userId)

  for (const pa of (pluggyAccounts ?? []) as Array<{ pluggy_account_id: string; kaivo_account_id: string | null }>) {
    if (!pa.kaivo_account_id) continue

    const txs = await getTransactions(pa.pluggy_account_id, from, to)

    for (const tx of txs) {
      const type = tx.type === 'CREDIT' ? 'income' : 'expense'
      await admin
        .from('transactions')
        .upsert(
          {
            user_id: userId,
            account_id: pa.kaivo_account_id,
            description: tx.description || tx.descriptionRaw || 'Transação importada',
            amount: Math.abs(tx.amount),
            type,
            date: tx.date.slice(0, 10),
            status: tx.status === 'PENDING' ? 'pending' : 'paid',
            external_id: tx.id,
            notes: 'Importado via Open Finance (Pluggy)',
            is_deleted: false,
          },
          { onConflict: 'user_id,external_id', ignoreDuplicates: true }
        )
    }
  }

  await admin
    .from('pluggy_connections')
    .update({ last_synced_at: new Date().toISOString(), status: 'connected', updated_at: new Date().toISOString() })
    .eq('id', connectionId)
}
