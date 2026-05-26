import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FinancialAlert } from "@/types/app"

interface FinancialAlertsProps {
  alerts: FinancialAlert[]
}

const icons = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  error: "text-destructive bg-destructive/10",
  warning: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
  info: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30",
}

export function FinancialAlerts({ alerts }: FinancialAlertsProps) {
  if (!alerts.length) return null

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Alertas Financeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => {
          const Icon = icons[alert.severity]
          return (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg text-sm",
                colors[alert.severity]
              )}
            >
              <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{alert.message}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
