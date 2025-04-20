"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserSettings } from "@/components/configuracoes/user-settings"
import { useBranch } from "@/lib/contexts/branch-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function UsuariosPage() {
  const { currentBranch, loading } = useBranch()

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!currentBranch) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Nenhuma filial selecionada. Por favor, selecione uma filial para gerenciar usuários.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os usuários do sistema para a filial: {currentBranch.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Adicione, edite e remova usuários que têm acesso à filial {currentBranch.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserSettings />
        </CardContent>
      </Card>
    </div>
  )
}
