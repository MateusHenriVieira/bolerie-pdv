import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/firebase/auth"
import { BranchProvider } from "@/lib/contexts/branch-context"
import { FirebaseInitializer } from "@/components/firebase-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Doce Sabor - Sistema PDV",
  description: "Sistema de Ponto de Venda para confeitaria",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <BranchProvider>
              <FirebaseInitializer />
              <div className="relative flex min-h-screen flex-col">
                <SiteHeader />
                <div className="flex-1">{children}</div>
                <SiteFooter />
              </div>
              <Toaster />
            </BranchProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
