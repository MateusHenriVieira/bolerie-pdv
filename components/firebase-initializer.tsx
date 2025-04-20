"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { storeService } from "@/lib/services/store-service"
import { useBranch } from "@/lib/contexts/branch-context"

export function FirebaseInitializer() {
  const { toast } = useToast()
  const [initialized, setInitialized] = useState(false)
  const [storeName, setStoreName] = useState("")
  const { currentBranch } = useBranch()

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

    const initialize = async () => {
      if (!initialized) {
        await fetchStoreName()

        // Removendo a exibição do toast de boas-vindas
        // toast({
        //   title: "Sistema inicializado",
        //   description: `Bem-vindo ao PDV ${storeName || "Bolerie"}${currentBranch ? ` - Filial ${currentBranch.name}` : ""}!`,
        // })

        setInitialized(true)
      }
    }

    initialize()
  }, [initialized, toast, storeName, currentBranch])

  return null
}
