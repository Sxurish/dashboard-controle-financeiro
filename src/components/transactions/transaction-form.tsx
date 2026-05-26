"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { transactionSchema, type TransactionFormValues } from "@/schemas/transaction.schema"
import { createTransaction, updateTransaction } from "@/services/transactions"
import { getAccounts } from "@/services/accounts"
import { getCategories } from "@/services/categories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { Account, Category, TransactionWithRelations } from "@/types/app"

interface TransactionFormProps {
  transaction?: TransactionWithRelations | null
  defaultType?: "income" | "expense" | "transfer"
  onSuccess: () => void
  onCancel: () => void
}

export function TransactionForm({ transaction, defaultType = "expense", onSuccess, onCancel }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<"income" | "expense" | "transfer">(
    transaction?.type || defaultType
  )

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type || defaultType,
      status: transaction?.status || "paid",
      date: transaction?.date || new Date().toISOString().split("T")[0],
      amount: transaction?.amount || undefined,
      description: transaction?.description || "",
      category_id: transaction?.category_id || null,
      account_id: transaction?.account_id || "",
      payment_method: transaction?.payment_method || null,
      notes: transaction?.notes || "",
      is_installment: false,
      installment_count: undefined,
    },
  })

  const isInstallment = watch("is_installment")
  const transactionType = watch("type")

  useEffect(() => {
    Promise.all([getAccounts(), getCategories()]).then(([accs, cats]) => {
      setAccounts(accs)
      setCategories(cats)
    })
  }, [])

  function handleTabChange(tab: "income" | "expense" | "transfer") {
    setActiveTab(tab)
    setValue("type", tab)
  }

  async function onSubmit(values: TransactionFormValues) {
    setLoading(true)
    try {
      if (transaction) {
        await updateTransaction(transaction.id, values)
        toast.success("Lançamento atualizado!")
      } else {
        await createTransaction(values)
        toast.success("Lançamento criado!")
      }
      onSuccess()
    } catch (e) {
      toast.error("Erro ao salvar", { description: e instanceof Error ? e.message : "Tente novamente" })
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(c =>
    activeTab === "transfer" ? true : c.type === activeTab
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as "income" | "expense" | "transfer")}>
        <TabsList className="w-full">
          <TabsTrigger value="expense" className="flex-1">Despesa</TabsTrigger>
          <TabsTrigger value="income" className="flex-1">Receita</TabsTrigger>
          <TabsTrigger value="transfer" className="flex-1">Transferência</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Descrição</Label>
          <Input placeholder="Ex: Supermercado" {...register("description")} />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>

        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Data</Label>
          <Input type="date" {...register("date")} />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>

        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Status</Label>
          <Select
            defaultValue={transaction?.status || "paid"}
            onValueChange={(v) => setValue("status", v as "paid" | "pending" | "overdue")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <Label>Conta</Label>
          <Select
            defaultValue={transaction?.account_id || ""}
            onValueChange={(v) => setValue("account_id", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.account_id && <p className="text-xs text-destructive">{errors.account_id.message}</p>}
        </div>

        {activeTab !== "transfer" && (
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>Categoria</Label>
            <Select
              defaultValue={transaction?.category_id || ""}
              onValueChange={(v) => setValue("category_id", v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {activeTab === "transfer" && (
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>Conta destino</Label>
            <Select onValueChange={(v) => setValue("transfer_account_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.transfer_account_id && (
              <p className="text-xs text-destructive">{errors.transfer_account_id.message}</p>
            )}
          </div>
        )}

        {activeTab !== "transfer" && (
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label>Forma de pagamento</Label>
            <Select
              defaultValue={transaction?.payment_method || ""}
              onValueChange={(v) => setValue("payment_method", v as TransactionFormValues["payment_method"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credit_card">Cartão de crédito</SelectItem>
                <SelectItem value="debit_card">Cartão de débito</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="bank_transfer">Transferência bancária</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {activeTab === "expense" && !transaction && (
          <div className="col-span-2 space-y-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_installment"
                checked={isInstallment}
                onCheckedChange={(v) => setValue("is_installment", Boolean(v))}
              />
              <Label htmlFor="is_installment" className="cursor-pointer font-normal">
                Compra parcelada
              </Label>
            </div>
            {isInstallment && (
              <div className="space-y-1.5">
                <Label>Número de parcelas</Label>
                <Input
                  type="number"
                  min={2}
                  max={360}
                  placeholder="Ex: 12"
                  {...register("installment_count", { valueAsNumber: true })}
                />
                {errors.installment_count && (
                  <p className="text-xs text-destructive">{errors.installment_count.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5 col-span-2">
          <Label>Observações (opcional)</Label>
          <Textarea
            placeholder="Informações adicionais..."
            className="resize-none"
            rows={2}
            {...register("notes")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : transaction ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}
