"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BranchTable } from "@/components/configuracoes/branch-table"
import { AddBranchModal } from "@/components/configuracoes/add-branch-modal"
import { useToast } from "@/hooks/use-toast"
import type { Branch } from "@/lib/services/branch-service"

export default function FiliaisPage() {
  const { toast } = useToast()
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleAddBranch = () => {
    setEditingBranch(null)
    setIsAddBranchModalOpen(true)
  }

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch)
    setIsAddBranchModalOpen(true)
  }

  const handleSaveBranch = () => {
    setIsAddBranchModalOpen(false)
    setEditingBranch(null)
    // A notificação é exibida no componente do modal
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Filiais</h1>
      <p className="text-muted-foreground">Cadastre e gerencie as filiais da sua rede de confeitarias.</p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Filiais Cadastradas</CardTitle>
          <Button onClick={handleAddBranch}>Adicionar Filial</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="search-branches">Buscar filiais</Label>
              <Input
                id="search-branches"
                placeholder="Digite o nome ou endereço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="mt-8" variant="outline">
              Buscar
            </Button>
          </div>

          <BranchTable searchQuery={searchQuery} onEdit={handleEditBranch} />
        </CardContent>
      </Card>

      <AddBranchModal
        isOpen={isAddBranchModalOpen}
        onClose={() => setIsAddBranchModalOpen(false)}
        onAdd={handleSaveBranch}
        editingBranch={editingBranch}
      />
    </div>
  )
}
