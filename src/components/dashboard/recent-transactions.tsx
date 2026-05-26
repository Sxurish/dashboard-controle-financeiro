import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/utils/currency"
import { formatDate } from "@/utils/date"
import type { TransactionWithRelations } from "@/types/app"
import { cn } from "@/lib/utils"

interface RecentTransactionsProps {
  data: TransactionWithRelations[]
  loading?: boolean
}

const statusLabels: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Atrasado",
}

const statusVariants: Record<string, "success" | "pending" | "overdue"> = {
  paid: "success",
  pending: "pending",
  overdue: "overdue",
}

export function RecentTransactions({ data, loading }: RecentTransactionsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Últimos Lançamentos</CardTitle>
          <CardDescription>As transações mais recentes</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/transactions" className="gap-1">
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Nenhum lançamento ainda
          </div>
        ) : (
          <div className="space-y-1">
            {data.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
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

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {(t.category as { name: string } | null)?.name || "Sem categoria"} • {formatDate(t.date)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={cn(
                    "text-sm font-semibold",
                    t.type === "income" ? "text-green-600 dark:text-green-400" :
                    t.type === "expense" ? "text-red-600 dark:text-red-400" :
                    "text-blue-600 dark:text-blue-400"
                  )}>
                    {t.type === "expense" ? "-" : "+"}{formatCurrency(t.amount)}
                  </span>
                  <Badge variant={statusVariants[t.status]} className="text-[10px] px-1.5 py-0">
                    {statusLabels[t.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
