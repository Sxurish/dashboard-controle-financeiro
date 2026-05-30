'use client'
import { useState, useEffect, useCallback } from 'react'
import { getSubscription, isPro, type Subscription } from '@/services/subscription'

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setSubscription(await getSubscription())
    } catch {
      setSubscription({ status: 'free', plan: 'free', current_period_end: null, cancel_at_period_end: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return {
    subscription,
    pro: subscription ? isPro(subscription) : false,
    loading,
    reload: load,
  }
}
