"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EmployeeTable } from "@/components/configuracoes/employee-table"
import { AddEmployeeModal } from "@/components/configuracoes/add-employee-modal"
import { useToast } from "@/hooks/use-toast"
import type { Employee } from "@/lib/services/employee-service"

export default function FuncionariosPage() {
  const { toast } = useToast()
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleAddEmployee = () => {
    setEditingEmployee(null)
    setIsAddEmployeeModalOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsAddEmployeeModalOpen(true)
  }

  const handleSaveEmployee = () => {
    setIsAddEmployeeModalOpen(false)
    setEditingEmployee(null)
    // A notificação é exibida no componente do modal
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Funcionários</h1>
      <p className="text-muted-foreground">Cadastre e gerencie os funcionários da sua rede de confeitarias.</p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Funcionários Cadastrados</CardTitle>
          <Button onClick={handleAddEmployee}>Adicionar Funcionário</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="search-employees">Buscar funcionários</Label>
              <Input
                id="search-employees"
                placeholder="Digite o nome ou função..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="mt-8" variant="outline">
              Buscar
            </Button>
          </div>

          <EmployeeTable searchQuery={searchQuery} onEdit={handleEditEmployee} />
        </CardContent>
      </Card>

      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        onAdd={handleSaveEmployee}
        editingEmployee={editingEmployee}
      />
    </div>
  )
}
