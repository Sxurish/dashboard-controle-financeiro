"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, ArrowLeftRight, Tag, Wallet, CreditCard, Target,
  BarChart3, Settings, X, RefreshCcw, PiggyBank, Upload
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Lançamentos", icon: ArrowLeftRight },
  { href: "/dashboard/import", label: "Importar", icon: Upload },
  { href: "/dashboard/accounts", label: "Contas", icon: Wallet },
  { href: "/dashboard/credit-cards", label: "Cartões", icon: CreditCard },
  { href: "/dashboard/categories", label: "Categorias", icon: Tag },
  { href: "/dashboard/recurring", label: "Recorrências", icon: RefreshCcw },
  { href: "/dashboard/budget", label: "Orçamento", icon: PiggyBank },
  { href: "/dashboard/goals", label: "Metas", icon: Target },
  { href: "/dashboard/reports", label: "Relatórios", icon: BarChart3 },
]

const bottomItems = [
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            {/* Gradient box with white K SVG */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #E91E8C, #7B2FBE)' }}
            >
              <svg viewBox="0 0 100 100" className="w-[18px] h-[18px]" fill="none">
                <path d="M22 12L22 86" stroke="white" strokeWidth="12" strokeLinecap="round" />
                <path d="M22 36L78 10" stroke="white" strokeWidth="10" strokeLinecap="round" />
                <path d="M22 50L55 30" stroke="white" strokeWidth="8" strokeLinecap="round" />
                <path d="M22 50L55 70" stroke="white" strokeWidth="8" strokeLinecap="round" />
                <path d="M22 64L78 90" stroke="white" strokeWidth="10" strokeLinecap="round" />
                <circle cx="78" cy="10" r="7" fill="white" />
                <circle cx="78" cy="90" r="7" fill="white" />
                <circle cx="22" cy="87" r="5" fill="white" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-lg tracking-tight kaivo-gradient-text">kaivo</span>
              <span className="text-[9px] text-muted-foreground tracking-widest uppercase">by HSB Company</span>
            </div>
          </Link>
          {onClose && (
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  style={isActive ? { background: 'linear-gradient(135deg, rgba(255,107,0,0.13) 0%, rgba(233,30,140,0.10) 50%, rgba(123,47,190,0.08) 100%)' } : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Bottom nav */}
        <div className="px-3 py-4 border-t space-y-1 flex-shrink-0">
          {bottomItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={isActive ? { background: 'linear-gradient(135deg, rgba(255,107,0,0.13) 0%, rgba(233,30,140,0.10) 50%, rgba(123,47,190,0.08) 100%)' } : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
