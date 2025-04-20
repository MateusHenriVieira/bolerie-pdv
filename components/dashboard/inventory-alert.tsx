"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ingredientService, productService } from "@/lib/services"
import { useBranch } from "@/lib/contexts/branch-context"

interface InventoryAlertProps {
  isLoading?: boolean
}

export function InventoryAlert({ isLoading = false }: InventoryAlertProps) {
  const [lowIngredients, setLowIngredients] = useState<any[]>([])
  const [lowProducts, setLowProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { currentBranch } = useBranch()

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!currentBranch?.id) {
          console.warn("Nenhuma filial selecionada ao buscar alertas de estoque")
          setLoading(false)
          return
        }

        // Buscar ingredientes com estoque baixo
        const ingredients = await ingredientService.getAll(currentBranch.id)
        const lowIngredientsData = ingredients
          .filter((ingredient) => ingredient.quantity < ingredient.minQuantity * 1.5)
          .sort((a, b) => a.quantity / a.minQuantity - b.quantity / b.minQuantity)
          .slice(0, 5)

        // Buscar produtos com estoque baixo
        const products = await productService.getAll(currentBranch.id)
        const lowProductsData = products
          .filter((product) => product.stock < 5)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5)

        setLowIngredients(lowIngredientsData)
        setLowProducts(lowProductsData)
        setLoading(false)
      } catch (error) {
        console.error("Erro ao buscar alertas de estoque:", error)
        setLoading(false)
      }
    }

    if (!isLoading) {
      fetchData()
    }
  }, [isLoading, currentBranch])

  if (isLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Estoque</CardTitle>
          <CardDescription>Itens com estoque baixo ou crítico</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas de Estoque</CardTitle>
        <CardDescription>Itens com estoque baixo ou crítico</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ingredients">
          <TabsList className="mb-4">
            <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
          </TabsList>
          <TabsContent value="ingredients">
            {lowIngredients.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum ingrediente com estoque baixo.</p>
            ) : (
              <div className="space-y-4">
                {lowIngredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{ingredient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {ingredient.quantity} {ingredient.unit} disponíveis
                      </p>
                    </div>
                    <Badge variant={ingredient.quantity < ingredient.minQuantity ? "destructive" : "outline"}>
                      {ingredient.quantity < ingredient.minQuantity ? "Crítico" : "Baixo"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="products">
            {lowProducts.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhum produto com estoque baixo.</p>
            ) : (
              <div className="space-y-4">
                {lowProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.stock} unidades disponíveis</p>
                    </div>
                    <Badge variant={product.stock === 0 ? "destructive" : "outline"}>
                      {product.stock === 0 ? "Esgotado" : "Baixo"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
