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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categoryService, sizeService, productService } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import { useBranch } from "@/lib/contexts/branch-context"
import { useAuth } from "@/lib/firebase/auth"

interface AddInventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: any) => void
}

export function AddInventoryModal({ isOpen, onClose, onAdd }: AddInventoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    size: "",
    price: "",
    cost: "",
    quantity: "",
  })
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [sizes, setSizes] = useState<{ id: string; name: string; basePrice: number }[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { currentBranch, userBranchId } = useBranch()
  const { isOwner, isAdmin } = useAuth()

  // Determinar qual filial usar com base no tipo de usuário
  const getBranchId = () => {
    if (isOwner || isAdmin) {
      // Para owner e admin, usar a filial selecionada
      return currentBranch?.id || null
    } else {
      // Para funcionários, usar a filial do usuário
      return userBranchId
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const branchId = getBranchId()
        if (!branchId) {
          toast({
            title: "Erro",
            description: "Nenhuma filial selecionada. Não é possível carregar categorias e tamanhos.",
            variant: "destructive",
          })
          return
        }

        // Buscar categorias e tamanhos da filial correta
        const fetchedCategories = await categoryService.getAll(branchId)
        const fetchedSizes = await sizeService.getAll(branchId)

        setCategories(fetchedCategories)
        setSizes(fetchedSizes)

        // Resetar o formulário
        setFormData({
          name: "",
          description: "",
          category: "",
          size: "",
          price: "",
          cost: "",
          quantity: "",
        })
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as categorias e tamanhos. Tente novamente.",
          variant: "destructive",
        })
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen, toast, currentBranch, userBranchId, isOwner, isAdmin])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Se o tamanho for selecionado, atualizar o preço base
    if (name === "size") {
      const selectedSize = sizes.find((size) => size.name === value)
      if (selectedSize) {
        setFormData((prev) => ({ ...prev, price: selectedSize.basePrice.toString() }))
      }
    }
  }

  const calculateProfit = () => {
    const price = Number.parseFloat(formData.price) || 0
    const cost = Number.parseFloat(formData.cost) || 0

    if (price > 0 && cost > 0) {
      const profit = price - cost
      const profitMargin = (profit / price) * 100
      return {
        profit: profit.toFixed(2),
        profitMargin: profitMargin.toFixed(2),
      }
    }

    return null
  }

  const profitInfo = calculateProfit()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const branchId = getBranchId()
    if (!branchId) {
      toast({
        title: "Erro",
        description: "Nenhuma filial selecionada. Não é possível adicionar o produto.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Validar dados
      if (
        !formData.name ||
        !formData.category ||
        !formData.size ||
        !formData.price ||
        !formData.cost ||
        !formData.quantity
      ) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Criar produto no Firebase na filial correta
      const product = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        size: formData.size,
        price: Number.parseFloat(formData.price),
        cost: Number.parseFloat(formData.cost),
        stock: Number.parseInt(formData.quantity),
        image: "", // Sem imagens conforme solicitado
        branchId: branchId, // Adicionar branchId ao produto
      }

      // Usar o método create em vez de add
      const createdProduct = await productService.create(product)
      const productId = createdProduct.id

      // Notificar sucesso
      toast({
        title: "Produto adicionado",
        description: `${formData.quantity} unidades de ${formData.name} adicionadas ao estoque.`,
      })

      // Limpar formulário
      setFormData({
        name: "",
        description: "",
        category: "",
        size: "",
        price: "",
        cost: "",
        quantity: "",
      })

      // Chamar callback
      onAdd({ id: productId, ...formData })
      onClose()
    } catch (error) {
      console.error("Erro ao adicionar produto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto. Tente novamente.",
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
            <DialogTitle>Adicionar Produto ao Estoque</DialogTitle>
            <DialogDescription>Preencha os detalhes do produto que deseja adicionar ao estoque.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="sem-categorias" disabled>
                        Nenhuma categoria cadastrada
                      </SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Tamanho</Label>
                <Select value={formData.size} onValueChange={(value) => handleSelectChange("size", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.length === 0 ? (
                      <SelectItem value="sem-tamanhos" disabled>
                        Nenhum tamanho cadastrado
                      </SelectItem>
                    ) : (
                      sizes.map((size) => (
                        <SelectItem key={size.id} value={size.name}>
                          {size.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Custo (R$)</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Preço Venda (R$)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {profitInfo && (
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm">
                  <span className="font-medium">Lucro por unidade:</span> R$ {profitInfo.profit}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Margem de lucro:</span> {profitInfo.profitMargin}%
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
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
