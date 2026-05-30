import Stripe from 'stripe'

/**
 * Server-side Stripe client. Lazily instantiated so the app still builds
 * and runs (free tier) even before STRIPE_SECRET_KEY is configured.
 */
let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY não configurada')
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    })
  }
  return stripeClient
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}
