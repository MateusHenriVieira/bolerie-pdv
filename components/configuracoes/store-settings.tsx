"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { storeService } from "@/lib/services/store-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function StoreSettings() {
  const { toast } = useToast()
  const { effectiveBranchId, currentBranch } = useBranch()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    name: "Bolerie",
    address: "",
    phone: "",
    email: "",
    logo: "",
    theme: "light",
  })

  useEffect(() => {
    // Buscar configurações da loja com base na filial atual
    const fetchSettings = async () => {
      try {
        setLoading(true)

        // Usar a nova função getSettings que já lida com filiais e fallbacks
        const storeSettings = await storeService.getSettings(effectiveBranchId)
        if (storeSettings) {
          setSettings(storeSettings)
        }

        setLoading(false)
      } catch (error) {
        console.error("Erro ao buscar configurações:", error)
        setLoading(false)
      }
    }

    fetchSettings()
  }, [effectiveBranchId, currentBranch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveSettings = async () => {
    try {
      if (effectiveBranchId) {
        // Salvar configurações específicas da filial
        await storeService.saveBranchSettings(effectiveBranchId, settings)
        toast({
          title: "Configurações salvas",
          description: `As configurações da filial ${currentBranch?.name || ""} foram atualizadas com sucesso.`,
        })
      } else {
        // Salvar configurações globais (fallback)
        await storeService.saveSettings(settings)
        toast({
          title: "Configurações salvas",
          description: "As configurações globais da loja foram atualizadas com sucesso.",
        })
      }

      // Atualizar o nome exibido na página sem precisar recarregar
      if (typeof window !== "undefined") {
        const storeName = document.querySelectorAll(".store-name")
        storeName.forEach((el) => {
          el.textContent = settings.name
        })
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div>Carregando configurações...</div>
  }

  return (
    <div className="space-y-4">
      {effectiveBranchId ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Configurações da Filial</AlertTitle>
          <AlertDescription>Você está editando as configurações da filial {currentBranch?.name}.</AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Configurações Globais</AlertTitle>
          <AlertDescription>Você está editando as configurações globais da loja.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="store-name">Nome da Loja</Label>
        <Input id="store-name" name="name" value={settings.name} onChange={handleInputChange} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="store-address">Endereço</Label>
        <Textarea id="store-address" name="address" value={settings.address} onChange={handleInputChange} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="store-phone">Telefone</Label>
        <Input id="store-phone" name="phone" value={settings.phone} onChange={handleInputChange} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="store-email">Email</Label>
        <Input id="store-email" name="email" value={settings.email} onChange={handleInputChange} />
      </div>

      <Button onClick={handleSaveSettings}>Salvar Alterações</Button>
    </div>
  )
}
