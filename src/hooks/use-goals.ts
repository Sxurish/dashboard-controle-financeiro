'use client'
import { useState, useEffect, useCallback } from 'react'
import { getGoals } from '@/services/goals'
import type { Goal } from '@/types/app'

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setGoals(await getGoals())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar metas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { goals, loading, error, reload: load }
}
