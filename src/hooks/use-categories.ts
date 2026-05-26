'use client'
import { useState, useEffect, useCallback } from 'react'
import { getCategories } from '@/services/categories'
import type { Category } from '@/types/app'

export function useCategories(type?: 'income' | 'expense') {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const all = await getCategories()
      setCategories(type ? all.filter(c => c.type === type) : all)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => { load() }, [load])

  return { categories, loading, error, reload: load }
}
