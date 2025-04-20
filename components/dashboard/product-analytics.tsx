"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/lib/contexts/branch-context"
import { saleService } from "@/lib/services/sale-service"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format } from "date-fns"

interface ProductAnalyticsProps {
  isLoading?: boolean
  dateRange: { from: Date; to: Date }
}

interface TopProduct {
  id: string
  name: string
  quantity: number
  revenue: number
  category?: string
}

export function ProductAnalytics({ isLoading = false, dateRange }: ProductAnalyticsProps) {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topCategories, setTopCategories] = useState<{ name: string; count: number; revenue: number }[]>([])
  const [loading, setLoading] = useState(true)
  const { effectiveBranchId } = useBranch()

  useEffect(() => {
    const fetchProductAnalytics = async () => {
      if (!effectiveBranchId || isLoading || !dateRange.from || !dateRange.to) return

      try {
        setLoading(true)

        // Buscar vendas no período selecionado
        const sales = await saleService.getByDateRange(dateRange.from, dateRange.to, effectiveBranchId)

        // Agrupar por produto
        const productMap: Record<
          string,
          { id: string; name: string; quantity: number; revenue: number; category?: string }
        > = {}

        // Processar todos os itens de todas as vendas
        for (const sale of sales) {
          if (sale.items && Array.isArray(sale.items)) {
            for (const item of sale.items) {
              const productId = item.productId || "unknown"
              const productName = item.name || "Produto Desconhecido"
              const quantity = item.quantity || 0
              const revenue = item.total || (item.price || 0) * quantity

              if (!productMap[productId]) {
                productMap[productId] = {
                  id: productId,
                  name: productName,
                  quantity: 0,
                  revenue: 0,
                  category: item.category,
                }
              }

              productMap[productId].quantity += quantity
              productMap[productId].revenue += revenue
            }
          }
        }

        // Converter para array e ordenar por quantidade
        const productsArray = Object.values(productMap)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10) // Top 10 produtos

        // Agrupar por categoria
        const categoryMap: Record<string, { name: string; count: number; revenue: number }> = {}

        for (const product of productsArray) {
          const category = product.category || "Sem Categoria"

          if (!categoryMap[category]) {
            categoryMap[category] = {
              name: category,
              count: 0,
              revenue: 0,
            }
          }

          categoryMap[category].count += product.quantity
          categoryMap[category].revenue += product.revenue
        }

        // Converter para array e ordenar por quantidade
        const categoriesArray = Object.values(categoryMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5) // Top 5 categorias

        setTopProducts(productsArray)
        setTopCategories(categoriesArray)
      } catch (error) {
        console.error("Erro ao carregar análise de produtos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProductAnalytics()
  }, [effectiveBranchId, isLoading, dateRange])

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Produtos Mais Vendidos</CardTitle>
        <CardDescription>
          {`Top produtos por quantidade vendida de ${format(dateRange.from, "dd/MM/yyyy")} a ${format(dateRange.to, "dd/MM/yyyy")}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={120}
                tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "quantity") return [value, "Quantidade"]
                  if (name === "revenue") return [`R$ ${Number(value).toFixed(2)}`, "Receita"]
                  return [value, name]
                }}
              />
              <Legend />
              <Bar dataKey="quantity" name="Quantidade" fill="#8884d8" />
              <Bar dataKey="revenue" name="Receita (R$)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        )}

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Categorias Mais Vendidas</h4>
          {loading ? (
            <Skeleton className="h-[100px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={topCategories} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "count") return [value, "Quantidade"]
                    if (name === "revenue") return [`R$ ${Number(value).toFixed(2)}`, "Receita"]
                    return [value, name]
                  }}
                />
                <Bar dataKey="count" name="Quantidade" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
