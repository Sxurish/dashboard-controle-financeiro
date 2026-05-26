'use client'
import { useState, useEffect, useCallback } from 'react'
import { getAccounts, getTotalBalance } from '@/services/accounts'
import type { Account } from '@/types/app'

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [accs, balance] = await Promise.all([getAccounts(), getTotalBalance()])
      setAccounts(accs)
      setTotalBalance(balance)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar contas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { accounts, totalBalance, loading, error, reload: load }
}
