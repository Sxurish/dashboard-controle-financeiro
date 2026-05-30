'use client'
import { useState, useEffect, useCallback } from 'react'
import { getNotifications, type AppNotification } from '@/services/notifications'

const READ_KEY = 'kaivo:read-notifications'

function loadReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(READ_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function persistReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getNotifications()
      setNotifications(data)
      // Prune read IDs that no longer exist to keep storage tidy
      setReadIds(prev => {
        const valid = new Set([...prev].filter(id => data.some(n => n.id === id)))
        persistReadIds(valid)
        return valid
      })
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setReadIds(loadReadIds())
    load()
  }, [load])

  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev).add(id)
      persistReadIds(next)
      return next
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setReadIds(() => {
      const next = new Set(notifications.map(n => n.id))
      persistReadIds(next)
      return next
    })
  }, [notifications])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  return { notifications, readIds, unreadCount, loading, reload: load, markAsRead, markAllAsRead }
}
