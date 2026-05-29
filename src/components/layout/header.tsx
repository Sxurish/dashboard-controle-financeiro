"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, Bell, Sun, Moon, Monitor, LogOut, User } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<{ email?: string; full_name?: string; avatar_url?: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name,
          avatar_url: data.user.user_metadata?.avatar_url,
        })
      }
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success("Saiu com sucesso")
    router.push("/login")
    router.refresh()
  }

  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U"

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 lg:flex-none" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ThemeIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4" /> Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="h-4 w-4" /> Escuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="h-4 w-4" /> Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-2 gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback
                  className="text-xs text-white"
                  style={{ background: 'linear-gradient(135deg, #FF6B00, #E91E8C, #7B2FBE)' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                {user?.full_name || user?.email?.split("@")[0] || "Usuário"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="space-y-1">
                <p className="text-sm font-medium">{user?.full_name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <User className="h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
