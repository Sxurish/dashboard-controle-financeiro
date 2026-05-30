"use client"
import { useState, useEffect } from "react"
import { Plus, CreditCard, Pencil, Trash2, AlertCircle, Receipt, CheckCircle2, RotateCcw, Calendar } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  getCreditCards, createCreditCard, updateCreditCard, deleteCreditCard,
  getCardInvoicesComputed, computeUsedLimit, payInvoice, unpayInvoice,
  type ComputedInvoice,
} from "@/services/credit-cards"
import { creditCardSchema, type CreditCardFormValues } from "@/schemas/credit-card.schema"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/utils/currency"
import { formatDate } from "@/utils/date"
import type { CreditCard as CreditCardType } from "@/types/app"
import { cn } from "@/lib/utils"

const CARD_COLORS = [
  "#1e293b", "#0f172a", "#7c3aed", "#1d4ed8", "#0891b2",
  "#059669", "#dc2626", "#d97706", "#be185d", "#374151",
]

const CARD_BRANDS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard", "Outros"]

const invoiceStatusLabels: Record<ComputedInvoice["status"], string> = {
  open: "Aberta", closed: "Fechada", paid: "Paga",
}
const invoiceStatusVariants: Record<ComputedInvoice["status"], "pending" | "warning" | "success"> = {
  open: "pending", closed: "warning", paid: "success",
}

interface CardData {
  usedLimit: number
  invoices: ComputedInvoice[]
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCardType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [cardData, setCardData] = useState<Record<string, CardData>>({})

