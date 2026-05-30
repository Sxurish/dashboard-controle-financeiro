'use client'
import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'kaivo:pwa-install-dismissed'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream
    setIsStandalone(standalone)
    setIsIOS(ios)

    const wasDismissed = localStorage.getItem(DISMISSED_KEY)
    if (!wasDismissed) setDismissed(false)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      if (!localStorage.getItem(DISMISSED_KEY)) setDismissed(false)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDismissed(true)
    setDeferredPrompt(null)
  }

  if (isStandalone || dismissed) return null
  if (!isIOS && !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div
        className="rounded-2xl p-4 shadow-2xl border border-white/10 text-white"
        style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.95), rgba(123,47,190,0.95))' }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-lg">K</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Instalar Kaivo</p>
            {isIOS ? (
              <p className="text-xs text-white/80 mt-0.5">
                Toque em <Share className="inline h-3 w-3" /> e depois "Adicionar à Tela Início"
              </p>
            ) : (
              <p className="text-xs text-white/80 mt-0.5">
                Instale o app para acesso rápido offline
              </p>
            )}
          </div>
          <button onClick={dismiss} className="text-white/70 hover:text-white flex-shrink-0 -mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>
        {!isIOS && deferredPrompt && (
          <Button
            onClick={install}
            size="sm"
            className="w-full mt-3 bg-white text-orange-600 hover:bg-white/90 border-0 font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Instalar agora
          </Button>
        )}
      </div>
    </div>
  )
}
