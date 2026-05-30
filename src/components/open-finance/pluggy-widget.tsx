"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Landmark, Loader2 } from "lucide-react"

interface PluggyWidgetProps {
  onSuccess: (connectionId: string) => void
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PluggyConnect: new (config: Record<string, unknown>) => { init(): void }
  }
}

export function PluggyConnectButton({ onSuccess }: PluggyWidgetProps) {
  const [loading, setLoading] = useState(false)
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (scriptLoaded.current || document.getElementById("pluggy-connect-script")) {
      scriptLoaded.current = true
      return
    }
    const s = document.createElement("script")
    s.id = "pluggy-connect-script"
    s.src = "https://cdn.pluggy.ai/pluggy-connect/v2/pluggy-connect.js"
    s.async = true
    s.onload = () => { scriptLoaded.current = true }
    document.head.appendChild(s)
  }, [])

  const open = useCallback(async () => {
    setLoading(true)
    try {
      const tokenRes = await fetch("/api/pluggy/connect-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      if (!tokenRes.ok) {
        const err = await tokenRes.json()
        toast.error(err.error || "Erro ao iniciar conexão")
        return
      }
      const { token } = await tokenRes.json()

      await new Promise<void>((resolve) => {
        const wait = () => {
          if (window.PluggyConnect) return resolve()
          setTimeout(wait, 100)
        }
        wait()
      })

      const widget = new window.PluggyConnect({
        connectToken: token,
        onSuccess: async ({ item }: { item: { id: string } }) => {
          try {
            const cbRes = await fetch("/api/pluggy/callback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemId: item.id }),
            })
            const cbData = await cbRes.json()
            if (!cbRes.ok) throw new Error(cbData.error || "Erro ao salvar conexão")
            toast.success("Banco conectado com sucesso!")
            onSuccess(cbData.connectionId)
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao finalizar conexão")
          }
        },
        onError: (err: { message?: string }) => {
          toast.error(err?.message || "Erro ao conectar banco")
        },
        onClose: () => setLoading(false),
      })
      widget.init()
    } catch {
      toast.error("Erro ao abrir conexão bancária")
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return (
    <Button onClick={open} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Landmark className="h-4 w-4" />}
      Conectar banco
    </Button>
  )
}
