import { NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { APP_URL } from '@/lib/stripe/config'

/**
 * Opens the Stripe Customer Portal so a Pro user can manage or cancel
 * their subscription and update payment methods.
 */
export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Pagamentos não configurados.' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const { data } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!data?.stripe_customer_id) {
      return NextResponse.json({ error: 'Nenhuma assinatura encontrada' }, { status: 404 })
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${APP_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao abrir portal'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
