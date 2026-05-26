"use client"
import { useState } from "react"
import { Download, BarChart3, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Legend, AreaChart, Area
} from "recharts"
import { useChartData, useCategoryChart } from "@/hooks/use-transactions"
import { exportTransactionsCSV } from "@/services/transactions"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/utils/currency"

function CustomTooltipCurrency({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
          <span className="text-muted-foreground">{e.name === "income" ? "Receitas" : e.name === "expense" ? "Despesas" : e.name === "balance" ? "Saldo" : e.name}:</span>
          <span className="font-medium">{formatCurrency(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: chartData, loading: chartLoading } = useChartData(year)
  const { data: categoryData, loading: categoryLoading } = useCategoryChart(year, month)

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  const enrichedData = chartData.map((d, i) => ({
    ...d,
    name: monthNames[i],
    balance: d.income - d.expense,
  }))

  const totalIncome = chartData.reduce((s, d) => s + d.income, 0)
  const totalExpense = chartData.reduce((s, d) => s + d.expense, 0)
  const totalBalance = totalIncome - totalExpense
  const avgIncome = chartData.length ? totalIncome / 12 : 0
  const avgExpense = chartData.length ? totalExpense / 12 : 0

  async function handleExport() {
    try {
      const csv = await exportTransactionsCSV({ year, month })
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `moneta-relatorio-${year}-${String(month).padStart(2, "0")}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Relatório exportado!")
    } catch {
      toast.error("Erro ao exportar relatório")
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Relatórios" description="Análise detalhada das suas finanças">
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()].map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </PageHeader>

      {/* Annual summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receitas (ano)", value: totalIncome, icon: TrendingUp, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
          { label: "Despesas (ano)", value: totalExpense, icon: TrendingDown, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" },
          { label: "Resultado (ano)", value: totalBalance, icon: ArrowLeftRight, color: totalBalance >= 0 ? "text-blue-600" : "text-destructive", bg: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "Média mensal rec.", value: avgIncome, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.bg}`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
              </div>
              {chartLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <p className="text-xl font-bold">{formatCurrency(item.value)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="evolution">
        <TabsList>
          <TabsTrigger value="evolution">Evolução Anual</TabsTrigger>
          <TabsTrigger value="balance">Saldo</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Receitas × Despesas — {year}</CardTitle>
              <CardDescription>Comparativo mensal de entradas e saídas</CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? <Skeleton className="h-80 w-full" /> : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={enrichedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltipCurrency />} />
                    <Legend formatter={v => v === "income" ? "Receitas" : "Despesas"} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Saldo — {year}</CardTitle>
              <CardDescription>Resultado mensal (receitas − despesas)</CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? <Skeleton className="h-80 w-full" /> : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={enrichedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltipCurrency />} />
                    <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fill="url(#colorBalance)" dot={{ r: 4 }} activeDot={{ r: 6 }} name="balance" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição do mês selecionado</CardDescription>
              </div>
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {categoryLoading ? <Skeleton className="h-80 w-full" /> : categoryData.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
                  Nenhuma despesa neste período
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryData.map(cat => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="font-medium">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">{cat.percentage.toFixed(1)}%</span>
                          <span className="font-semibold w-28 text-right">{formatCurrency(cat.value)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
