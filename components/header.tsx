"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Building, ChevronDown, LogOut, Moon, Settings, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/firebase/auth"
import { useBranch } from "@/lib/contexts/branch-context"
import { useNotifications } from "@/lib/contexts/notifications-context"
import { NotificationsPopover } from "@/components/notifications-popover"
import { UserProfileModal } from "@/components/user-profile-modal"
import { storeService } from "@/lib/services/store-service"
import { useToast } from "@/hooks/use-toast"
import { branchService } from "@/lib/services/branch-service"
import type { Branch } from "@/lib/services/branch-service"
import Link from "next/link"

export function Header() {
  const { setTheme } = useTheme()
  const { user, logout } = useAuth()
  const { currentBranch, branches, setCurrentBranch } = useBranch()
  const { notifications } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [storeName, setStoreName] = useState("Bolerie")
  const [allBranches, setAllBranches] = useState<Branch[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(true)
  const [branchMenuOpen, setBranchMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [navMenuOpen, setNavMenuOpen] = useState(false)

  // Verificar se a página atual é uma das páginas onde o header deve ser removido
  const shouldHideHeader = ["/vendas", "/reservas", "/clientes", "/configuracoes"].some((path) =>
    pathname?.startsWith(path),
  )

  // Se estiver em uma das páginas especificadas, não renderizar o header
  if (shouldHideHeader) {
    return null
  }

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const fetchStoreName = useCallback(async () => {
    try {
      // Se houver uma filial selecionada, buscar as configurações específicas da filial
      if (currentBranch?.id) {
        console.log(`Buscando nome da loja para a filial: ${currentBranch.id}`)
        const settings = await storeService.getSettings(currentBranch.id)
        if (settings && settings.name) {
          setStoreName(settings.name)
          console.log(`Nome da loja definido como: ${settings.name}`)
        }
      } else {
        // Se não houver filial selecionada, buscar as configurações globais
        console.log("Buscando nome da loja global")
        const settings = await storeService.getGlobalSettings()
        if (settings && settings.name) {
          setStoreName(settings.name)
          console.log(`Nome da loja definido como: ${settings.name}`)
        }
      }
    } catch (error) {
      console.error("Erro ao buscar nome da loja:", error)
    }
  }, [currentBranch])

  useEffect(() => {
    fetchStoreName()
  }, [fetchStoreName])

  // Buscar todas as filiais
  const fetchBranches = useCallback(async () => {
    try {
      setIsLoadingBranches(true)
      console.log("Buscando todas as filiais para o seletor")
      const fetchedBranches = await branchService.getAll()
      console.log(`Encontradas ${fetchedBranches.length} filiais`)
      setAllBranches(fetchedBranches)
      setIsLoadingBranches(false)
    } catch (error) {
      console.error("Erro ao buscar filiais:", error)
      setIsLoadingBranches(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchBranches()
    }
  }, [user, fetchBranches])

  if (!mounted) {
    return null
  }

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(currentTime)

  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime)

  const handleLogout = async () => {
    try {
      console.log("Realizando logout")
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const handleBranchChange = (branch: Branch) => {
    // Se já estiver na filial selecionada, não faz nada
    if (currentBranch?.id === branch.id) {
      console.log(`Filial ${branch.name} já está selecionada`)
      return
    }

    console.log(`Alterando filial para: ${branch.name} (${branch.id})`)

    // Atualizar a filial no contexto
    setCurrentBranch(branch)

    // Fechar o menu
    setBranchMenuOpen(false)

    // Mostrar feedback ao usuário
    toast({
      title: "Filial alterada",
      description: `Você está agora visualizando dados da filial ${branch.name}`,
      duration: 3000,
    })

    // Recarregar a página para atualizar todos os dados
    window.location.reload()
  }

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length

  // Links de navegação
  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/vendas", label: "Vendas" },
    { href: "/reservas", label: "Reservas" },
    { href: "/estoque", label: "Estoque" },
    { href: "/clientes", label: "Clientes" },
    { href: "/relatorios", label: "Relatórios" },
    { href: "/configuracoes", label: "Configurações" },
  ]

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo e nome da loja */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-xl">{storeName}</span>
          </Link>

          {/* Links de navegação horizontal */}
          <nav className="hidden md:flex items-center space-x-4 ml-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Menu de navegação móvel */}
        <Sheet open={navMenuOpen} onOpenChange={setNavMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="p-6">
              <Link href="/dashboard" className="flex items-center gap-2 mb-6">
                <span className="font-bold text-xl">{storeName}</span>
              </Link>
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium p-2 hover:bg-accent rounded-md transition-colors"
                    onClick={() => setNavMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          {/* Data e hora */}
          <div className="hidden md:block">
            <p className="text-sm text-muted-foreground">
              {formattedDate} | {formattedTime}
            </p>
          </div>

          {/* Seletor de Filial */}
          <DropdownMenu open={branchMenuOpen} onOpenChange={setBranchMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setBranchMenuOpen(true)}
              >
                <Building className="h-4 w-4" />
                <span className="hidden md:inline-block">{currentBranch?.name || "Selecionar Filial"}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]" onEscapeKeyDown={() => setBranchMenuOpen(false)}>
              <DropdownMenuLabel>Selecione uma Filial</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoadingBranches ? (
                <DropdownMenuItem disabled>Carregando filiais...</DropdownMenuItem>
              ) : allBranches.length === 0 ? (
                <DropdownMenuItem disabled>Nenhuma filial cadastrada</DropdownMenuItem>
              ) : (
                allBranches.map((branch) => (
                  <DropdownMenuItem
                    key={branch.id}
                    onClick={() => handleBranchChange(branch)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{branch.name}</span>
                      </div>
                      {currentBranch?.id === branch.id && (
                        <Badge variant="outline" className="ml-2 bg-primary/10">
                          Atual
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notificações */}
          <NotificationsPopover />

          {/* Tema */}
          <DropdownMenu open={themeMenuOpen} onOpenChange={setThemeMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="cursor-pointer" onClick={() => setThemeMenuOpen(true)}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onEscapeKeyDown={() => setThemeMenuOpen(false)}>
              <DropdownMenuItem
                onClick={() => {
                  setTheme("light")
                  setThemeMenuOpen(false)
                }}
                className="cursor-pointer"
              >
                Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTheme("dark")
                  setThemeMenuOpen(false)
                }}
                className="cursor-pointer"
              >
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setTheme("system")
                  setThemeMenuOpen(false)
                }}
                className="cursor-pointer"
              >
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Perfil do Usuário */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full cursor-pointer"
            onClick={() => setIsProfileModalOpen(true)}
            aria-label="Perfil do usuário"
          >
            <Avatar>
              <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
              <AvatarFallback>{user?.displayName?.substring(0, 2) || "US"}</AvatarFallback>
            </Avatar>
          </Button>

          {/* Botão de Logout */}
          <Button variant="ghost" size="icon" className="cursor-pointer" onClick={handleLogout} aria-label="Sair">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {/* Modal de Perfil do Usuário */}
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </header>
  )
}
