"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Building,
  ChevronDown,
  LogOut,
  Settings,
  Sun,
  Moon,
  User,
  CakeIcon,
  Users,
  Package,
  CalendarClock,
  ShoppingCart,
  LayoutGrid,
} from "lucide-react"
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/firebase/auth"
import { useBranch } from "@/lib/contexts/branch-context"
import { NotificationsPopover } from "@/components/notifications-popover"
import { UserProfileModal } from "@/components/user-profile-modal"
import { storeService } from "@/lib/services/store-service"
import { useToast } from "@/hooks/use-toast"

export function SiteHeader() {
  const { setTheme } = useTheme()
  const { user, userData, isAdmin, isOwner, signOut } = useAuth() // Alterado de logout para signOut
  const { currentBranch, branches, setCurrentBranch } = useBranch()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [storeName, setStoreName] = useState("Bolerie")
  const { toast } = useToast()

  // Estados para controlar os dropdowns
  const [branchMenuOpen, setBranchMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  useEffect(() => {
    const fetchStoreName = async () => {
      try {
        const settings = await storeService.getSettings()
        if (settings && settings.name) {
          setStoreName(settings.name)
        }
      } catch (error) {
        console.error("Erro ao buscar nome da loja:", error)
      }
    }

    fetchStoreName()
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isLoginPage = pathname === "/login"

  const handleLogout = async () => {
    try {
      await signOut() // Alterado de logout para signOut
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const handleChangeBranch = (branch) => {
    if (currentBranch?.id === branch.id) {
      return // Não faz nada se já estiver na filial selecionada
    }

    toast({
      title: "Alterando filial",
      description: `Carregando dados da filial ${branch.name}...`,
      duration: 3000,
    })

    // Fechar o menu
    setBranchMenuOpen(false)

    // Pequeno delay para mostrar o toast antes de recarregar
    setTimeout(() => {
      setCurrentBranch(branch)

      // Redireciona para o dashboard para atualizar os dados
      if (pathname !== "/dashboard") {
        router.push("/dashboard")
      } else {
        // Se já estiver no dashboard, recarrega a página
        window.location.reload()
      }
    }, 500)
  }

  // Adicionando "Configurações" à navegação principal
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { name: "Vendas", href: "/vendas", icon: ShoppingCart },
    { name: "Reservas", href: "/reservas", icon: CalendarClock },
    { name: "Estoque", href: "/estoque", icon: Package },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Configurações", href: "/configuracoes", icon: Settings },
  ]

  // Opções de submenu para configurações (usado apenas no mobile)
  const configOptions = [
    { name: "Geral", href: "/configuracoes" },
    { name: "Produtos", href: "/configuracoes?tab=products" },
    { name: "Usuários", href: "/configuracoes?tab=users" },
    { name: "Impressoras", href: "/configuracoes?tab=printers" },
    { name: "Filiais", href: "/configuracoes?tab=branches" },
    { name: "Funcionários", href: "/configuracoes?tab=employees" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2 mr-4">
          <Link href="/" className="flex items-center space-x-2">
            <CakeIcon className="h-6 w-6 text-primary" />
            <span className="font-bold store-name">{storeName}</span>
          </Link>
        </div>

        {!isLoginPage && (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === item.href
                      ? "text-primary"
                      : pathname.startsWith(item.href + "/")
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetContent side="left" className="pr-0">
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center">
                    <CakeIcon className="h-6 w-6 text-primary mr-2" />
                    <span className="store-name">{storeName}</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4">
                  {navigation.slice(0, 6).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-sm font-medium transition-colors hover:text-primary flex items-center ${
                        pathname === item.href
                          ? "text-primary"
                          : pathname.startsWith(item.href + "/")
                            ? "text-primary"
                            : "text-muted-foreground"
                      }`}
                    >
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      {item.name}
                    </Link>
                  ))}

                  <div className="pt-4 border-t">
                    <h3 className="mb-2 text-sm font-medium">Configurações</h3>
                    <div className="space-y-2">
                      {configOptions.map((option) => (
                        <Link
                          key={option.name}
                          href={option.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="text-sm font-medium transition-colors hover:text-primary flex items-center text-muted-foreground"
                        >
                          {option.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start px-2 mt-4 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </Button>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>

            <div className="flex-1" />

            {/* User Actions */}
            <div className="flex items-center gap-2">
              {/* Botão de Perfil do Usuário */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full cursor-pointer"
                  onClick={() => setIsProfileModalOpen(true)}
                  aria-label="Perfil do usuário"
                >
                  <User className="h-5 w-5" />
                </Button>
              )}
              {/* Botão de Logout */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 cursor-pointer"
                  onClick={handleLogout}
                  aria-label="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}

              {/* Seletor de Filial */}
              {user && (isAdmin || isOwner) && (
                <DropdownMenu open={branchMenuOpen} onOpenChange={setBranchMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => setBranchMenuOpen(true)}
                    >
                      <Building className="h-4 w-4" />
                      <span className="hidden sm:inline-block max-w-[100px] truncate">
                        {currentBranch?.name || "Selecionar Filial"}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Selecione uma Filial</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {branches && branches.length > 0 ? (
                      branches.map((branch) => (
                        <DropdownMenuItem
                          key={branch.id}
                          onClick={() => handleChangeBranch(branch)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-2" />
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
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhuma filial encontrada</div>
                    )}
                    {(isAdmin || isOwner) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href="/configuracoes/filiais" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Gerenciar Filiais</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Notificações */}
              {user && <NotificationsPopover />}

              {/* Tema */}
              <DropdownMenu open={themeMenuOpen} onOpenChange={setThemeMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 cursor-pointer"
                    onClick={() => setThemeMenuOpen(true)}
                  >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setTheme("light")
                      setThemeMenuOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    Claro
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setTheme("dark")
                      setThemeMenuOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    Escuro
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setTheme("system")
                      setThemeMenuOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    Sistema
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
        {/* Modal de Perfil do Usuário */}
        {user && <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />}
      </div>
    </header>
  )
}
