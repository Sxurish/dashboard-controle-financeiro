"use client"
import { useState, useEffect } from "react"
import { Plus, RefreshCcw, Pencil, Trash2, Zap, Calendar } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { getRecurringRules, createRecurringRule, updateRecurringRule, deleteRecurringRule, generateRecurringTransactions } from "@/services/recurring"
import { recurringRuleSchema, type RecurringRuleFormValues } from "@/schemas/recurring.schema"
import { useAccounts } from "@/hooks/use-accounts"
import { useCategories } from "@/hooks/use-categories"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency } from "@/utils/currency"
import { formatDate } from "@/utils/date"
import type { RecurringRule } from "@/types/app"

const frequencyLabels: Record<string, string> = {
  daily: "Diário", weekly: "Semanal", monthly: "Mensal", yearly: "Anual", custom: "Personalizado"
}

export default function RecurringPage() {
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTransactions, setDeleteTransactions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)

  const { accounts } = useAccounts()
  const { categories } = useCategories()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<RecurringRuleFormValues>({
    resolver: zodResolver(recurringRuleSchema),
    defaultValues: { type: "expense", frequency: "monthly", interval: 1, auto_generate: true },
  })

  const autoGenerate = watch("auto_generate")

  async function loadRules() {
    setLoading(true)
    try { setRules(await getRecurringRules()) }
    catch { toast.error("Erro ao carregar recorrências") }
    finally { setLoading(false) }
  }

  useEffect(() => { loadRules() }, [])

  function openEdit(rule: RecurringRule) {
    setEditingRule(rule)
    reset({
      description: rule.description,
      amount: rule.amount,
      type: rule.type,
      category_id: rule.category_id || undefined,
      account_id: rule.account_id,
      frequency: rule.frequency,
      interval: rule.interval,
      start_date: rule.start_date,
      end_date: rule.end_date || undefined,
      day_of_month: rule.day_of_month || undefined,
      auto_generate: rule.auto_generate,
    })
    setShowForm(true)
  }

  function openNew() {
    setEditingRule(null)
    reset({ type: "expense", frequency: "monthly", interval: 1, auto_generate: true, start_date: new Date().toISOString().split("T")[0] })
    setShowForm(true)
  }

  async function onSubmit(values: RecurringRuleFormValues) {
    setSaving(true)
    try {
      if (editingRule) {
        await updateRecurringRule(editingRule.id, values)
        toast.success("Recorrência atualizada!")
      } else {
        await createRecurringRule(values)
        toast.success(values.auto_generate ? "Recorrência criada e lançamentos gerados!" : "Recorrência criada!")
      }
      setShowForm(false)
      loadRules()
    } catch {
      toast.error("Erro ao salvar recorrência")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteRecurringRule(deletingId, deleteTransactions)
      toast.success("Recorrência excluída")
      loadRules()
    } catch {
      toast.error("Erro ao excluir")
    } finally {
      setDeletingId(null)
      setDeleteTransactions(false)
    }
  }

  async function handleGenerate(rule: RecurringRule) {
    setGenerating(rule.id)
    try {
      await generateRecurringTransactions(rule, 12)
      toast.success("Lançamentos gerados para os próximos 12 meses!")
    } catch {
      toast.error("Erro ao gerar lançamentos")
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Recorrências" description="Gerencie lançamentos automáticos e periódicos">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nova recorrência
        </Button>
      </PageHeader>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-28" /></div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </CardContent></Card>
          ))}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState icon={RefreshCcw} title="Nenhuma recorrência" description="Configure receitas e despesas que se repetem automaticamente, como salário, aluguel e assinaturas.">
          <Button onClick={openNew}><Plus className="h-4 w-4" />Criar recorrência</Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <Card key={rule.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${rule.type === "income" ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                    <RefreshCcw className={`h-4 w-4 ${rule.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{rule.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {frequencyLabels[rule.frequency]}{rule.interval > 1 ? ` (a cada ${rule.interval})` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        desde {formatDate(rule.start_date)}
                      </span>
                      {rule.auto_generate && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Zap className="h-3 w-3" />
                            Auto-geração
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className={`text-sm font-semibold ${rule.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {rule.type === "expense" ? "-" : "+"}{formatCurrency(rule.amount)}
                    </p>

                    <Badge variant={rule.type === "income" ? "income" : "expense"} className="hidden sm:inline-flex">
                      {rule.type === "income" ? "Receita" : "Despesa"}
                    </Badge>

                    <div className="flex gap-1">
                      {!rule.auto_generate && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Gerar lançamentos" disabled={generating === rule.id} onClick={() => handleGenerate(rule)}>
                          <Zap className={`h-3.5 w-3.5 ${generating === rule.id ? "animate-pulse" : ""}`} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(rule)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingId(rule.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRule ? "Editar recorrência" : "Nova recorrência"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Descrição</Label>
                <Input placeholder="Ex: Salário, Aluguel..." {...register("description")} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" min="0.01" {...register("amount", { valueAsNumber: true })} />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select defaultValue={editingRule?.type || "expense"} onValueChange={v => setValue("type", v as "income" | "expense")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Frequência</Label>
                <Select defaultValue={editingRule?.frequency || "monthly"} onValueChange={v => setValue("frequency", v as RecurringRuleFormValues["frequency"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Conta</Label>
                <Select defaultValue={editingRule?.account_id || ""} onValueChange={v => setValue("account_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select defaultValue={editingRule?.category_id || ""} onValueChange={v => setValue("category_id", v || undefined)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Data início</Label>
                <Input type="date" {...register("start_date")} />
                {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Data fim (opcional)</Label>
                <Input type="date" {...register("end_date")} />
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="auto_generate"
                  checked={autoGenerate}
                  onCheckedChange={v => setValue("auto_generate", Boolean(v))}
                />
                <div>
                  <Label htmlFor="auto_generate" className="cursor-pointer">Gerar lançamentos automaticamente</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cria os lançamentos futuros automaticamente ao salvar.
                    Se desmarcado, você pode gerar manualmente quando quiser.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : editingRule ? "Atualizar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir recorrência</AlertDialogTitle>
            <AlertDialogDescription>Esta ação desativará a regra de recorrência.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 py-2">
            <div className="flex items-center gap-2">
              <Checkbox id="del-trans" checked={deleteTransactions} onCheckedChange={v => setDeleteTransactions(Boolean(v))} />
              <Label htmlFor="del-trans" className="cursor-pointer font-normal text-sm">
                Excluir também os lançamentos pendentes desta recorrência
              </Label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
