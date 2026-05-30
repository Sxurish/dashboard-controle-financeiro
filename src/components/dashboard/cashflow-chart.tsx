"use client"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import type { CashFlowPoint } from "@/services/cashflow"
import { formatCurrency } from "@/utils/currency"

function formatYTick(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (abs >= 1_000_000) { const v = abs / 1_000_000; return `${sign}R$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M` }
  if (abs >= 1_000) { const v = abs / 1_000; return `${sign}R$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k` }
  return `${sign}R$${abs.toFixed(0)}`
}

interface TooltipPayloadItem {
  payload: CashFlowPoint
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border bg-card p-3 shadow-md text-xs space-y-1.5 max-w-56">
      <p className="font-semibold">{point.label}</p>
      <p className={point.balance < 0 ? "text-destructive font-medium" : "font-medium"}>
        Saldo: {formatCurrency(point.balance)}
      </p>
      {point.events.length > 0 && (
        <div className="space-y-0.5 pt-1 border-t">
          {point.events.slice(0, 5).map((e, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span className="truncate text-muted-foreground">{e.description}</span>
              <span className={e.amount >= 0 ? "text-green-600" : "text-red-600"}>
                {e.amount >= 0 ? "+" : ""}{formatCurrency(e.amount)}
              </span>
            </div>
          ))}
          {point.events.length > 5 && (
            <p className="text-muted-foreground">+{point.events.length - 5} mais…</p>
          )}
        </div>
      )}
    </div>
  )
}

export function CashFlowChart({ points }: { points: CashFlowPoint[] }) {
  // Show ~12 evenly-spaced X labels max to avoid crowding.
  const tickInterval = Math.max(0, Math.floor(points.length / 12) - 1)

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balancePos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
        <XAxis
          dataKey="label"
          className="text-xs"
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
        />
        <YAxis
          className="text-xs"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatYTick}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="#FF6B00"
          strokeWidth={2}
          fill="url(#balancePos)"
          name="Saldo projetado"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
