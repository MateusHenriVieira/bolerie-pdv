"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { customerService } from "@/lib/services/customer-service"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function MigrateCustomersButton() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleMigration = async () => {
    if (
      !confirm("Tem certeza que deseja migrar os clientes para a nova estrutura? Este processo pode levar algum tempo.")
    ) {
      return
    }

    setIsMigrating(true)
    setError(null)
    setMigrationComplete(false)

    try {
      await customerService.migrateCustomers()
      setMigrationComplete(true)
      toast({
        title: "Migração concluída",
        description: "Todos os clientes foram migrados para a nova estrutura com sucesso.",
      })
    } catch (err) {
      console.error("Erro na migração:", err)
      setError("Ocorreu um erro durante a migração. Verifique o console para mais detalhes.")
      toast({
        title: "Erro na migração",
        description: "Não foi possível migrar todos os clientes. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleMigration}
        disabled={isMigrating || migrationComplete}
        variant="outline"
        className="w-full"
      >
        {isMigrating
          ? "Migrando clientes..."
          : migrationComplete
            ? "Migração concluída"
            : "Migrar clientes para nova estrutura"}
      </Button>

      {migrationComplete && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Migração concluída</AlertTitle>
          <AlertDescription>
            Todos os clientes foram migrados com sucesso para a nova estrutura de dados.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro na migração</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
