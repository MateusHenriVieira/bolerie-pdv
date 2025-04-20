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
import { Textarea } from "@/components/ui/textarea"
import { ingredientService, branchService } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import type { Ingredient } from "@/lib/types"
import type { Branch } from "@/lib/services/branch-service"

interface IngredientOutputModalProps {
  isOpen: boolean
  onClose: () => void
  onOutput: (data: any) => void
  ingredient?: Ingredient | null
}

export function IngredientOutputModal({ isOpen, onClose, onOutput, ingredient }: IngredientOutputModalProps) {
  const [formData, setFormData] = useState({
    quantity: "",
    reason: "",
    branchId: "",
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const fetchedBranches = await branchService.getAll()
        setBranches(fetchedBranches)

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
      // Resetar o formulário quando o modal é aberto
      setFormData({
        quantity: "",
        reason: "",
        branchId: ingredient?.branchId || "",
      })
    }
  }, [isOpen, ingredient, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      if (!ingredient || !formData.quantity || !formData.branchId) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const outputQuantity = Number.parseFloat(formData.quantity)

      // Verificar se a quantidade de saída é válida
      if (outputQuantity <= 0) {
        toast({
          title: "Quantidade inválida",
          description: "A quantidade de saída deve ser maior que zero.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Registrar a saída do ingrediente (quantidade negativa)
      await ingredientService.updateQuantity(
        ingredient.id,
        -outputQuantity, // Quantidade negativa para saída
        formData.branchId,
        formData.reason, // Passar o motivo da saída
      )

      toast({
        title: "Saída registrada",
        description: `${formData.quantity} ${ingredient.unit} de ${ingredient.name} foram retirados do estoque.`,
      })

      // Limpar formulário
      setFormData({
        quantity: "",
        reason: "",
        branchId: formData.branchId, // Manter a filial selecionada
      })

      // Chamar callback
      onOutput({
        ingredientId: ingredient.id,
        quantity: -outputQuantity,
        reason: formData.reason,
        branchId: formData.branchId,
      })

      onClose()
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a saída. Tente novamente.",
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
            <DialogTitle>Registrar Saída de Ingrediente</DialogTitle>
            <DialogDescription>
              Informe a quantidade que será retirada do estoque e o motivo da saída.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {ingredient && (
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{ingredient.name}</p>
                <p className="text-sm">
                  Estoque atual: {ingredient.quantity} {ingredient.unit}
                </p>
              </div>
            )}

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
              <Label htmlFor="quantity">Quantidade de Saída</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
              {ingredient && Number(formData.quantity) > ingredient.quantity && (
                <p className="text-destructive text-sm mt-1">
                  Atenção: A quantidade de saída é maior que o estoque atual.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Saída</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="Ex: Utilizado na produção, Perda, Vencimento, etc."
                value={formData.reason}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Saída"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
