import { createClient } from '@/lib/supabase/client'
import type { PlanId } from '@/lib/stripe/config'

export interface Subscription {
  status: string
  plan: PlanId
  current_period_end: string | null
  cancel_at_period_end: boolean
}

/**
 * Returns the current user's subscription. Falls back to a free plan when
 * no row exists yet or the table is unavailable.
 */
export async function getSubscription(): Promise<Subscription> {
  const free: Subscription = {
    status: 'free',
    plan: 'free',
    current_period_end: null,
    cancel_at_period_end: false,
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return free

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('subscriptions')
    .select('status, plan, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return free
  return data as Subscription
}

export function isPro(sub: Subscription): boolean {
  return sub.plan === 'pro' && ['active', 'trialing'].includes(sub.status)
}
