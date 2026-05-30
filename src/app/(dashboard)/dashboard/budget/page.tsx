"use client"
import { useState, useEffect, useCallback } from "react"
import { addMonths, subMonths, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ChevronLeft, ChevronRight, Pencil, Trash2, Check, X,
  PiggyBank, TrendingUp, AlertTriangle, CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { getBudgetsWithSpending, upsertBudget, deleteBudget, type BudgetWithSpending } from "@/services/budgets"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/currency"
import { cn } from "@/lib/utils"

const STATUS_CONFIG = {
  ok:       { label: "OK",        color: "text-green-500",  bg: "bg-green-500/10", icon: CheckCircle2 },
  warning:  { label: "Atenção",   color: "text-yellow-500", bg: "bg-yellow-500/10", icon: AlertTriangle },
  exceeded: { label: "Excedido",  color: "text-red-500",    bg: "bg-red-500/10",  icon: AlertTriangle },
  unset:    { label: "Sem limite",color: "text-muted-foreground", bg: "bg-muted", icon: TrendingUp },
}

export default function BudgetPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState(false)

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setBudgets(await getBudgetsWithSpending(year, month))
    } catch {
      toast.error("Erro ao carregar orçamentos")
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])

  function startEdit(b: BudgetWithSpending) {
    setEditingId(b.category_id)
    setEditValue(b.budget_amount !== null ? String(b.budget_amount) : "")
  }

  async function confirmEdit(b: BudgetWithSpending) {
    const amount = parseFloat(editValue.replace(",", "."))
    if (isNaN(amount) || amount <= 0) { toast.error("Valor inválido"); return }
    setSaving(true)
    try {
      await upsertBudget({ category_id: b.category_id, amount, month, year })
      toast.success("Orçamento salvo!")
      setEditingId(null)
      load()
    } catch {
      toast.error("Erro ao salvar orçamento")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(b: BudgetWithSpending) {
    if (!b.budget_id) return
    try {
      await deleteBudget(b.budget_id)
      toast.success("Orçamento removido")
      load()
    } catch {
      toast.error("Erro ao remover orçamento")
    }
  }

  const withBudget = budgets.filter(b => b.budget_amount !== null)
  const totalBudget = withBudget.reduce((s, b) => s + (b.budget_amount ?? 0), 0)
  const totalSpent = withBudget.reduce((s, b) => s + b.spent_amount, 0)
  const totalPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const overBudget = withBudget.filter(b => b.status === "exceeded").length
  const atRisk = withBudget.filter(b => b.status === "warning").length

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Orçamento" description="Defina limites de gastos por categoria">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(d => subMonths(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-32 text-center capitalize">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(d => addMonths(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total orçado</p>
              <p className="text-xl font-bold">{formatCurrency(totalBudget)}</p>
              <p className="text-xs text-muted-foreground mt-1">{withBudget.length} categorias</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total gasto</p>
              <p className={cn("text-xl font-bold", totalSpent > totalBudget && totalBudget > 0 ? "text-red-500" : "")}>
                {formatCurrency(totalSpent)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{totalPct.toFixed(0)}% do orçado</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Disponível</p>
              <p className={cn("text-xl font-bold", totalBudget - totalSpent < 0 ? "text-red-500" : "text-green-500")}>
                {formatCurrency(Math.max(totalBudget - totalSpent, 0))}
              </p>
              <Progress value={totalPct} className="h-1 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Alertas</p>
              <p className="text-xl font-bold">{overBudget + atRisk}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {overBudget} excedido · {atRisk} em atenção
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category budgets */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PiggyBank className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Nenhuma categoria de despesa</p>
              <p className="text-sm text-muted-foreground">Crie categorias do tipo "Despesa" para definir orçamentos.</p>
            </div>
          ) : (
            <div className="divide-y">
              {budgets.map(b => {
                const isEditing = editingId === b.category_id
                const cfg = STATUS_CONFIG[b.status]
                const StatusIcon = cfg.icon

                return (
                  <div key={b.category_id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    {/* Color dot */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: b.category_color }}
                    />

                    {/* Category + progress */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{b.category_name}</span>
                        {b.status !== 'unset' && (
                          <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 gap-0.5", cfg.color, cfg.bg)}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {cfg.label}
                          </Badge>
                        )}
                      </div>
                      {b.budget_amount !== null && (
                        <div className="space-y-1">
                          <Progress
                            value={Math.min(b.percentage, 100)}
                            className="h-1.5"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Gasto: {formatCurrency(b.spent_amount)}</span>
                            <span>{b.percentage.toFixed(0)}% de {formatCurrency(b.budget_amount)}</span>
                          </div>
                        </div>
                      )}
                      {b.budget_amount === null && b.spent_amount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Gasto sem limite: {formatCurrency(b.spent_amount)}
                        </p>
                      )}
                    </div>

                    {/* Edit / amount */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="h-8 w-28 text-sm"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === "Enter") confirmEdit(b)
                              if (e.key === "Escape") setEditingId(null)
                            }}
                          />
                          <Button size="icon" className="h-7 w-7" disabled={saving} onClick={() => confirmEdit(b)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {b.budget_amount !== null ? (
                            <span className={cn(
                              "text-sm font-semibold",
                              b.status === "exceeded" ? "text-red-500" : b.status === "warning" ? "text-yellow-500" : ""
                            )}>
                              {formatCurrency(b.budget_amount)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">sem limite</span>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(b)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {b.budget_id && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(b)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Clique no ícone de edição para definir ou alterar o limite de cada categoria.
      </p>
    </div>
  )
}
