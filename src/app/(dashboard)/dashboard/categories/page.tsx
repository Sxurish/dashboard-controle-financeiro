"use client"
import { useState } from "react"
import { Plus, Tag, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useCategories } from "@/hooks/use-categories"
import { createCategory, updateCategory, deleteCategory } from "@/services/categories"
import { categorySchema, type CategoryFormValues } from "@/schemas/category.schema"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Category } from "@/types/app"
import { cn } from "@/lib/utils"

const CATEGORY_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#64748b", "#84cc16",
]

const CATEGORY_ICONS = [
  "utensils", "car", "home", "heart", "book-open", "gamepad-2",
  "repeat", "shirt", "smartphone", "briefcase", "trending-up",
  "shopping-bag", "paw-print", "gift", "tag", "star",
]

export default function CategoriesPage() {
  const { categories, loading, reload } = useCategories()
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { type: "expense", color: CATEGORY_COLORS[0], icon: CATEGORY_ICONS[0] },
  })

  const selectedColor = watch("color")
  const selectedIcon = watch("icon")

  function openEdit(cat: Category) {
    setEditingCategory(cat)
    reset({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon })
    setShowForm(true)
  }

  function openNew() {
    setEditingCategory(null)
    reset({ type: "expense", color: CATEGORY_COLORS[0], icon: CATEGORY_ICONS[0] })
    setShowForm(true)
  }

  async function onSubmit(values: CategoryFormValues) {
    setSaving(true)
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, values)
        toast.success("Categoria atualizada!")
      } else {
        await createCategory(values)
        toast.success("Categoria criada!")
      }
      setShowForm(false)
      reload()
    } catch {
      toast.error("Erro ao salvar categoria")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingId) return
    try {
      await deleteCategory(deletingId)
      toast.success("Categoria excluída")
      reload()
    } catch {
      toast.error("Não é possível excluir categorias do sistema ou categorias em uso")
    } finally {
      setDeletingId(null)
    }
  }

  const userCategories = categories.filter(c => c.user_id !== null)
  const systemCategories = categories.filter(c => c.user_id === null)

  function CategoryList({ items }: { items: Category[] }) {
    if (items.length === 0) return (
      <p className="text-center text-muted-foreground text-sm py-8">
        Nenhuma categoria nesta seção
      </p>
    )
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(cat => (
          <div
            key={cat.id}
            className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-all"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              {cat.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{cat.name}</p>
              <Badge variant={cat.type === "income" ? "income" : "expense"} className="text-[10px] mt-0.5">
                {cat.type === "income" ? "Receita" : "Despesa"}
              </Badge>
            </div>
            {cat.user_id && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingId(cat.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Categorias" description="Organize seus lançamentos por categoria">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nova categoria
        </Button>
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todas ({categories.length})</TabsTrigger>
            <TabsTrigger value="mine">Minhas ({userCategories.length})</TabsTrigger>
            <TabsTrigger value="system">Sistema ({systemCategories.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <CategoryList items={categories} />
          </TabsContent>
          <TabsContent value="mine" className="mt-4">
            {userCategories.length === 0 ? (
              <EmptyState icon={Tag} title="Nenhuma categoria personalizada" description="Crie suas próprias categorias para organizar melhor seus lançamentos.">
                <Button onClick={openNew}><Plus className="h-4 w-4" />Criar categoria</Button>
              </EmptyState>
            ) : (
              <CategoryList items={userCategories} />
            )}
          </TabsContent>
          <TabsContent value="system" className="mt-4">
            <p className="text-xs text-muted-foreground mb-4">
              Categorias padrão do sistema — disponíveis para todos os usuários. Não podem ser editadas ou excluídas.
            </p>
            <CategoryList items={systemCategories} />
          </TabsContent>
        </Tabs>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCategory ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Ex: Alimentação" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select defaultValue={editingCategory?.type || "expense"} onValueChange={v => setValue("type", v as "income" | "expense")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense"><span className="flex items-center gap-2"><ArrowDownCircle className="h-4 w-4 text-red-500" />Despesa</span></SelectItem>
                  <SelectItem value="income"><span className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-green-500" />Receita</span></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map(color => (
                  <button key={color} type="button" onClick={() => setValue("color", color)} className={cn("w-7 h-7 rounded-full border-2 transition-all", selectedColor === color ? "border-foreground scale-110" : "border-transparent")} style={{ backgroundColor: color }} />
                ))}
              </div>
              {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
            </div>

            <Input type="hidden" {...register("icon")} value={CATEGORY_ICONS[0]} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : editingCategory ? "Atualizar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir categoria</AlertDialogTitle><AlertDialogDescription>Tem certeza? Os lançamentos desta categoria ficarão sem categoria.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
