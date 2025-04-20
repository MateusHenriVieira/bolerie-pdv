"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutGrid, ShoppingCart, CalendarClock, Package, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()

  // Não mostrar em páginas de login
  if (pathname === "/login") return null

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { name: "Vendas", href: "/vendas", icon: ShoppingCart },
    { name: "Reservas", href: "/reservas", icon: CalendarClock },
    { name: "Estoque", href: "/estoque", icon: Package },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Config", href: "/configuracoes", icon: Settings },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t flex items-center justify-around px-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs",
              isActive ? "text-primary" : "text-muted-foreground hover:text-primary",
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span>{item.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
