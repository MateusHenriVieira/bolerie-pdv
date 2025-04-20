"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/lib/contexts/branch-context"
import { productService } from "@/lib/services/product-service"
import { ingredientService } from "@/lib/services/ingredient-service"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface InventorySummaryProps {
  isLoading?: boolean
}

export function InventorySummary({ isLoading = false }: InventorySummaryProps) {
  const [productData, setProductData] = useState<any[]>([])
  const [ingredientData, setIngredientData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { effectiveBranchId } = useBranch()

  // Cores para o gráfico
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

  useEffect(() => {
    const fetchInventoryData = async () => {
      if (!effectiveBranchId || isLoading) return

      try {
        setLoading(true)

        // Buscar produtos
        const products = await productService.getAllProductsForBranch(effectiveBranchId)

        // Agrupar produtos por categoria
        const productsByCategory = products.reduce((acc, product) => {
          const category =
            typeof product.category === "string" ? product.category : product.category?.name || "Sem categoria"

          if (!acc[category]) {
            acc[category] = {
              name: category,
              count: 0,
              value: 0,
              items: [],
            }
          }

          let price = product.price || 0
          if (product.sizes && product.sizes.length > 0) {
            price = product.sizes.reduce((sum, size) => sum + size.price, 0) / product.sizes.length
          }

          const stock = product.stock || 0
          const totalValue = price * stock

          acc[category].count += 1
          acc[category].value += totalValue
          acc[category].items.push({
            id: product.id,
            name: product.name,
            stock,
            price,
            totalValue,
          })

          return acc
        }, {})

        // Converter para array para o gráfico
        const productChartData = Object.values(productsByCategory)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 8) // Limitar a 8 categorias para o gráfico

        setProductData(productChartData)

        // Buscar ingredientes
        const ingredients = await ingredientService.getAll(effectiveBranchId)

        // Agrupar ingredientes por tipo (se existir)
        const ingredientsByType = ingredients.reduce((acc, ingredient) => {
          const type = ingredient.type || "Sem tipo"

          if (!acc[type]) {
            acc[type] = {
              name: type,
              count: 0,
              value: 0,
              items: [],
            }
          }

          const stock = ingredient.stock || 0
          const unitCost = ingredient.unitCost || 0
          const totalValue = stock * unitCost

          acc[type].count += 1
          acc[type].value += totalValue
          acc[type].items.push({
            id: ingredient.id,
            name: ingredient.name,
            stock,
            unitCost,
            totalValue,
          })

          return acc
        }, {})

        // Converter para array para o gráfico
        const ingredientChartData = Object.values(ingredientsByType)
          .sort((a: any, b: any) => b.value - a.value)
          .slice(0, 8) // Limitar a 8 tipos para o gráfico

        setIngredientData(ingredientChartData)
      } catch (error) {
        console.error("Erro ao carregar dados de inventário:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryData()
  }, [effectiveBranchId, isLoading])

  // Formatar valor para o tooltip
  const formatTooltipValue = (value: number) => `R$ ${value.toFixed(2)}`

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Resumo do Inventário</CardTitle>
        <CardDescription>Distribuição de valor por categoria de produtos e ingredientes</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {productData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={formatTooltipValue} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Top Produtos por Valor</h3>
                  <ul className="space-y-2">
                    {productData
                      .flatMap((category) =>
                        category.items
                          .sort((a: any, b: any) => b.totalValue - a.totalValue)
                          .slice(0, 3)
                          .map((item: any) => (
                            <li key={item.id} className="flex justify-between items-center border-b pb-1">
                              <div>
                                <span className="font-medium">{item.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">({item.stock} un)</span>
                              </div>
                              <span>R$ {item.totalValue.toFixed(2)}</span>
                            </li>
                          )),
                      )
                      .slice(0, 10)}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-4">
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ingredientData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {ingredientData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={formatTooltipValue} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Top Ingredientes por Valor</h3>
                  <ul className="space-y-2">
                    {ingredientData
                      .flatMap((type) =>
                        type.items
                          .sort((a: any, b: any) => b.totalValue - a.totalValue)
                          .slice(0, 3)
                          .map((item: any) => (
                            <li key={item.id} className="flex justify-between items-center border-b pb-1">
                              <div>
                                <span className="font-medium">{item.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">({item.stock} un)</span>
                              </div>
                              <span>R$ {item.totalValue.toFixed(2)}</span>
                            </li>
                          )),
                      )
                      .slice(0, 10)}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
