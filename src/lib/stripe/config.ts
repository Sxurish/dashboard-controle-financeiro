/**
 * Stripe plan configuration.
 *
 * Fill these in once your Stripe account is ready:
 *  - STRIPE_SECRET_KEY            (server, e.g. sk_live_… / sk_test_…)
 *  - STRIPE_WEBHOOK_SECRET        (server, from the webhook endpoint)
 *  - NEXT_PUBLIC_STRIPE_PRICE_PRO (the recurring Price ID, price_…)
 *  - NEXT_PUBLIC_APP_URL          (e.g. https://kaivo.com.br)
 */

export const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? ''

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export type PlanId = 'free' | 'pro'

export interface Plan {
  id: PlanId
  name: string
  price: number
  priceLabel: string
  features: string[]
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Grátis',
    price: 0,
    priceLabel: 'R$0',
    features: [
      'Lançamentos ilimitados',
      'Até 3 contas',
      'Relatórios básicos',
      'Metas financeiras',
      'Recorrências',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29.9,
    priceLabel: 'R$29,90',
    features: [
      'Tudo do plano Grátis',
      'Contas ilimitadas',
      'Importação OFX/CSV',
      'Orçamento por categoria',
      'Relatórios avançados',
      'Notificações inteligentes',
      'Suporte prioritário',
    ],
  },
}
