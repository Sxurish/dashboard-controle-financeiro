"use client"
import { useState, useCallback } from "react"
import { Plus, Download, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTransactions } from "@/hooks/use-transactions"
import { useCategories } from "@/hooks/use-categories"
import { useAccounts } from "@/hooks/use-accounts"
import { deleteTransaction, exportTransactionsCSV } from "@/services/transactions"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { TransactionFiltersBar } from "@/components/transactions/transaction-filters"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatCurrency } from "@/utils/currency"
import { formatDate } from "@/utils/date"
import type { TransactionFilters, TransactionWithRelations } from "@/types/app"
import { cn } from "@/lib/utils"

const now = new Date()

const defaultFilters: TransactionFilters = {
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  type: "all",
  status: "all",
  sort_by: "date",
  sort_order: "desc",
  page: 1,
  per_page: 20,
}

const statusLabels: Record<string, string> = { paid: "Pago", pending: "Pendente", overdue: "Atrasado" }
const statusVariants: Record<string, "success" | "pending" | "overdue"> = {
  paid: "success", pending: "pending", overdue: "overdue",
}

// AlertDialog for delete confirmation
function AlertDialogComponent({ open, onOpenChange, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir lançamento</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [defaultFormType, setDefaultFormType] = useState<"income" | "expense" | "transfer">("expense")

  const { data, count, total_pages, page, loading, reload } = useTransactions(filters)
  const { categories } = useCategories()
  const { accounts } = useAccounts()

  const updateFilters = useCallback((partial: Partial<TransactionFilters>) => {
    setFilters(f => ({ ...f, ...partial }))
  }, [])

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteTransaction(deletingId)
      toast.success("Lançamento excluído")
      reload()
    } catch {
      toast.error("Erro ao excluir")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleExport() {
    try {
      const csv = await exportTransactionsCSV(filters)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `arthora-lancamentos-${filters.year}-${String(filters.month).padStart(2, "0")}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("CSV exportado!")
    } catch {
      toast.error("Erro ao exportar")
    }
  }

  function openNewForm(type: "income" | "expense" | "transfer" = "expense") {
    setDefaultFormType(type)
    setEditingTransaction(null)
    setShowForm(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Lançamentos" description="Gerencie suas receitas e despesas">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
        <Button size="sm" onClick={() => openNewForm()}>
          <Plus className="h-4 w-4" />
          Novo lançamento
        </Button>
      </PageHeader>

      {/* Quick action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openNewForm("income")}>
          <ArrowUpRight className="h-4 w-4 text-green-500" />
          Receita
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openNewForm("expense")}>
          <ArrowDownRight className="h-4 w-4 text-red-500" />
          Despesa
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openNewForm("transfer")}>
          <ArrowLeftRight className="h-4 w-4 text-blue-500" />
          Transferência
        </Button>
      </div>

      {/* Filters */}
      <TransactionFiltersBar
        filters={filters}
        onChange={updateFilters}
        categories={categories}
        accounts={accounts}
      />

      {/* Summary bar */}
      <div className="text-sm text-muted-foreground">
        {!loading && <span>{count} lançamento{count !== 1 ? "s" : ""} encontrado{count !== 1 ? "s" : ""}</span>}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Nenhum lançamento"
            description="Adicione receitas, despesas ou transferências para começar a controlar suas finanças."
          >
            <Button onClick={() => openNewForm()}>
              <Plus className="h-4 w-4" />
              Criar lançamento
            </Button>
          </EmptyState>
        ) : (
          <div className="divide-y">
            {/* Header row (desktop) */}
            <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_auto_auto] gap-4 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Descrição</span>
              <span>Data / Conta</span>
              <span>Valor</span>
              <span>Status</span>
              <span />
            </div>

            {data.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto_auto] gap-2 sm:gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors items-center"
              >
                {/* Description */}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    t.type === "income" ? "bg-green-100 dark:bg-green-900/30" :
                    t.type === "expense" ? "bg-red-100 dark:bg-red-900/30" :
                    "bg-blue-100 dark:bg-blue-900/30"
                  )}>
                    {t.type === "income" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : t.type === "expense" ? (
                      <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <ArrowLeftRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {(t.category as { name: string } | null)?.name || "Sem categoria"}
                      {t.installment_total && ` • ${t.installment_number}/${t.installment_total}x`}
                    </p>
                  </div>
                </div>

                {/* Date & Account */}
                <div className="sm:block flex items-center gap-2">
                  <p className="text-sm">{formatDate(t.date)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(t.account as { name: string } | null)?.name}
                  </p>
                </div>

                {/* Amount */}
                <p className={cn(
                  "text-sm font-semibold",
                  t.type === "income" ? "text-green-600 dark:text-green-400" :
                  t.type === "expense" ? "text-red-600 dark:text-red-400" :
                  "text-blue-600 dark:text-blue-400"
                )}>
                  {t.type === "expense" ? "-" : "+"}{formatCurrency(t.amount)}
                </p>

                {/* Status */}
                <Badge variant={statusVariants[t.status]} className="w-fit">
                  {statusLabels[t.status]}
                </Badge>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditingTransaction(t); setShowForm(true) }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingId(t.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {total_pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateFilters({ page: page - 1 })}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= total_pages}
              onClick={() => updateFilters({ page: page + 1 })}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? "Editar lançamento" : "Novo lançamento"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            transaction={editingTransaction}
            defaultType={defaultFormType}
            onSuccess={() => { setShowForm(false); reload() }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialogComponent
        open={!!deletingId}
        onOpenChange={(v) => !v && setDeletingId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
