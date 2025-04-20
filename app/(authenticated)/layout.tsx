import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <MobileNav />
      </div>
    </AuthGuard>
  )
}
