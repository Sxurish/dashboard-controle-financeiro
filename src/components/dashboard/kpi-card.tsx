import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react"
import { formatCurrency, getChangePercentage } from "@/utils/currency"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: number
  previousValue?: number
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  loading?: boolean
  format?: "currency" | "number"
  invertChange?: boolean
}

export function KpiCard({
  title,
  value,
  previousValue,
  icon: Icon,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  loading,
  format = "currency",
  invertChange = false,
}: KpiCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    )
  }

  const changePercent = previousValue !== undefined ? getChangePercentage(value, previousValue) : null
  const isPositive = changePercent !== null && changePercent > 0
  const isNegative = changePercent !== null && changePercent < 0
  const isGood = invertChange ? isNegative : isPositive

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-2xl font-bold tracking-tight">
            {format === "currency" ? formatCurrency(value) : value.toLocaleString("pt-BR")}
          </p>

          {changePercent !== null && (
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
                isGood
                  ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                  : isNegative === invertChange
                  ? "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
                  : "text-muted-foreground bg-muted"
              )}>
                {Math.abs(changePercent) < 0.1 ? (
                  <Minus className="h-3 w-3" />
                ) : isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(changePercent).toFixed(1)}%
              </div>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
