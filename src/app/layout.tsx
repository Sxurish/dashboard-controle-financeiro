import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { Toaster } from "sonner"
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FF6B00' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: "Kaivo — by HSB Company",
    template: "%s | Kaivo",
  },
  description: "Kaivo, por HSB Company. Gerencie suas finanças com inteligência. Controle receitas, despesas, metas e muito mais.",
  keywords: ["finanças", "controle financeiro", "dashboard", "receitas", "despesas", "orçamento", "HSB Company", "Kaivo"],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kaivo',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
          <ServiceWorkerRegistrar />
        </ThemeProvider>
      </body>
    </html>
  )
}
