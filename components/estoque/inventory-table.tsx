"use client"

import { useState, useEffect } from "react"
import { Edit, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { productService } from "@/lib/services"
import type { Product } from "@/lib/services/product-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { EditInventoryModal } from "./edit-inventory-modal"

interface InventoryTableProps {
  searchQuery: string
}

export function InventoryTable({ searchQuery }: InventoryTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { toast } = useToast()
  const { currentBranch } = useBranch()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (!currentBranch?.id) {
          setProducts([])
          setLoading(false)
          return
        }

        const fetchedProducts = await productService.getAll(currentBranch.id)
        setProducts(fetchedProducts)
        setLoading(false)
      } catch (error) {
        console.error("Erro ao buscar produtos:", error)
        setLoading(false)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os produtos. Tente novamente.",
          variant: "destructive",
        })
      }
    }

    fetchProducts()
  }, [toast, currentBranch])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!currentBranch?.id) {
      toast({
        title: "Erro",
        description: "Nenhuma filial selecionada. Não é possível excluir o produto.",
        variant: "destructive",
      })
      return
    }

    try {
      await productService.delete(id, currentBranch.id)
      setProducts(products.filter((product) => product.id !== id))
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleProductEdited = (updatedProduct: Product) => {
    setProducts(
      products.map((product) => (product.id === updatedProduct.id ? { ...product, ...updatedProduct } : product)),
    )
  }

  const filteredProducts = products.filter(
    (product) => product.name && product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortColumn) return 0

    let valueA, valueB

    switch (sortColumn) {
      case "name":
        valueA = a.name || ""
        valueB = b.name || ""
        break
      case "category":
        valueA = typeof a.category === "string" ? a.category : a.category?.name || ""
        valueB = typeof b.category === "string" ? b.category : b.category?.name || ""
        break
      case "price":
        valueA = a.price || 0
        valueB = b.price || 0
        break
      case "stock":
        valueA = a.stock || 0
        valueB = b.stock || 0
        break
      default:
        return 0
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
              Nome
              {sortColumn === "name" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
              Categoria
              {sortColumn === "category" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead className="cursor-pointer text-right" onClick={() => handleSort("price")}>
              Preço
              {sortColumn === "price" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </TableHead>
            <TableHead className="cursor-pointer text-right" onClick={() => handleSort("stock")}>
              Estoque
              {sortColumn === "stock" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                {currentBranch?.id ? "Nenhum produto encontrado." : "Selecione uma filial para visualizar os produtos."}
              </TableCell>
            </TableRow>
          ) : (
            sortedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name || ""}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {typeof product.category === "string"
                      ? product.category
                      : product.category?.name || "Sem categoria"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {typeof product.size === "string" ? product.size : product.size?.name || "Sem tamanho"}
                </TableCell>
                <TableCell className="text-right">R$ {(product.price || 0).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      (product.stock || 0) === 0 ? "destructive" : (product.stock || 0) < 5 ? "outline" : "secondary"
                    }
                  >
                    {product.stock || 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="relative">
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEditProduct(product)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 ml-1"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <EditInventoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEdit={handleProductEdited}
        product={selectedProduct}
      />
    </div>
  )
}
