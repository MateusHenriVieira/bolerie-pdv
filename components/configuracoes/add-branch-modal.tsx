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
import { branchService } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import type { Branch } from "@/lib/services/branch-service"

interface AddBranchModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: any) => void
  editingBranch: Branch | null
}

export function AddBranchModal({ isOpen, onClose, onAdd, editingBranch }: AddBranchModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    manager: "",
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (editingBranch) {
      setFormData({
        name: editingBranch.name,
        address: editingBranch.address,
        phone: editingBranch.phone,
        email: editingBranch.email,
        manager: editingBranch.manager,
        isActive: editingBranch.isActive,
      })
    } else {
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        manager: "",
        isActive: true,
      })
    }
  }, [editingBranch, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
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
      if (!formData.name || !formData.address || !formData.phone) {
        toast({
          title: "Campos obrigatórios",
          description: "Nome, endereço e telefone são campos obrigatórios.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      let branchId: string

      if (editingBranch) {
        // Atualizar filial existente
        await branchService.update(editingBranch.id, formData)
        branchId = editingBranch.id
        toast({
          title: "Filial atualizada",
          description: `A filial ${formData.name} foi atualizada com sucesso.`,
        })
      } else {
        // Adicionar nova filial
        branchId = await branchService.add(formData)
        toast({
          title: "Filial adicionada",
          description: `A filial ${formData.name} foi adicionada com sucesso.`,
        })
      }

      // Chamar callback
      onAdd({ id: branchId, ...formData })
    } catch (error) {
      console.error("Erro ao salvar filial:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a filial. Tente novamente.",
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
            <DialogTitle>{editingBranch ? "Editar Filial" : "Adicionar Filial"}</DialogTitle>
            <DialogDescription>
              {editingBranch
                ? "Edite os dados da filial selecionada."
                : "Preencha os dados para adicionar uma nova filial."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Filial</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manager">Gerente Responsável</Label>
              <Input id="manager" name="manager" value={formData.manager} onChange={handleChange} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="isActive">Filial Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingBranch ? "Salvar Alterações" : "Adicionar Filial"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
