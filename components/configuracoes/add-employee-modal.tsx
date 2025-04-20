"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { employeeService, branchService } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import type { Employee } from "@/lib/services/employee-service"
import type { Branch } from "@/lib/services/branch-service"

interface AddEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: any) => void
  editingEmployee: Employee | null
}

export function AddEmployeeModal({ isOpen, onClose, onAdd, editingEmployee }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    hireDate: "",
    salary: "",
    paymentDay: "",
    role: "",
    branchId: "",
    address: "",
    isActive: true,
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const fetchedBranches = await branchService.getAll()
        setBranches(fetchedBranches)
      } catch (error) {
        console.error("Erro ao buscar filiais:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as filiais. Tente novamente.",
          variant: "destructive",
        })
      }
    }

    fetchBranches()
  }, [toast])

  useEffect(() => {
    if (editingEmployee) {
      setFormData({
        name: editingEmployee.name,
        age: editingEmployee.age.toString(),
        hireDate: formatDateForInput(editingEmployee.hireDate),
        salary: editingEmployee.salary.toString(),
        paymentDay: editingEmployee.paymentDay.toString(),
        role: editingEmployee.role,
        branchId: editingEmployee.branchId,
        address: editingEmployee.address,
        isActive: editingEmployee.isActive,
      })
    } else {
      setFormData({
        name: "",
        age: "",
        hireDate: formatDateForInput(new Date()),
        salary: "",
        paymentDay: "",
        role: "",
        branchId: "",
        address: "",
        isActive: true,
      })
    }
  }, [editingEmployee, isOpen])

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar dados
      if (!formData.name || !formData.age || !formData.hireDate || !formData.salary || !formData.branchId) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const employeeData = {
        name: formData.name,
        age: Number.parseInt(formData.age),
        hireDate: new Date(formData.hireDate),
        salary: Number.parseFloat(formData.salary),
        paymentDay: Number.parseInt(formData.paymentDay),
        role: formData.role,
        branchId: formData.branchId,
        address: formData.address,
        isActive: formData.isActive,
      }

      let employeeId: string

      if (editingEmployee) {
        // Atualizar funcionário existente
        await employeeService.update(editingEmployee.id, employeeData)
        employeeId = editingEmployee.id
        toast({
          title: "Funcionário atualizado",
          description: `O funcionário ${formData.name} foi atualizado com sucesso.`,
        })
      } else {
        // Adicionar novo funcionário
        employeeId = await employeeService.add(employeeData)
        toast({
          title: "Funcionário adicionado",
          description: `O funcionário ${formData.name} foi adicionado com sucesso.`,
        })
      }

      // Chamar callback
      onAdd({ id: employeeId, ...employeeData })
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o funcionário. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "Editar Funcionário" : "Adicionar Funcionário"}</DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? "Edite os dados do funcionário selecionado."
                : "Preencha os dados para adicionar um novo funcionário."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="16"
                  value={formData.age}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hireDate">Data de Contratação</Label>
                <Input
                  id="hireDate"
                  name="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="salary">Salário (R$)</Label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salary}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentDay">Dia de Pagamento</Label>
                <Input
                  id="paymentDay"
                  name="paymentDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.paymentDay}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Função</Label>
                <Input id="role" name="role" value={formData.role} onChange={handleChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branchId">Filial</Label>
                <Select value={formData.branchId} onValueChange={(value) => handleSelectChange("branchId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="isActive">Funcionário Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingEmployee ? "Salvar Alterações" : "Adicionar Funcionário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
