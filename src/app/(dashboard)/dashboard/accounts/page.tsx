"use client"
import { useState } from "react"
import { Plus, Wallet, Pencil, Trash2, Banknote, CreditCard, PiggyBank, TrendingUp, Smartphone } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useAccounts } from "@/hooks/use-accounts"
import { createAccount, updateAccount, deleteAccount } from "@/services/accounts"
import { accountSchema, type AccountFormValues } from "@/schemas/account.schema"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/utils/currency"
import type { Account } from "@/types/app"
import { cn } from "@/lib/utils"

const accountTypeLabels: Record<string, string> = {
  bank: "Banco", cash: "Dinheiro", digital: "Conta Digital",
  savings: "Poupança", investment: "Investimento", credit: "Crédito",
}

const accountIcons: Record<string, React.ElementType> = {
  bank: Wallet, cash: Banknote, digital: Smartphone,
  savings: PiggyBank, investment: TrendingUp, credit: CreditCard,
}

const ACCOUNT_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#64748b",
]

export default function AccountsPage() {
  const { accounts, totalBalance, loading, reload } = useAccounts()
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { type: "bank", balance: 0, color: ACCOUNT_COLORS[0] },
  })

  const selectedColor = watch("color")

  function openEdit(account: Account) {
    setEditingAccount(account)
    reset({
      name: account.name,
      type: account.type,
      balance: account.balance,
      color: account.color || ACCOUNT_COLORS[0],
      icon: account.icon || "",
    })
    setShowForm(true)
  }

  function openNew() {
    setEditingAccount(null)
    reset({ type: "bank", balance: 0, color: ACCOUNT_COLORS[0] })
    setShowForm(true)
  }

  async function onSubmit(values: AccountFormValues) {
    setSaving(true)
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, values)
        toast.success("Conta atualizada!")
      } else {
        await createAccount(values)
        toast.success("Conta criada!")
      }
      setShowForm(false)
      reload()
    } catch {
      toast.error("Erro ao salvar conta")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteAccount(deletingId)
      toast.success("Conta excluída")
      reload()
    } catch {
      toast.error("Erro ao excluir")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Contas" description="Gerencie suas contas e carteiras">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nova conta
        </Button>
      </PageHeader>

      {/* Total balance card */}
      {!loading && accounts.length > 0 && (
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
          <CardContent className="p-6">
            <p className="text-sm opacity-80 mb-1">Saldo total</p>
            <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            <p className="text-xs opacity-70 mt-1">{accounts.length} conta{accounts.length !== 1 ? "s" : ""} ativa{accounts.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6 space-y-3"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-5 w-32" /><Skeleton className="h-7 w-28" /></CardContent></Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhuma conta" description="Adicione suas contas bancárias, dinheiro, carteiras digitais e investimentos.">
          <Button onClick={openNew}><Plus className="h-4 w-4" />Criar conta</Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => {
            const Icon = accountIcons[account.type] || Wallet
            return (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${account.color || "#3b82f6"}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: account.color || "#3b82f6" }} />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(account)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingId(account.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="font-semibold mb-1">{account.name}</p>
                  <Badge variant="secondary" className="text-xs mb-3">{accountTypeLabels[account.type]}</Badge>
                  <p className={cn("text-2xl font-bold", account.balance < 0 ? "text-destructive" : "text-foreground")}>
                    {formatCurrency(account.balance)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingAccount ? "Editar conta" : "Nova conta"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Ex: Nubank, Carteira..." {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select defaultValue={editingAccount?.type || "bank"} onValueChange={v => setValue("type", v as AccountFormValues["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Banco</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="digital">Conta Digital</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                    <SelectItem value="credit">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Saldo inicial (R$)</Label>
                <Input type="number" step="0.01" placeholder="0,00" {...register("balance", { valueAsNumber: true })} />
                {errors.balance && <p className="text-xs text-destructive">{errors.balance.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_COLORS.map(color => (
                  <button key={color} type="button" onClick={() => setValue("color", color)} className={cn("w-7 h-7 rounded-full border-2 transition-all", selectedColor === color ? "border-foreground scale-110" : "border-transparent")} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : editingAccount ? "Atualizar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir conta</AlertDialogTitle><AlertDialogDescription>Tem certeza? Os lançamentos associados serão mantidos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
