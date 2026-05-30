/**
 * Pluggy Open Finance API client — server-side only.
 * Never import this in client components.
 */

const BASE = 'https://api.pluggy.ai'

export interface PluggyItem {
  id: string
  status: 'UPDATING' | 'UPDATED' | 'LOGIN_ERROR' | 'OUTDATED' | 'ERROR'
  connector: {
    name: string
    primaryColor: string | null
  }
  updatedAt: string | null
  error?: { code: string; message: string }
}

export interface PluggyAccount {
  id: string
  name: string
  type: 'BANK' | 'CREDIT' | 'INVESTMENT' | 'PAYMENT'
  subtype: string
  number: string
  balance: number
  currencyCode: string
  itemId: string
}

export interface PluggyTransaction {
  id: string
  accountId: string
  description: string
  descriptionRaw: string | null
  amount: number
  date: string
  type: 'CREDIT' | 'DEBIT'
  status: 'POSTED' | 'PENDING'
  category: string | null
}

let _cachedKey: string | null = null
let _cachedKeyExpiry = 0

async function getApiKey(): Promise<string> {
  if (_cachedKey && Date.now() < _cachedKeyExpiry) return _cachedKey

  const clientId = process.env.PLUGGY_CLIENT_ID
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET não configurados')

  const res = await fetch(`${BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  })
  if (!res.ok) throw new Error(`Pluggy auth falhou: ${res.status}`)
  const data: { apiKey: string } = await res.json()
  _cachedKey = data.apiKey
  _cachedKeyExpiry = Date.now() + 90 * 60 * 1000 // 90 min cache
  return _cachedKey
}

async function pFetch(path: string, init?: RequestInit): Promise<Response> {
  const apiKey = await getApiKey()
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
      ...(init?.headers ?? {}),
    },
  })
}

export async function createConnectToken(itemId?: string): Promise<string> {
  const res = await pFetch('/connect_token', {
    method: 'POST',
    body: JSON.stringify(itemId ? { itemId } : {}),
  })
  if (!res.ok) throw new Error(`connect_token falhou: ${res.status}`)
  const data: { accessToken: string } = await res.json()
  return data.accessToken
}

export async function getItem(itemId: string): Promise<PluggyItem> {
  const res = await pFetch(`/items/${itemId}`)
  if (!res.ok) throw new Error(`getItem falhou: ${res.status}`)
  return res.json()
}

export async function getAccounts(itemId: string): Promise<PluggyAccount[]> {
  const res = await pFetch(`/accounts?itemId=${itemId}`)
  if (!res.ok) throw new Error(`getAccounts falhou: ${res.status}`)
  const data: { results: PluggyAccount[] } = await res.json()
  return data.results ?? []
}

export async function getTransactions(
  accountId: string,
  from: string,
  to: string
): Promise<PluggyTransaction[]> {
  const all: PluggyTransaction[] = []
  let page = 1

  for (;;) {
    const res = await pFetch(
      `/transactions?accountId=${accountId}&from=${from}&to=${to}&pageSize=500&page=${page}`
    )
    if (!res.ok) break
    const data: { results: PluggyTransaction[]; total: number } = await res.json()
    all.push(...(data.results ?? []))
    if ((data.results ?? []).length < 500) break
    page++
  }

  return all
}

export async function deleteItem(itemId: string): Promise<void> {
  await pFetch(`/items/${itemId}`, { method: 'DELETE' })
}

export function isPluggyConfigured(): boolean {
  return !!(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET)
}
