'use client'
import { useState, useEffect, useCallback } from 'react'
import { getTransactions, getMonthlyKPIs, getChartData, getCategoryChartData, getRecentTransactions } from '@/services/transactions'
import type { TransactionWithRelations, TransactionFilters, PaginatedResult, DashboardKPIs, ChartDataPoint, CategoryChartData } from '@/types/app'

export function useTransactions(filters: TransactionFilters = {}) {
  const [data, setData] = useState<PaginatedResult<TransactionWithRelations>>({
    data: [], count: 0, page: 1, per_page: 20, total_pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getTransactions(filters)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar lançamentos')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => { load() }, [load])

  return { ...data, loading, error, reload: load }
}

export function useDashboardKPIs(year: number, month: number) {
  const [kpis, setKpis] = useState<Omit<DashboardKPIs, 'currentBalance' | 'incomeChange' | 'expenseChange' | 'resultChange'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMonthlyKPIs(year, month)
      .then(setKpis)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [year, month])

  return { kpis, loading, error }
}

export function useChartData(year: number) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChartData(year)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year])

  return { data, loading }
}

export function useCategoryChart(year: number, month: number) {
  const [data, setData] = useState<CategoryChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategoryChartData(year, month)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year, month])

  return { data, loading }
}

export function useRecentTransactions(limit = 8) {
  const [data, setData] = useState<TransactionWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecentTransactions(limit)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [limit])

  return { data, loading }
}
