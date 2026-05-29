"use client"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/currency"
import type { ChartDataPoint } from "@/types/app"

interface RevenueExpenseChartProps {
  data: ChartDataPoint[]
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2 capitalize">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name === "income" ? "Receitas" : entry.name === "expense" ? "Despesas" : "Saldo"}:</span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

function niceMax(value: number): number {
  if (value <= 0) return 1000
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const step = magnitude >= 1000 ? magnitude : magnitude * 10
  return Math.ceil(value / step) * step
}

function formatYTick(value: number): string {
  if (value === 0) return 'R$0'
  if (value >= 1_000_000) {
    const v = value / 1_000_000
    return `R$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`
  }
  if (value >= 1_000) {
    const v = value / 1_000
    return `R$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`
  }
  return `R$${value.toFixed(0)}`
}

export function RevenueExpenseChart({ data, loading }: RevenueExpenseChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map(d => ({
    ...d,
    balance: d.income - d.expense,
  }))

  const maxValue = Math.max(...chartData.map(d => Math.max(d.income, d.expense, Math.abs(d.balance))), 0)
  const yMax = niceMax(maxValue)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas × Despesas</CardTitle>
        <CardDescription>Comparativo mensal do ano</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYTick}
              domain={[0, yMax]}
              tickCount={6}
              className="fill-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(v) => v === "income" ? "Receitas" : v === "expense" ? "Despesas" : "Saldo"}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.9} />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.9} />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3b82f6" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
