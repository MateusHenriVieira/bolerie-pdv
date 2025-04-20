"use client"

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
import { productService, type Product } from "@/lib/services/product-service"
import { categoryService } from "@/lib/services/category-service"
import { useToast } from "@/hooks/use-toast"
import { useBranch } from "@/lib/contexts/branch-context"

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  product: Product | null
}

export function EditProductModal({ isOpen, onClose, onSave, product }: EditProductModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [stock, setStock] = useState("")
  const [category, setCategory] = useState("")
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { effectiveBranchId } = useBranch()

  useEffect(() => {
    const fetchCategories = async () => {
      if (!effectiveBranchId) return

      try {
        const fetchedCategories = await categoryService.getAll(effectiveBranchId)
        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Erro ao carregar categorias:", error)
      }
    }

    fetchCategories()
  }, [effectiveBranchId])

  useEffect(() => {
    if (product) {
      setName(product.name || "")
      setDescription(product.description || "")
      setPrice(product.price ? product.price.toString() : "")
      setCostPrice(product.costPrice ? product.costPrice.toString() : "")
      setStock(product.stock ? product.stock.toString() : "")

      if (typeof product.category === "object" && product.category !== null) {
        setCategory(product.category.id || "")
      } else {
        setCategory(product.category || "")
      }
    } else {
      resetForm()
    }
  }, [product])

  const resetForm = () => {
    setName("")
    setDescription("")
    setPrice("")
    setCostPrice("")
    setStock("")
    setCategory("")
  }

  const handleSubmit = async () => {
    if (!name) {
      toast({
        title: "Erro",
        description: "O nome do produto é obrigatório",
        variant: "destructive",
      })
      return
    }

    if (!effectiveBranchId) {
      toast({
        title: "Erro",
        description: "Selecione uma filial antes de salvar o produto",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const productData: Partial<Product> = {
        name,
        description,
        price: Number.parseFloat(price) || 0,
        costPrice: Number.parseFloat(costPrice) || 0,
        stock: Number.parseInt(stock) || 0,
        category,
        branchId: effectiveBranchId,
      }

      if (product?.id) {
        await productService.update(product.id, productData)
        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso",
        })
      } else {
        await productService.add(productData as Product)
        toast({
          title: "Produto adicionado",
          description: "O produto foi adicionado com sucesso",
        })
      }

      resetForm()
      onSave()
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      toast({
        title: "Erro",
        description: `Erro ao salvar produto: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Adicionar Produto"}</DialogTitle>
          <DialogDescription>
            {product ? "Atualize as informações do produto abaixo." : "Preencha as informações do novo produto."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Nome do produto"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Descrição do produto"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Preço
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="costPrice" className="text-right">
              Preço de Custo
            </Label>
            <Input
              id="costPrice"
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">
              Estoque
            </Label>
            <Input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="col-span-3"
              placeholder="0"
              step="1"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : product ? "Salvar alterações" : "Adicionar produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
