"use client"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { User, Save, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<{ full_name?: string; email?: string; avatar_url?: string } | null>(null)

  const { register, handleSubmit, reset } = useForm<{ full_name: string }>()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const u = {
          full_name: data.user.user_metadata?.full_name || "",
          email: data.user.email,
          avatar_url: data.user.user_metadata?.avatar_url,
        }
        setUserData(u)
        reset({ full_name: u.full_name })
      }
    })
  }, [reset])

  async function onSubmit({ full_name }: { full_name: string }) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ data: { full_name } })
    if (error) {
      toast.error("Erro ao salvar", { description: error.message })
    } else {
      toast.success("Perfil atualizado!")
      setUserData(prev => prev ? { ...prev, full_name } : prev)
    }
    setLoading(false)
  }

  const initials = userData?.full_name
    ? userData.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : userData?.email?.[0]?.toUpperCase() || "U"

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title="Configurações" description="Gerencie seu perfil e preferências" />

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userData?.avatar_url} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{userData?.full_name || "Usuário"}</p>
              <p className="text-sm text-muted-foreground">{userData?.email}</p>
            </div>
          </div>

          <Separator />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input placeholder="Seu nome" {...register("full_name")} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={userData?.email || ""} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado por aqui.</p>
            </div>
            <Button type="submit" disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferências</CardTitle>
          <CardDescription>Personalize sua experiência</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notificações</p>
              <p className="text-xs text-muted-foreground">Receber alertas de contas a vencer</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Moeda</p>
              <p className="text-xs text-muted-foreground">Real Brasileiro (BRL)</p>
            </div>
            <span className="text-sm font-medium">R$</span>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zona de perigo</CardTitle>
          <CardDescription>Ações irreversíveis para sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Excluir conta</p>
              <p className="text-xs text-muted-foreground">Remove permanentemente todos os seus dados</p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Em breve
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
