import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, isStripeConfigured } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Stripe webhook. Keeps the subscriptions table in sync with Stripe.
 * Must receive the raw request body to verify the signature, so we read
 * request.text() and never parse it as JSON beforehand.
 */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 503 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret ausente' }, { status: 503 })
  }

  const stripe = getStripe()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Assinatura ausente' }, { status: 400 })
  }

  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'invalid'
    return NextResponse.json({ error: `Assinatura inválida: ${message}` }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  async function syncSubscription(sub: Stripe.Subscription) {
    const userId = sub.metadata?.supabase_user_id
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    const isActive = ['active', 'trialing'].includes(sub.status)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodEnd = (sub as any).current_period_end as number | undefined

    const row = {
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      status: sub.status,
      plan: isActive ? 'pro' : 'free',
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    }

    if (userId) {
      await admin.from('subscriptions').upsert({ user_id: userId, ...row }, { onConflict: 'user_id' })
    } else {
      await admin.from('subscriptions').update(row).eq('stripe_customer_id', customerId)
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const sub = await stripe.subscriptions.retrieve(subId)
          if (session.metadata?.supabase_user_id && !sub.metadata?.supabase_user_id) {
            sub.metadata = { ...sub.metadata, supabase_user_id: session.metadata.supabase_user_id }
          }
          await syncSubscription(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
      }
      default:
        break
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
