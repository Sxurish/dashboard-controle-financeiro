"use client"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { TransactionFilters, Category, Account } from "@/types/app"
import { getMonthOptions, getYearOptions } from "@/utils/date"

interface TransactionFiltersBarProps {
  filters: TransactionFilters
  onChange: (f: Partial<TransactionFilters>) => void
  categories: Category[]
  accounts: Account[]
}

export function TransactionFiltersBar({ filters, onChange, categories, accounts }: TransactionFiltersBarProps) {
  const months = getMonthOptions()
  const years = getYearOptions(3)
  const now = new Date()

  function clearFilters() {
    onChange({
      search: "",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      category_id: undefined,
      type: "all",
      status: "all",
      account_id: undefined,
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.category_id ||
    (filters.type && filters.type !== "all") ||
    (filters.status && filters.status !== "all") ||
    filters.account_id

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar lançamentos..."
            className="pl-9"
            value={filters.search || ""}
            onChange={e => onChange({ search: e.target.value, page: 1 })}
          />
        </div>

        {/* Month */}
        <Select
          value={String(filters.month || now.getMonth() + 1)}
          onValueChange={v => onChange({ month: Number(v), page: 1 })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => (
              <SelectItem key={m.value} value={String(m.value)} className="capitalize">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Year */}
        <Select
          value={String(filters.year || now.getFullYear())}
          onValueChange={v => onChange({ year: Number(v), page: 1 })}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => (
              <SelectItem key={y.value} value={String(y.value)}>{y.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Type */}
        <Select
          value={filters.type || "all"}
          onValueChange={v => onChange({ type: v as TransactionFilters["type"], page: 1 })}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
            <SelectItem value="transfer">Transferências</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={filters.status || "all"}
          onValueChange={v => onChange({ status: v as TransactionFilters["status"], page: 1 })}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>

        {/* Category */}
        <Select
          value={filters.category_id || "all"}
          onValueChange={v => onChange({ category_id: v === "all" ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cats.</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Account */}
        <Select
          value={filters.account_id || "all"}
          onValueChange={v => onChange({ account_id: v === "all" ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {accounts.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-9">
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
