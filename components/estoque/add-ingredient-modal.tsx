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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ingredientService, branchService } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import type { Branch } from "@/lib/services/branch-service"

interface AddIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: any) => void
}

export function AddIngredientModal({ isOpen, onClose, onAdd }: AddIngredientModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "kg",
    minQuantity: "",
    cost: "",
    branchId: "", // Adicionado campo para filial
  })
  const [branches, setBranches] = useState<Branch[]>([]) // Estado para armazenar filiais
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        // Buscar filiais
        const fetchedBranches = await branchService.getAll()
        setBranches(fetchedBranches)

        // Se houver filiais, selecionar a primeira por padrão
        if (fetchedBranches.length > 0) {
          setFormData((prev) => ({ ...prev, branchId: fetchedBranches[0].id }))
        }
      } catch (error) {
        console.error("Erro ao buscar filiais:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as filiais. Tente novamente.",
          variant: "destructive",
        })
      }
    }

    if (isOpen) {
      fetchBranches()
    }
  }, [isOpen, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar dados
      if (!formData.name || !formData.quantity || !formData.minQuantity || !formData.cost || !formData.branchId) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios, incluindo a filial.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Criar ingrediente no Firebase
      const ingredientId = await ingredientService.add(
        {
          name: formData.name,
          quantity: Number.parseFloat(formData.quantity),
          unit: formData.unit,
          minQuantity: Number.parseFloat(formData.minQuantity),
          cost: Number.parseFloat(formData.cost),
          initialQuantity: Number.parseFloat(formData.quantity), // Registrar quantidade inicial
        },
        formData.branchId, // Passar o ID da filial
      )

      // Notificar sucesso
      toast({
        title: "Ingrediente adicionado",
        description: `${formData.quantity} ${formData.unit} de ${formData.name} adicionados ao estoque da filial selecionada.`,
      })

      // Limpar formulário
      setFormData({
        name: "",
        quantity: "",
        unit: "kg",
        minQuantity: "",
        cost: "",
        branchId: branches.length > 0 ? branches[0].id : "", // Manter a filial selecionada
      })

      // Chamar callback
      onAdd({ id: ingredientId, ...formData })
      onClose()
    } catch (error) {
      console.error("Erro ao adicionar ingrediente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o ingrediente. Tente novamente.",
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
            <DialogTitle>Adicionar Ingrediente</DialogTitle>
            <DialogDescription>Preencha os detalhes do ingrediente que deseja adicionar ao estoque.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Campo de seleção de filial */}
            <div className="space-y-2">
              <Label htmlFor="branch">Filial</Label>
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

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Ingrediente</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="g">Grama (g)</SelectItem>
                    <SelectItem value="l">Litro (l)</SelectItem>
                    <SelectItem value="ml">Mililitro (ml)</SelectItem>
                    <SelectItem value="un">Unidade (un)</SelectItem>
                    <SelectItem value="cx">Caixa (cx)</SelectItem>
                    <SelectItem value="pct">Pacote (pct)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minQuantity">Quantidade Mínima</Label>
                <Input
                  id="minQuantity"
                  name="minQuantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minQuantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Custo Unitário (R$)</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
