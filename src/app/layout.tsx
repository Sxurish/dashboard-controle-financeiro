import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { Toaster } from "sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: "Kaivo — by HSB Company",
    template: "%s | Kaivo",
  },
  description: "Kaivo, por HSB Company. Gerencie suas finanças com inteligência. Controle receitas, despesas, metas e muito mais.",
  keywords: ["finanças", "controle financeiro", "dashboard", "receitas", "despesas", "orçamento", "HSB Company", "Kaivo"],
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
        </ThemeProvider>
      </body>
    </html>
  )
}
