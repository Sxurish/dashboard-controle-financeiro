"use client"
import { useState, useEffect } from "react"
import {
  TrendingUp, TrendingDown, Wallet, DollarSign,
} from "lucide-react"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { RevenueExpenseChart } from "@/components/dashboard/revenue-expense-chart"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { FinancialAlerts } from "@/components/dashboard/financial-alerts"
import {
  useDashboardKPIs,
  useChartData,
  useCategoryChart,
  useRecentTransactions,
} from "@/hooks/use-transactions"
import { useAccounts } from "@/hooks/use-accounts"
import { getOverdueTransactions } from "@/services/transactions"
import { formatCurrency } from "@/utils/currency"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FinancialAlert } from "@/types/app"

export default function DashboardPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])

  const { kpis, loading: kpisLoading } = useDashboardKPIs(year, month)
  const { data: chartData, loading: chartLoading } = useChartData(year)
  const { data: categoryData, loading: categoryLoading } = useCategoryChart(year, month)
  const { data: recentData, loading: recentLoading } = useRecentTransactions(8)
  const { totalBalance, loading: balanceLoading } = useAccounts()

  useEffect(() => {
    getOverdueTransactions().then(overdue => {
      const newAlerts: FinancialAlert[] = []
      if (overdue.length > 0) {
        newAlerts.push({
          id: "overdue",
          type: "overdue",
          severity: "error",
          message: `${overdue.length} lançamento${overdue.length > 1 ? "s" : ""} em atraso. Verifique seus pagamentos pendentes.`,
        })
      }
      if (kpis && kpis.monthExpense > kpis.monthIncome) {
        newAlerts.push({
          id: "deficit",
          type: "budget",
          severity: "warning",
          message: `Atenção: suas despesas (${formatCurrency(kpis.monthExpense)}) superam suas receitas (${formatCurrency(kpis.monthIncome)}) este mês.`,
        })
      }
      setAlerts(newAlerts)
    })
  }, [kpis])

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Visão geral das suas finanças
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && <FinancialAlerts alerts={alerts} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Saldo Total"
          value={totalBalance}
          icon={Wallet}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          loading={balanceLoading}
        />
        <KpiCard
          title="Receitas do Mês"
          value={kpis?.monthIncome || 0}
          previousValue={kpis?.prevMonthIncome}
          icon={TrendingUp}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          loading={kpisLoading}
        />
        <KpiCard
          title="Despesas do Mês"
          value={kpis?.monthExpense || 0}
          previousValue={kpis?.prevMonthExpense}
          icon={TrendingDown}
          iconBg="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-600 dark:text-red-400"
          loading={kpisLoading}
          invertChange
        />
        <KpiCard
          title="Resultado do Mês"
          value={kpis?.monthResult || 0}
          previousValue={kpis?.prevMonthResult}
          icon={DollarSign}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          loading={kpisLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueExpenseChart data={chartData} loading={chartLoading} />
        </div>
        <div>
          <CategoryChart data={categoryData} loading={categoryLoading} />
        </div>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions data={recentData} loading={recentLoading} />
    </div>
  )
}
