"use client"
import { useState } from "react"
import { Plus, Target, Pencil, Trash2, Trophy, Calendar, PlusCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useGoals } from "@/hooks/use-goals"
import { createGoal, updateGoal, deleteGoal, addToGoal } from "@/services/goals"
import { goalSchema, type GoalFormValues } from "@/schemas/goal.schema"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatCurrency } from "@/utils/currency"
import { formatDate } from "@/utils/date"
import type { Goal } from "@/types/app"
import { cn } from "@/lib/utils"

const GOAL_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#64748b",
]

const GOAL_ICONS = ["target", "home", "car", "plane", "heart", "briefcase", "book", "star", "shield", "gift"]

export default function GoalsPage() {
  const { goals, loading, reload } = useGoals()
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [addingToGoalId, setAddingToGoalId] = useState<string | null>(null)
  const [addAmount, setAddAmount] = useState("")
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { color: GOAL_COLORS[0], icon: GOAL_ICONS[0], current_amount: 0 },
  })

  const selectedColor = watch("color")

  function openEdit(goal: Goal) {
    setEditingGoal(goal)
    reset({
      name: goal.name,
      description: goal.description || "",
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline || "",
      color: goal.color || GOAL_COLORS[0],
      icon: goal.icon || GOAL_ICONS[0],
    })
    setShowForm(true)
  }

  function openNew() {
    setEditingGoal(null)
    reset({ color: GOAL_COLORS[0], icon: GOAL_ICONS[0], current_amount: 0 })
    setShowForm(true)
  }

  async function onSubmit(values: GoalFormValues) {
    setSaving(true)
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, values)
        toast.success("Meta atualizada!")
      } else {
        await createGoal(values)
        toast.success("Meta criada!")
      }
      setShowForm(false)
      reload()
    } catch (e) {
      const description =
        e instanceof Error ? e.message
        : e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : JSON.stringify(e)
      toast.error("Erro ao salvar meta", { description })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteGoal(deletingId)
      toast.success("Meta excluída")
      reload()
    } catch {
      toast.error("Erro ao excluir")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleAddToGoal() {
    if (!addingToGoalId || !addAmount) return
    const amount = parseFloat(addAmount.replace(",", "."))
    if (isNaN(amount) || amount <= 0) { toast.error("Valor inválido"); return }
    try {
      await addToGoal(addingToGoalId, amount)
      toast.success(`${formatCurrency(amount)} adicionado à meta!`)
      setAddingToGoalId(null)
      setAddAmount("")
      reload()
    } catch {
      toast.error("Erro ao atualizar meta")
    }
  }

  const activeGoals = goals.filter(g => !g.is_completed)
  const completedGoals = goals.filter(g => g.is_completed)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Metas Financeiras" description="Acompanhe seus objetivos financeiros">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nova meta
        </Button>
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="Nenhuma meta ainda" description="Crie metas financeiras para acompanhar seu progresso rumo aos seus objetivos.">
          <Button onClick={openNew}><Plus className="h-4 w-4" />Criar primeira meta</Button>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {activeGoals.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Em andamento ({activeGoals.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeGoals.map(goal => {
                  const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                  const remaining = goal.target_amount - goal.current_amount
                  return (
                    <Card key={goal.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${goal.color || "#3b82f6"}20` }}
                            >
                              <Target className="h-5 w-5" style={{ color: goal.color || "#3b82f6" }} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{goal.name}</p>
                              {goal.deadline && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(goal.deadline)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(goal)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingId(goal.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium" style={{ color: goal.color || "#3b82f6" }}>
                              {formatCurrency(goal.current_amount)}
                            </span>
                            <span className="text-muted-foreground">{formatCurrency(goal.target_amount)}</span>
                          </div>
                          <Progress value={pct} className="h-2" style={{ ["--progress-color" as string]: goal.color || "#3b82f6" }} />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              Falta {formatCurrency(remaining)}
                            </span>
                            <span className="text-xs font-semibold">{pct.toFixed(0)}%</span>
                          </div>
                        </div>

                        {goal.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{goal.description}</p>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={() => { setAddingToGoalId(goal.id); setAddAmount("") }}
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Adicionar valor
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

          {completedGoals.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Concluídas ({completedGoals.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {completedGoals.map(goal => (
                  <Card key={goal.id} className="opacity-75 border-green-200 dark:border-green-800">
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="font-semibold text-sm">{goal.name}</p>
                        </div>
                        <Badge variant="success">Concluída</Badge>
                      </div>
                      <Progress value={100} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        {formatCurrency(goal.target_amount)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Goal Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Editar meta" : "Nova meta"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome da meta</Label>
              <Input placeholder="Ex: Reserva de emergência" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor alvo (R$)</Label>
                <Input type="number" step="0.01" min="0.01" {...register("target_amount", { valueAsNumber: true })} />
                {errors.target_amount && <p className="text-xs text-destructive">{errors.target_amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Valor atual (R$)</Label>
                <Input type="number" step="0.01" min="0" placeholder="0,00" {...register("current_amount", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Prazo (opcional)</Label>
              <Input type="date" {...register("deadline")} />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {GOAL_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue("color", color)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all",
                      selectedColor === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição (opcional)</Label>
              <Textarea placeholder="Descreva sua meta..." rows={2} className="resize-none" {...register("description")} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : editingGoal ? "Atualizar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add to goal dialog */}
      <Dialog open={!!addingToGoalId} onOpenChange={(v) => !v && setAddingToGoalId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Adicionar à meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddingToGoalId(null)}>Cancelar</Button>
              <Button onClick={handleAddToGoal}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
