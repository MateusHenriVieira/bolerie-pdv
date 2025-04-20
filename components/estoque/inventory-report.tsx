"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { productService, saleService } from "@/lib/services"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Adicionar a importação do contexto de filial
import { useBranch } from "@/lib/contexts/branch-context"

// Modificar o componente InventoryReport para usar o contexto de filial
export function InventoryReport() {
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [highStockItems, setHighStockItems] = useState<any[]>([])
  const [bestSellingItems, setBestSellingItems] = useState<any[]>([])
  const { toast } = useToast()
  // Adicionar o hook useBranch para obter o ID da filial
  const { effectiveBranchId } = useBranch()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verificar se o ID da filial está disponível
        if (!effectiveBranchId) {
          toast({
            title: "Erro",
            description: "ID da filial não disponível. Por favor, selecione uma filial.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        setLoading(true)

        // Buscar produtos com o ID da filial
        const products = await productService.getAll(effectiveBranchId)

        // Calcular valor total do estoque
        const total = products.reduce((sum, product) => sum + product.price * product.stock, 0)
        setTotalValue(total)

        // Identificar produtos com baixo estoque (menos de 5 unidades)
        const lowStock = products
          .filter((product) => product.stock < 5)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 10)
          .map((product) => ({
            name: product.name,
            value: product.stock,
          }))
        setLowStockItems(lowStock)

        // Identificar produtos com alto estoque (mais de 20 unidades)
        const highStock = products
          .filter((product) => product.stock > 20)
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 10)
          .map((product) => ({
            name: product.name,
            value: product.stock,
          }))
        setHighStockItems(highStock)

        // Buscar vendas para identificar itens mais vendidos, passando o ID da filial
        const sales = await saleService.getAll(effectiveBranchId)

        // Contagem de produtos vendidos
        const productSales: Record<string, number> = {}

        sales.forEach((sale) => {
          sale.items.forEach((item) => {
            if (productSales[item.productId]) {
              productSales[item.productId] += item.quantity
            } else {
              productSales[item.productId] = item.quantity
            }
          })
        })

        // Mapear IDs para nomes de produtos
        const productMap = products.reduce(
          (map, product) => {
            map[product.id] = product.name
            return map
          },
          {} as Record<string, string>,
        )

        // Criar array de itens mais vendidos
        const bestSelling = Object.entries(productSales)
          .map(([productId, quantity]) => {
            const product = products.find((p) => p.id === productId) || {
              name: "Produto Desconhecido",
              price: 0,
              category: "Desconhecido",
            }
            const totalValue = quantity * product.price
            const percentOfTotal =
              sales.length > 0 ? quantity / Object.values(productSales).reduce((a, b) => a + b, 0) : 0

            return {
              id: productId,
              name: product.name,
              category: product.category || "Sem categoria",
              quantity: quantity,
              unitPrice: product.price,
              totalValue: totalValue,
              percentOfTotal: percentOfTotal,
            }
          })
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10)

        setBestSellingItems(bestSelling)

        setLoading(false)
      } catch (error) {
        console.error("Erro ao carregar relatório de estoque:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do relatório.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    // Só executar fetchData se o ID da filial estiver disponível
    if (effectiveBranchId) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [toast, effectiveBranchId]) // Adicionar effectiveBranchId como dependência

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  // Função para formatar nomes longos mantendo a legibilidade
  const formatProductName = (name: string) => {
    // Se o nome for curto, retorna ele completo
    if (name.length <= 25) return name

    // Caso contrário, divide em palavras e tenta manter palavras completas
    const words = name.split(" ")
    let result = ""
    let currentLength = 0

    for (const word of words) {
      if (currentLength + word.length <= 22) {
        result += (result ? " " : "") + word
        currentLength += word.length + 1
      } else {
        break
      }
    }

    return result + "..."
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Relatório de Estoque</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Valor Total do Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="low-stock" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="low-stock">Itens com Baixo Estoque</TabsTrigger>
          <TabsTrigger value="high-stock">Itens com Alto Estoque</TabsTrigger>
          <TabsTrigger value="best-selling">Itens Mais Vendidos</TabsTrigger>
        </TabsList>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle>Produtos com Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length > 0 ? (
                <div className="h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={lowStockItems.map((item) => ({
                        ...item,
                        displayName: formatProductName(item.name),
                      }))}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="displayName" type="category" width={200} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`${value} unidades`, "Quantidade"]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            return `Produto: ${payload[0].payload.name}`
                          }
                          return label
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: "10px" }} />
                      <Bar dataKey="value" name="Quantidade em Estoque" fill="#ff8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center py-10 text-muted-foreground">Não há produtos com estoque baixo.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-stock">
          <Card>
            <CardHeader>
              <CardTitle>Produtos com Estoque Elevado</CardTitle>
            </CardHeader>
            <CardContent>
              {highStockItems.length > 0 ? (
                <div className="h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={highStockItems.map((item) => ({
                        ...item,
                        displayName: formatProductName(item.name),
                      }))}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="displayName" type="category" width={200} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`${value} unidades`, "Quantidade"]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            return `Produto: ${payload[0].payload.name}`
                          }
                          return label
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: "10px" }} />
                      <Bar dataKey="value" name="Quantidade em Estoque" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center py-10 text-muted-foreground">Não há produtos com estoque elevado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="best-selling">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {bestSellingItems.length > 0 ? (
                <div className="space-y-8">
                  <div className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={bestSellingItems.map((item) => ({
                          ...item,
                          displayName: formatProductName(item.name),
                        }))}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="displayName" type="category" width={200} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value, name, props) => {
                            if (name === "Quantidade") return [`${value} unidades`, name]
                            if (name === "Valor Total")
                              return [`R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, name]
                            if (name === "% do Total") return [`${(Number(value) * 100).toFixed(1)}%`, name]
                            return [value, name]
                          }}
                          labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                              return `Produto: ${payload[0].payload.name}`
                            }
                            return label
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: "10px" }} />
                        <Bar dataKey="quantity" name="Quantidade" fill="#8884d8" />
                        <Bar dataKey="totalValue" name="Valor Total" fill="#82ca9d" />
                        <Bar dataKey="percentOfTotal" name="% do Total" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Detalhamento por Categoria</h3>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(
                            bestSellingItems.reduce(
                              (acc, item) => {
                                acc[item.category] = (acc[item.category] || 0) + item.quantity
                                return acc
                              },
                              {} as Record<string, number>,
                            ),
                          )
                            .map(([category, quantity]) => ({ category, quantity }))
                            .sort((a, b) => b.quantity - a.quantity)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="category"
                            tick={{ fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} unidades`, "Quantidade"]} />
                          <Legend verticalAlign="top" height={36} />
                          <Bar dataKey="quantity" name="Quantidade por Categoria" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-10 text-muted-foreground">Não há dados de vendas disponíveis.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
