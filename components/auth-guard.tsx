"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth"
import { FirebaseInitializer } from "@/components/firebase-initializer"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Se não estiver carregando e não houver usuário, redirecionar para login
    if (!loading && !user) {
      router.push("/login")
    } else if (!loading && user) {
      setIsAuthorized(true)
    }
  }, [user, loading, router, pathname])

  // Mostrar nada enquanto verifica a autenticação
  if (loading || !isAuthorized) {
    return null
  }

  return (
    <>
      <FirebaseInitializer />
      {children}
    </>
  )
}
