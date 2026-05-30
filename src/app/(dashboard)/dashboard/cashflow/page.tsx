"use client"
import { useState, useEffect, useCallback } from "react"
import {
  Wallet, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, ArrowDownRight, CalendarClock,
} from "lucide-react"
import { toast } from "sonner"
import { getCashFlowProjection, type CashFlowProjection, type CashFlowEvent } from "@/services/cashflow"
import { CashFlowChart } from "@/components/dashboard/cashflow-chart"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/utils/currency"
import { formatDate } from "@/utils/date"
import { cn } from "@/lib/utils"

const HORIZONS = [
  { days: 30, label: "30 dias" },
  { days: 60, label: "60 dias" },
  { days: 90, label: "90 dias" },
]

const kindLabels: Record<CashFlowEvent["kind"], string> = {
  recurring: "Recorrência",
  pending: "Agendado",
  invoice: "Fatura",
}

export default function CashFlowPage() {
  const [days, setDays] = useState(90)
  const [projection, setProjection] = useState<CashFlowProjection | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProjection(await getCashFlowProjection(days))
    } catch {
      toast.error("Erro ao calcular projeção")
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  // Flatten upcoming events for the list (skip the "today" carry-over bucket).
  const upcomingEvents = projection
    ? projection.points
        .flatMap(p => p.events.map(e => ({ ...e, day: p.date })))
        .sort((a, b) => (a.day < b.day ? -1 : 1))
        .slice(0, 30)
    : []

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Fluxo de caixa" description="Projeção do seu saldo combinando recorrências, agendamentos e faturas">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {HORIZONS.map(h => (
            <button
              key={h.days}
              onClick={() => setDays(h.days)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                days === h.days ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {h.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-80" />
        </div>
      ) : projection ? (
        <>
          {/* Negative balance alert */}
          {projection.negativeAhead && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-destructive">Atenção: saldo negativo previsto</p>
                <p className="text-sm text-muted-foreground">
                  Seu saldo pode chegar a {formatCurrency(projection.lowestBalance)} em {formatDate(projection.lowestDate)}.
                  Considere antecipar receitas ou adiar despesas.
                </p>
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Saldo hoje</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(projection.startBalance)}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500 flex-shrink-0">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Saldo em {days} dias</p>
                    <p className={cn("text-2xl font-bold mt-1", projection.endBalance < 0 && "text-destructive")}>
                      {formatCurrency(projection.endBalance)}
                    </p>
                  </div>
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                    projection.endBalance >= projection.startBalance ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {projection.endBalance >= projection.startBalance ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Entradas previstas</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(projection.totalInflow)}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-green-500/10 text-green-500 flex-shrink-0">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Saídas previstas</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(projection.totalOutflow)}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500 flex-shrink-0">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Projeção de saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <CashFlowChart points={projection.points} />
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Próximos eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum evento previsto. Cadastre recorrências ou agende lançamentos.
                </p>
              ) : (
                <div className="divide-y">
                  {upcomingEvents.map((e, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                          e.amount >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {e.amount >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{e.description}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{formatDate(e.day)}</p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{kindLabels[e.kind]}</Badge>
                          </div>
                        </div>
                      </div>
                      <span className={cn("font-medium tabular-nums ml-2", e.amount >= 0 ? "text-green-600" : "text-red-600")}>
                        {e.amount >= 0 ? "+" : ""}{formatCurrency(e.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
