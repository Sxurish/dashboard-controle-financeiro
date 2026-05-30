"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Sparkles, Loader2, ExternalLink, Crown } from "lucide-react"
import { toast } from "sonner"
import { useSubscription } from "@/hooks/use-subscription"
import { PLANS } from "@/lib/stripe/config"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/utils/date"
import { cn } from "@/lib/utils"

const GRADIENT = "linear-gradient(135deg, #FF6B00, #E91E8C, #7B2FBE)"

function BillingContent() {
  const { subscription, pro, loading, reload } = useSubscription()
  const searchParams = useSearchParams()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    const checkout = searchParams.get("checkout")
    if (checkout === "success") {
      toast.success("Assinatura ativada! Bem-vindo ao Pro 🎉")
      reload()
    } else if (checkout === "cancel") {
      toast.info("Checkout cancelado")
    }
  }, [searchParams, reload])

  async function handleUpgrade() {
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao iniciar checkout")
      if (data.url) window.location.href = data.url
    } catch (e) {
      toast.error("Não foi possível iniciar o pagamento", {
        description: e instanceof Error ? e.message : undefined,
      })
      setCheckoutLoading(false)
    }
  }

  async function handleManage() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao abrir portal")
      if (data.url) window.location.href = data.url
    } catch (e) {
      toast.error("Não foi possível abrir o gerenciamento", {
        description: e instanceof Error ? e.message : undefined,
      })
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Plano e cobrança" description="Gerencie sua assinatura do Kaivo" />

      {loading ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        <Card>
          <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={pro ? { background: GRADIENT } : undefined}
              >
                {pro
                  ? <Crown className="h-5 w-5 text-white" />
                  : <Sparkles className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Plano {pro ? "Pro" : "Grátis"}</p>
                  {pro && <Badge style={{ background: GRADIENT }} className="text-white border-0 text-[10px]">ATIVO</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {pro && subscription?.current_period_end
                    ? subscription.cancel_at_period_end
                      ? `Cancela em ${formatDate(subscription.current_period_end)}`
                      : `Renova em ${formatDate(subscription.current_period_end)}`
                    : "Recursos básicos para começar"}
                </p>
              </div>
            </div>
            {pro && (
              <Button variant="outline" onClick={handleManage} disabled={portalLoading}>
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Gerenciar assinatura
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Free */}
        <Card className={cn(!pro && "ring-1 ring-border")}>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="font-semibold text-lg">{PLANS.free.name}</p>
              <p className="text-3xl font-bold mt-1">{PLANS.free.priceLabel}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            </div>
            <ul className="space-y-2">
              {PLANS.free.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {!pro && <Badge variant="secondary" className="w-full justify-center py-1.5">Seu plano atual</Badge>}
          </CardContent>
        </Card>

        {/* Pro */}
        <Card style={{ background: "linear-gradient(180deg, rgba(255,107,0,0.06), rgba(123,47,190,0.04))" }}>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="font-semibold text-lg flex items-center gap-1.5">
                {PLANS.pro.name}
                <Crown className="h-4 w-4" style={{ color: "#E91E8C" }} />
              </p>
              <p className="text-3xl font-bold mt-1">{PLANS.pro.priceLabel}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            </div>
            <ul className="space-y-2">
              {PLANS.pro.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 flex-shrink-0" style={{ color: "#E91E8C" }} /> {f}
                </li>
              ))}
            </ul>
            {pro ? (
              <Badge style={{ background: GRADIENT }} className="w-full justify-center py-1.5 text-white border-0">Plano ativo ✓</Badge>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="w-full text-white border-0"
                style={{ background: GRADIENT }}
              >
                {checkoutLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecionando…</> : <><Sparkles className="h-4 w-4" /> Assinar o Pro</>}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Pagamento seguro processado pelo Stripe. Cancele quando quiser.
      </p>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <BillingContent />
    </Suspense>
  )
}