  // Invoice detail dialog
  const [viewing, setViewing] = useState<{ card: CreditCardType; invoice: ComputedInvoice } | null>(null)
  const [paying, setPaying] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: { color: CARD_COLORS[0], brand: "Visa" },
  })

  const selectedColor = watch("color")

  async function loadCards() {
    setLoading(true)
    try {
      const c = await getCreditCards()
      setCards(c)
      const data: Record<string, CardData> = {}
      await Promise.all(c.map(async (card) => {
        const invoices = await getCardInvoicesComputed(card)
        data[card.id] = { usedLimit: computeUsedLimit(invoices), invoices }
      }))
      setCardData(data)
    } catch {
      toast.error("Erro ao carregar cartões")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCards() }, [])

  function openEdit(card: CreditCardType) {
    setEditingCard(card)
    reset({
      name: card.name,
      limit: card.limit,
      closing_day: card.closing_day,
      due_day: card.due_day,
      color: card.color || CARD_COLORS[0],
      brand: card.brand || "Visa",
    })
    setShowForm(true)
  }

  function openNew() {
    setEditingCard(null)
    reset({ color: CARD_COLORS[0], brand: "Visa", limit: 0, closing_day: 1, due_day: 10 })
    setShowForm(true)
  }

  async function onSubmit(values: CreditCardFormValues) {
    setSaving(true)
    try {
      if (editingCard) {
        await updateCreditCard(editingCard.id, values)
        toast.success("Cartão atualizado!")
      } else {
        await createCreditCard(values)
        toast.success("Cartão criado!")
      }
      setShowForm(false)
      loadCards()
    } catch {
      toast.error("Erro ao salvar cartão")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteCreditCard(deletingId)
      toast.success("Cartão excluído")
      loadCards()
    } catch {
      toast.error("Erro ao excluir")
    } finally {
      setDeletingId(null)
    }
  }

  async function handlePay() {
    if (!viewing) return
    setPaying(true)
    try {
      if (viewing.invoice.status === "paid") {
        await unpayInvoice(viewing.card, viewing.invoice.referenceMonth)
        toast.success("Fatura reaberta")
      } else {
        await payInvoice(viewing.card, viewing.invoice)
        toast.success("Fatura marcada como paga! 🎉")
      }
      setViewing(null)
      loadCards()
    } catch {
      toast.error("Erro ao atualizar fatura")
    } finally {
      setPaying(false)
    }
  }

  /** The invoice that's currently "the bill to look at": first unpaid, else most recent. */
  function currentInvoice(invoices: ComputedInvoice[]): ComputedInvoice | undefined {
    return invoices.find(i => i.status !== "paid" && i.total > 0) || invoices.find(i => i.total > 0) || invoices[0]
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Cartões de Crédito" description="Gerencie seus cartões e faturas">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Novo cartão
        </Button>
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6 space-y-4">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent></Card>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState icon={CreditCard} title="Nenhum cartão" description="Adicione seus cartões de crédito para controlar faturas e limites.">
          <Button onClick={openNew}><Plus className="h-4 w-4" />Adicionar cartão</Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cards.map(card => {
            const data = cardData[card.id]
            const usedLimit = data?.usedLimit || 0
            const usedPct = card.limit > 0 ? Math.min((usedLimit / card.limit) * 100, 100) : 0
            const available = card.limit - usedLimit
            const invoice = data ? currentInvoice(data.invoices) : undefined

            return (
              <Card key={card.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Card visual */}
                <div
                  className="p-6 text-white relative overflow-hidden"
                  style={{ backgroundColor: card.color || "#1e293b" }}
                >
                  <div className="absolute right-4 top-4 opacity-20 text-8xl font-bold">
                    {card.brand?.[0] || ""}
                  </div>
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider">{card.brand || "Cartão"}</p>
                      <p className="font-semibold text-lg mt-0.5">{card.name}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10" onClick={() => openEdit(card)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setDeletingId(card.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/70 text-xs">Limite total</p>
                      <p className="font-bold text-xl">{formatCurrency(card.limit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-xs">Fecha dia</p>
                      <p className="font-semibold">{card.closing_day}</p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Limit usage */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Limite usado</span>
                      <span className="font-medium">{usedPct.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={usedPct}
                      className={cn("h-2", usedPct > 80 ? "text-red-500" : "")}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Usado: {formatCurrency(usedLimit)}</span>
                      <span className={available < 0 ? "text-destructive font-medium" : ""}>
                        Disponível: {formatCurrency(Math.max(available, 0))}
                      </span>
                    </div>
                  </div>

                  {usedPct > 80 && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      Limite acima de 80% — fique atento!
                    </div>
                  )}

                  <Separator />

                  {/* Current invoice */}
                  {invoice && invoice.total > 0 ? (
                    <button
                      onClick={() => setViewing({ card, invoice })}
                      className="w-full flex items-center justify-between text-left hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="text-xs text-muted-foreground">Fatura {invoice.label}</p>
                        <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                        <p className="text-xs text-muted-foreground">Vence: {formatDate(invoice.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={invoiceStatusVariants[invoice.status]}>
                          {invoiceStatusLabels[invoice.status]}
                        </Badge>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhuma compra nesta fatura</p>
                  )}

                  {/* Invoice history */}
                  {data && data.invoices.filter(i => i.total > 0).length > 1 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-medium text-muted-foreground">Outras faturas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.invoices
                          .filter(i => i.total > 0 && i.referenceMonth !== invoice?.referenceMonth)
                          .slice(0, 5)
                          .map(inv => (
                            <button
                              key={inv.referenceMonth}
                              onClick={() => setViewing({ card, invoice: inv })}
                              className={cn(
                                "text-xs px-2 py-1 rounded-md border transition-colors hover:bg-muted",
                                inv.status === "paid" ? "text-muted-foreground" : "font-medium"
                              )}
                            >
                              {inv.label} · {formatCurrency(inv.total)}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Fecha: dia {card.closing_day}</span>
                    <span>Vence: dia {card.due_day}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCard ? "Editar cartão" : "Novo cartão"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Nome do cartão</Label>
                <Input placeholder="Ex: Nubank, Itaú..." {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Bandeira</Label>
                <Select defaultValue={editingCard?.brand || "Visa"} onValueChange={v => setValue("brand", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CARD_BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Limite (R$)</Label>
                <Input type="number" step="0.01" min="0.01" {...register("limit", { valueAsNumber: true })} />
                {errors.limit && <p className="text-xs text-destructive">{errors.limit.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Dia de fechamento</Label>
                <Input type="number" min={1} max={31} {...register("closing_day", { valueAsNumber: true })} />
                {errors.closing_day && <p className="text-xs text-destructive">{errors.closing_day.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Dia de vencimento</Label>
                <Input type="number" min={1} max={31} {...register("due_day", { valueAsNumber: true })} />
                {errors.due_day && <p className="text-xs text-destructive">{errors.due_day.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor do cartão</Label>
              <div className="flex flex-wrap gap-2">
                {CARD_COLORS.map(color => (
                  <button key={color} type="button" onClick={() => setValue("color", color)}
                    className={cn("w-8 h-8 rounded-lg border-2 transition-all", selectedColor === color ? "border-foreground scale-110" : "border-transparent")}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: selectedColor || CARD_COLORS[0] }}>
              <p className="opacity-70 text-xs">Prévia</p>
              <p className="mt-1">{watch("name") || "Nome do cartão"}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : editingCard ? "Atualizar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Fatura {viewing.invoice.label} · {viewing.card.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-sm mt-0.5">{formatCurrency(viewing.invoice.total)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Calendar className="h-3 w-3" />Fecha</p>
                    <p className="font-medium text-sm mt-0.5">{formatDate(viewing.invoice.closeDate)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Calendar className="h-3 w-3" />Vence</p>
                    <p className="font-medium text-sm mt-0.5">{formatDate(viewing.invoice.dueDate)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant={invoiceStatusVariants[viewing.invoice.status]}>
                    {invoiceStatusLabels[viewing.invoice.status]}
                  </Badge>
                  {viewing.invoice.paidAt && (
                    <span className="text-xs text-muted-foreground">Paga em {formatDate(viewing.invoice.paidAt)}</span>
                  )}
                </div>

                <Separator />

                <div className="space-y-1 max-h-64 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {viewing.invoice.transactions.length} lançamento(s)
                  </p>
                  {viewing.invoice.transactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between py-1.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                      </div>
                      <span className="font-medium tabular-nums ml-2">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handlePay}
                  disabled={paying || viewing.invoice.total === 0}
                  variant={viewing.invoice.status === "paid" ? "outline" : "default"}
                  className="w-full"
                >
                  {viewing.invoice.status === "paid" ? (
                    <><RotateCcw className="h-4 w-4" /> Reabrir fatura</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Marcar como paga</>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir cartão</AlertDialogTitle><AlertDialogDescription>Tem certeza? As faturas e lançamentos associados serão mantidos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
