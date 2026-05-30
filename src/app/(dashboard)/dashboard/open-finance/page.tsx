"use client"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Landmark, RefreshCw, Trash2, AlertTriangle, CheckCircle2,
  Clock, WifiOff, CreditCard, Building2, Crown, ExternalLink,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PluggyConnectButton } from "@/components/open-finance/pluggy-widget"
import { useSubscription } from "@/hooks/use-subscription"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/currency"
import Link from "next/link"

interface PluggyAccountRow {
  id: string
  name: string
  type: string
  balance: number | null
  number: string | null
  kaivo_account_id: string | null
}

interface Connection {
  id: string
  institution_name: string
  institution_primary_color: string | null
  status: 'connected' | 'updating' | 'error' | 'outdated'
  last_synced_at: string | null
  error_message: string | null
  created_at: string
  pluggy_accounts: PluggyAccountRow[]
}

const statusConfig: Record<Connection["status"], { label: string; icon: typeof CheckCircle2; className: string }> = {
  connected: { label: "Conectado", icon: CheckCircle2, className: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  updating: { label: "Atualizando", icon: RefreshCw, className: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
  error: { label: "Erro", icon: AlertTriangle, className: "text-red-600 bg-red-100 dark:bg-red-900/30" },
  outdated: { label: "Desatualizado", icon: Clock, className: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
}

const accountTypeIcons: Record<string, typeof CreditCard> = {
  CREDIT: CreditCard,
  BANK: Building2,
  INVESTMENT: Building2,
  PAYMENT: Building2,
}

export default function OpenFinancePage() {
  const { pro, loading: subLoading } = useSubscription()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [configured, setConfigured] = useState(true)

  const loadConnections = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/pluggy/connections")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setConnections(data.connections ?? [])
    } catch {
      toast.error("Erro ao carregar conexões")
    } finally {
      setLoading(false)
    }
  }, [])

  // Check if Pluggy is configured
  useEffect(() => {
    fetch("/api/pluggy/connect-token", { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } })
      .then(r => setConfigured(r.status !== 503))
      .catch(() => setConfigured(false))
  }, [])

  useEffect(() => { loadConnections() }, [loadConnections])

  const sync = async (connectionId: string) => {
    setSyncing(connectionId)
    try {
      const res = await fetch("/api/pluggy/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.imported ?? 0} transações importadas`)
      await loadConnections()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na sincronização")
    } finally {
      setSyncing(null)
    }
  }

  const disconnect = async (connectionId: string) => {
    try {
      const res = await fetch(`/api/pluggy/connections/${connectionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Banco desconectado")
      setConnections(prev => prev.filter(c => c.id !== connectionId))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao desconectar")
    } finally {
      setDeleteTarget(null)
    }
  }

  if (subLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Open Finance"
        description="Conecte suas contas bancárias e sincronize transações automaticamente"
      >
        {pro && configured && (
          <PluggyConnectButton onSuccess={() => loadConnections()} />
        )}
      </PageHeader>

      {/* Pro gate */}
      {!pro && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-500 flex-shrink-0">
              <Crown className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Recurso exclusivo do plano Pro</p>
              <p className="text-sm text-muted-foreground mt-1">
                Conecte seus bancos via Open Finance e sincronize transações automaticamente com o plano Pro.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/dashboard/billing">Assinar Pro</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pluggy not configured notice */}
      {pro && !configured && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-500 flex-shrink-0">
              <WifiOff className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Open Finance não configurado</p>
              <p className="text-sm text-muted-foreground mt-1 space-y-1">
                Configure as variáveis de ambiente para habilitar a sincronização bancária:
              </p>
              <div className="mt-3 rounded-lg bg-muted px-4 py-3 font-mono text-xs space-y-1">
                <p>PLUGGY_CLIENT_ID=seu_client_id</p>
                <p>PLUGGY_CLIENT_SECRET=seu_client_secret</p>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-3 gap-1.5">
                <a href="https://pluggy.ai" target="_blank" rel="noopener noreferrer">
                  Criar conta na Pluggy <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connections */}
      {pro && (
        loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : connections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.15), rgba(123,47,190,0.15))' }}
              >
                <Landmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">Nenhum banco conectado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {configured
                    ? "Clique em \"Conectar banco\" para sincronizar suas contas."
                    : "Configure as credenciais Pluggy para começar."}
                </p>
              </div>
              {configured && (
                <PluggyConnectButton onSuccess={() => loadConnections()} />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {connections.map(conn => {
              const s = statusConfig[conn.status]
              const StatusIcon = s.icon
              return (
                <Card key={conn.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: conn.institution_primary_color ? `${conn.institution_primary_color}22` : 'hsl(var(--muted))' }}
                        >
                          <Building2
                            className="h-5 w-5"
                            style={{ color: conn.institution_primary_color ?? 'hsl(var(--muted-foreground))' }}
                          />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{conn.institution_name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {conn.last_synced_at
                              ? `Sincronizado ${format(parseISO(conn.last_synced_at), "dd MMM, HH:mm", { locale: ptBR })}`
                              : "Nunca sincronizado"}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn("shrink-0 gap-1 text-xs font-medium border-0", s.className)}>
                        <StatusIcon className={cn("h-3 w-3", conn.status === 'updating' && "animate-spin")} />
                        {s.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3">
                    {conn.error_message && (
                      <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
                        {conn.error_message}
                      </p>
                    )}

                    {/* Linked accounts */}
                    <div className="space-y-1.5">
                      {(conn.pluggy_accounts ?? []).map(pa => {
                        const AccIcon = accountTypeIcons[pa.type] ?? Building2
                        return (
                          <div key={pa.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <AccIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="truncate font-medium">{pa.name}</span>
                              {pa.number && <span className="text-muted-foreground text-xs flex-shrink-0">••{pa.number.slice(-4)}</span>}
                            </div>
                            {pa.balance != null && (
                              <span className={cn("font-semibold tabular-nums ml-2 flex-shrink-0 text-xs", pa.balance >= 0 ? "text-green-600" : "text-destructive")}>
                                {formatCurrency(pa.balance)}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 flex-1"
                        disabled={syncing === conn.id || conn.status === 'error'}
                        onClick={() => sync(conn.id)}
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", syncing === conn.id && "animate-spin")} />
                        {syncing === conn.id ? "Sincronizando…" : "Sincronizar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 px-3"
                        onClick={() => setDeleteTarget(conn.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      )}

      {/* How it works */}
      {pro && configured && connections.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <p className="text-sm font-semibold mb-4">Como funciona</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { n: "1", title: "Conecte seu banco", desc: "Autentique com suas credenciais bancárias de forma segura via Pluggy" },
                { n: "2", title: "Sincronização automática", desc: "Suas transações são importadas e categorizadas automaticamente" },
                { n: "3", title: "Visão unificada", desc: "Veja todos os seus gastos e receitas em um único lugar" },
              ].map(step => (
                <div key={step.n} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #FF6B00, #7B2FBE)' }}>
                    {step.n}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar banco?</AlertDialogTitle>
            <AlertDialogDescription>
              A conexão será removida e as transações já importadas permanecerão. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && disconnect(deleteTarget)}
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
