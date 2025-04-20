"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { productService, type Product } from "@/lib/services/product-service"
import { categoryService } from "@/lib/services/category-service"
import { EditProductModal } from "./edit-product-modal"
import { DeleteProductDialog } from "./delete-product-dialog"
import { useBranch } from "@/lib/contexts/branch-context"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Pencil, Trash2 } from "lucide-react"

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const { effectiveBranchId } = useBranch()
  const { toast } = useToast()

  // Carregar produtos
  useEffect(() => {
    const fetchProducts = async () => {
      if (!effectiveBranchId) return

      setIsLoading(true)
      try {
        const fetchedProducts = await productService.getAllProductsForBranch(effectiveBranchId)
        setProducts(fetchedProducts)
        setFilteredProducts(fetchedProducts)
      } catch (error) {
        console.error("Erro ao carregar produtos:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os produtos. Tente novamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [effectiveBranchId, toast])

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      if (!effectiveBranchId) return

      try {
        const fetchedCategories = await categoryService.getAll(effectiveBranchId)
        const categoryMap: { [key: string]: string } = {}
        fetchedCategories.forEach((cat) => {
          categoryMap[cat.id] = cat.name
        })
        setCategories(categoryMap)
      } catch (error) {
        console.error("Erro ao carregar categorias:", error)
      }
    }

    fetchCategories()
  }, [effectiveBranchId])

  // Filtrar produtos
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products)
      return
    }

    const searchTermLower = searchTerm.toLowerCase()
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTermLower) ||
        (product.description && product.description.toLowerCase().includes(searchTermLower)),
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  const handleSearch = () => {
    // A pesquisa já é feita pelo useEffect acima
  }

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsEditModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveProduct = async () => {
    setIsEditModalOpen(false)
    if (!effectiveBranchId) return

    try {
      const fetchedProducts = await productService.getAllProductsForBranch(effectiveBranchId)
      setProducts(fetchedProducts)
      setFilteredProducts(fetchedProducts)
    } catch (error) {
      console.error("Erro ao recarregar produtos:", error)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProduct || !selectedProduct.id || !effectiveBranchId) return

    try {
      await productService.delete(selectedProduct.id)
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso",
      })

      // Atualizar a lista de produtos
      const updatedProducts = products.filter((p) => p.id !== selectedProduct.id)
      setProducts(updatedProducts)
      setFilteredProducts(updatedProducts)
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      toast({
        title: "Erro",
        description: `Erro ao excluir produto: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedProduct(null)
    }
  }

  const getCategoryName = (categoryId: string | { id: string; name: string } | undefined) => {
    if (!categoryId) return "Sem categoria"

    if (typeof categoryId === "object" && categoryId !== null) {
      return categoryId.name || "Sem categoria"
    }

    return categories[categoryId] || categoryId
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar produtos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            Buscar
          </Button>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Carregando produtos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Preço de Custo</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{getCategoryName(product.category)}</TableCell>
                  <TableCell className="text-right">R$ {product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    R$ {product.costPrice ? product.costPrice.toFixed(2) : "0.00"}
                  </TableCell>
                  <TableCell className="text-right">{product.stock || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} title="Editar">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product)} title="Excluir">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProduct}
        product={selectedProduct}
      />

      <DeleteProductDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        productName={selectedProduct?.name || ""}
      />
    </div>
  )
}
