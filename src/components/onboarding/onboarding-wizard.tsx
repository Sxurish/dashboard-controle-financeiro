"use client"
import { useState } from "react"
import {
  Wallet, Landmark, Smartphone, PiggyBank, TrendingUp,
  ArrowRight, ArrowLeft, Check, Sparkles, Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { completeOnboarding, type OnboardingData } from "@/services/onboarding"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { AccountType } from "@/types/app"
import { cn } from "@/lib/utils"

const GRADIENT = "linear-gradient(135deg, #FF6B00, #E91E8C, #7B2FBE)"

const KLogo = ({ size = 28 }: { size?: number }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} fill="none">
    <path d="M22 12L22 86" stroke="white" strokeWidth="12" strokeLinecap="round" />
    <path d="M22 36L78 10" stroke="white" strokeWidth="10" strokeLinecap="round" />
    <path d="M22 50L55 30" stroke="white" strokeWidth="8" strokeLinecap="round" />
    <path d="M22 50L55 70" stroke="white" strokeWidth="8" strokeLinecap="round" />
    <path d="M22 64L78 90" stroke="white" strokeWidth="10" strokeLinecap="round" />
    <circle cx="78" cy="10" r="7" fill="white" />
    <circle cx="78" cy="90" r="7" fill="white" />
    <circle cx="22" cy="87" r="5" fill="white" />
  </svg>
)

const ACCOUNT_TYPES: Array<{ value: AccountType; label: string; icon: typeof Wallet }> = [
  { value: "bank", label: "Conta bancária", icon: Landmark },
  { value: "digital", label: "Conta digital", icon: Smartphone },
  { value: "cash", label: "Dinheiro", icon: Wallet },
  { value: "savings", label: "Poupança", icon: PiggyBank },
  { value: "investment", label: "Investimento", icon: TrendingUp },
]

interface OnboardingWizardProps {
  open: boolean
  onComplete: () => void
}

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [accountName, setAccountName] = useState("")
  const [accountType, setAccountType] = useState<AccountType>("bank")
  const [accountBalance, setAccountBalance] = useState("")
  const [seedCategories, setSeedCategories] = useState(true)

  const totalSteps = 3

  async function finish() {
    setSaving(true)
    try {
      const data: OnboardingData = {
        accountName: accountName.trim() || "Minha conta",
        accountType,
        accountBalance: parseFloat(accountBalance.replace(",", ".")) || 0,
        seedCategories,
      }
      await completeOnboarding(data)
      toast.success("Tudo pronto! Bem-vindo ao Kaivo 🎉")
      onComplete()
    } catch (e) {
      const description = e instanceof Error ? e.message
        : e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message)
        : "Tente novamente."
      toast.error("Erro ao configurar sua conta", { description })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden gap-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header with gradient */}
        <div className="p-6 pb-5" style={{ background: GRADIENT }}>
          <div className="flex items-center gap-3 text-white">
            <KLogo size={32} />
            <div>
              <p className="font-bold text-xl leading-none">kaivo</p>
              <p className="text-[10px] tracking-widest uppercase opacity-80 mt-1">Financial Intelligence</p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex gap-1.5 mt-5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full flex-1 transition-all",
                  i <= step ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: GRADIENT }}>
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold">Bem-vindo ao Kaivo!</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Vamos configurar sua conta em poucos passos para você ter clareza
                  financeira desde o primeiro dia.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-left">
                {[
                  { t: "Contas", d: "Centralize tudo" },
                  { t: "Categorias", d: "Organize gastos" },
                  { t: "Relatórios", d: "Veja a evolução" },
                ].map(item => (
                  <div key={item.t} className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs font-semibold">{item.t}</p>
                    <p className="text-[11px] text-muted-foreground">{item.d}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — First account */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">Sua primeira conta</h2>
                <p className="text-muted-foreground text-sm">
                  Onde está seu dinheiro? Você pode adicionar mais contas depois.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Nome da conta</Label>
                <Input
                  placeholder="Ex: Nubank, Itaú, Carteira…"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ACCOUNT_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setAccountType(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition-all",
                        accountType === t.value
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border hover:border-primary/40 text-muted-foreground"
                      )}
                    >
                      <t.icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Saldo atual (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={accountBalance}
                  onChange={e => setAccountBalance(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Quanto você tem nessa conta hoje. Pode deixar 0.</p>
              </div>
            </div>
          )}

          {/* Step 2 — Categories */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold">Categorias iniciais</h2>
                <p className="text-muted-foreground text-sm">
                  Podemos criar um conjunto de categorias prontas para você começar agora.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSeedCategories(v => !v)}
                className={cn(
                  "w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  seedCategories ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Checkbox checked={seedCategories} className="mt-0.5 pointer-events-none" />
                <div>
                  <p className="text-sm font-medium">Criar categorias padrão</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Moradia, Alimentação, Transporte, Saúde, Lazer, Salário, Investimentos e mais.
                  </p>
                </div>
              </button>

              <div className="flex flex-wrap gap-1.5">
                {["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Educação", "Salário", "Freelance", "Investimentos"].map(c => (
                  <span key={c} className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground">{c}</span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Você pode criar, editar ou remover categorias a qualquer momento.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 p-6 pt-0">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={saving}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          ) : <span />}

          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !accountName.trim()}
              style={{ background: GRADIENT }}
              className="text-white border-0"
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving} style={{ background: GRADIENT }} className="text-white border-0">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Configurando…</> : <><Check className="h-4 w-4" /> Concluir</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
