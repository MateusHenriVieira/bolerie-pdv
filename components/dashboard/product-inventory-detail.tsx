"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/lib/contexts/branch-context"
import { productService } from "@/lib/services/product-service"
import { Search, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductInventoryDetailProps {
  isLoading?: boolean
}

export function ProductInventoryDetail({ isLoading = false }: ProductInventoryDetailProps) {
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  })
  const { effectiveBranchId } = useBranch()

  // Estatísticas do inventário
  const totalProducts = filteredProducts.length
  const totalItems = filteredProducts.reduce((sum, product) => sum + (product.stock || 0), 0)
  const totalValue = filteredProducts.reduce((sum, product) => sum + product.totalValue, 0)

  useEffect(() => {
    const fetchProducts = async () => {
      if (!effectiveBranchId || isLoading) return

      try {
        setLoading(true)
        const fetchedProducts = await productService.getAllProductsForBranch(effectiveBranchId)

        // Processar produtos para adicionar o valor total
        const processedProducts = fetchedProducts.map((product) => {
          let price = product.price || 0

          // Se o produto tiver tamanhos, usar o preço médio
          if (product.sizes && product.sizes.length > 0) {
            price = product.sizes.reduce((sum, size) => sum + size.price, 0) / product.sizes.length
          }

          const stock = product.stock || 0
          const totalValue = price * stock

          return {
            ...product,
            price,
            stock,
            totalValue,
          }
        })

        setProducts(processedProducts)
        setFilteredProducts(processedProducts)
      } catch (error) {
        console.error("Erro ao buscar produtos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [effectiveBranchId, isLoading])

  // Filtrar produtos quando a busca mudar
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = products.filter(
        (product) => product.name?.toLowerCase().includes(query) || product.category?.toLowerCase().includes(query),
      )
      setFilteredProducts(filtered)
    }
  }, [searchQuery, products])

  // Função para ordenar produtos
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"

    if (sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc"
    }

    setSortConfig({ key, direction })

    const sortedProducts = [...filteredProducts].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1
      return 0
    })

    setFilteredProducts(sortedProducts)
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Detalhamento do Estoque de Produtos</CardTitle>
        <CardDescription>
          {totalProducts} produtos | {totalItems} itens em estoque | Valor total: R$ {totalValue.toFixed(2)}
        </CardDescription>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" className="p-0 font-medium" onClick={() => handleSort("name")}>
                      Nome
                      {sortConfig.key === "name" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="p-0 font-medium" onClick={() => handleSort("category")}>
                      Categoria
                      {sortConfig.key === "category" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="p-0 font-medium" onClick={() => handleSort("size")}>
                      Tamanho
                      {sortConfig.key === "size" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="p-0 font-medium" onClick={() => handleSort("price")}>
                      Preço Unit.
                      {sortConfig.key === "price" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="p-0 font-medium" onClick={() => handleSort("stock")}>
                      Quantidade
                      {sortConfig.key === "stock" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" className="p-0 font-medium" onClick={() => handleSort("totalValue")}>
                      Valor Total
                      {sortConfig.key === "totalValue" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {typeof product.category === "string"
                            ? product.category
                            : product.category?.name || "Sem categoria"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {typeof product.size === "string" ? product.size : product.size?.name || "Padrão"}
                      </TableCell>
                      <TableCell className="text-right">R$ {product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={product.stock === 0 ? "destructive" : product.stock < 5 ? "outline" : "secondary"}
                        >
                          {product.stock} un
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">R$ {product.totalValue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
