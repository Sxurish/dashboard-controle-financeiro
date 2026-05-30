"use client"
import { useState, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Upload, FileText, ArrowDownCircle, ArrowUpCircle, AlertTriangle,
  CheckCircle2, X, Loader2, ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import { useAccounts } from "@/hooks/use-accounts"
import { useCategories } from "@/hooks/use-categories"
import { parseStatement } from "@/utils/statement-parser"
import { importTransactions, getExistingKeys, type ImportRow } from "@/services/import"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/utils/currency"
import { formatDate } from "@/utils/date"
import { cn } from "@/lib/utils"

type Step = "upload" | "review"

export default function ImportPage() {
  const router = useRouter()
  const { accounts } = useAccounts()
  const { categories } = useCategories()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>("upload")
  const [fileName, setFileName] = useState("")
  const [accountId, setAccountId] = useState("")
  const [rows, setRows] = useState<ImportRow[]>([])
  const [dupKeys, setDupKeys] = useState<Set<string>>(new Set())
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [dragging, setDragging] = useState(false)

  const expenseCategories = categories.filter(c => c.type === "expense")
  const incomeCategories = categories.filter(c => c.type === "income")

  async function handleFile(file: File) {
    if (!accountId) {
      toast.error("Selecione uma conta antes de enviar o arquivo")
      return
    }
    try {
      const content = await file.text()
      const result = parseStatement(file.name, content)

      if (result.entries.length === 0) {
        toast.error("Nenhuma transação encontrada", {
          description: result.errors[0] || "Verifique o formato do arquivo (CSV ou OFX).",
        })
        return
      }

      const importRows: ImportRow[] = result.entries.map(e => ({
        ...e,
        selected: true,
        category_id: null,
      }))

      // Flag duplicates already in the account
      const keys = await getExistingKeys(accountId, importRows.map(r => r.date))
      setDupKeys(keys)

      // Auto-deselect likely duplicates
      importRows.forEach(r => {
        if (keys.has(`${r.date}|${r.amount}|${r.type}`)) r.selected = false
      })

      setFileName(file.name)
      setRows(importRows)
      setParseErrors(result.errors)
      setStep("review")

      const dupCount = importRows.filter(r => keys.has(`${r.date}|${r.amount}|${r.type}`)).length
      toast.success(`${result.entries.length} transações lidas`, {
        description: dupCount > 0 ? `${dupCount} possíveis duplicatas foram desmarcadas.` : `Formato: ${result.format.toUpperCase()}`,
      })
    } catch {
      toast.error("Erro ao ler o arquivo")
    }
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function toggleRow(idx: number) {
    setRows(rs => rs.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r))
  }

  function setRowCategory(idx: number, categoryId: string) {
    setRows(rs => rs.map((r, i) => i === idx ? { ...r, category_id: categoryId === "none" ? null : categoryId } : r))
  }

  function toggleAll(selected: boolean) {
    setRows(rs => rs.map(r => ({ ...r, selected })))
  }

  const selectedRows = rows.filter(r => r.selected)
  const summary = useMemo(() => {
    const income = selectedRows.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0)
    const expense = selectedRows.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0)
    return { income, expense, count: selectedRows.length }
  }, [selectedRows])

  async function handleImport() {
    if (selectedRows.length === 0) { toast.error("Selecione ao menos uma transação"); return }
    setImporting(true)
    try {
      const result = await importTransactions({ account_id: accountId, rows })
      toast.success(`${result.inserted} transações importadas!`, {
        description: "Seus lançamentos já estão disponíveis.",
      })
      router.push("/dashboard/transactions")
    } catch (e) {
      const description = e instanceof Error ? e.message
        : e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message)
        : "Tente novamente."
      toast.error("Erro ao importar", { description })
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setStep("upload")
    setRows([])
    setFileName("")
    setParseErrors([])
    setDupKeys(new Set())
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Importar extrato" description="Importe transações de um arquivo CSV ou OFX do seu banco" />

      {step === "upload" && (
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Account selector */}
            <div className="space-y-1.5 max-w-sm">
              <label className="text-sm font-medium">Conta de destino</label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {accounts.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Você precisa criar uma conta antes de importar.
                </p>
              )}
            </div>

            {/* Dropzone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => accountId && fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer",
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                !accountId && "opacity-50 cursor-not-allowed"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.ofx,.ofc,.txt"
                className="hidden"
                onChange={onFileInput}
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Arraste um arquivo ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground mt-1">
                Formatos suportados: <span className="font-medium">CSV</span> e <span className="font-medium">OFX</span>
              </p>
            </div>

            <div className="bg-muted/40 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Como funciona
              </p>
              <p>• Valores negativos viram <span className="text-red-500">despesas</span>, positivos viram <span className="text-green-500">receitas</span>.</p>
              <p>• Detectamos automaticamente possíveis duplicatas já cadastradas na conta.</p>
              <p>• Você revisa tudo e escolhe categorias antes de confirmar.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Selecionadas</p>
              <p className="text-xl font-bold">{summary.count} <span className="text-sm font-normal text-muted-foreground">/ {rows.length}</span></p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Receitas</p>
              <p className="text-xl font-bold text-green-500">{formatCurrency(summary.income)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Despesas</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(summary.expense)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Arquivo</p>
              <p className="text-sm font-medium truncate" title={fileName}>{fileName}</p>
            </CardContent></Card>
          </div>

          {parseErrors.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm flex gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-600 dark:text-yellow-400">{parseErrors.length} linha(s) ignorada(s)</p>
                <p className="text-muted-foreground text-xs mt-0.5">{parseErrors.slice(0, 3).join(" · ")}{parseErrors.length > 3 ? " …" : ""}</p>
              </div>
            </div>
          )}

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedRows.length === rows.length && rows.length > 0}
                    onCheckedChange={(v) => toggleAll(!!v)}
                  />
                  <span className="text-sm text-muted-foreground">Selecionar todas</span>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="h-4 w-4" /> Cancelar
                </Button>
              </div>

              <div className="divide-y max-h-[480px] overflow-y-auto scrollbar-thin">
                {rows.map((row, idx) => {
                  const isDup = dupKeys.has(`${row.date}|${row.amount}|${row.type}`)
                  const cats = row.type === "expense" ? expenseCategories : incomeCategories
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-3 p-3 transition-colors",
                        row.selected ? "hover:bg-muted/30" : "opacity-50 hover:opacity-80"
                      )}
                    >
                      <Checkbox checked={row.selected} onCheckedChange={() => toggleRow(idx)} />

                      {row.type === "income"
                        ? <ArrowDownCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        : <ArrowUpCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{row.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(row.date)}</p>
                      </div>

                      {isDup && (
                        <Badge variant="outline" className="text-[10px] h-5 text-yellow-600 border-yellow-500/40 bg-yellow-500/10 gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" /> Duplicata?
                        </Badge>
                      )}

                      <Select
                        value={row.category_id ?? "none"}
                        onValueChange={(v) => setRowCategory(idx, v)}
                      >
                        <SelectTrigger className="w-[150px] h-8 text-xs">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem categoria</SelectItem>
                          {cats.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className={cn(
                        "text-sm font-semibold w-28 text-right flex-shrink-0",
                        row.type === "income" ? "text-green-500" : "text-red-500"
                      )}>
                        {row.type === "income" ? "+" : "-"}{formatCurrency(row.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Footer actions */}
          <div className="flex items-center justify-between sticky bottom-0 bg-background/80 backdrop-blur py-3">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {summary.count} transações serão importadas como pagas
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>Voltar</Button>
              <Button onClick={handleImport} disabled={importing || summary.count === 0}>
                {importing ? <><Loader2 className="h-4 w-4 animate-spin" /> Importando…</> : <>Importar {summary.count} <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
