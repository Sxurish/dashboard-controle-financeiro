import { NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PRO_PRICE_ID, APP_URL } from '@/lib/stripe/config'

export async function POST() {
  if (!isStripeConfigured() || !PRO_PRICE_ID) {
    return NextResponse.json(
      { error: 'Pagamentos ainda não estão configurados.' },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const stripe = getStripe()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  try {
    // Reuse an existing Stripe customer if we have one
    const { data: existing } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId: string | undefined = existing?.stripe_customer_id ?? undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await admin.from('subscriptions').upsert(
        { user_id: user.id, stripe_customer_id: customerId, status: 'free', plan: 'free' },
        { onConflict: 'user_id' }
      )
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}/dashboard/billing?checkout=success`,
      cancel_url: `${APP_URL}/dashboard/billing?checkout=cancel`,
      allow_promotion_codes: true,
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao criar checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
