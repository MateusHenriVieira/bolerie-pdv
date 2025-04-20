"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/lib/contexts/branch-context"
import { saleService } from "@/lib/services/sale-service"
import { reservationService } from "@/lib/services/reservation-service"
import { ingredientService } from "@/lib/services/ingredient-service"
import { productService } from "@/lib/services/product-service"
import { DollarSign, ShoppingBag, Package, Calendar } from "lucide-react"

interface FinancialMetricsProps {
  isLoading?: boolean
  dateRange?: { from: Date; to: Date }
}

export function FinancialMetrics({ isLoading = false, dateRange }: FinancialMetricsProps) {
  const [metrics, setMetrics] = useState({
    reservationValue: 0,
    ingredientsValue: 0,
    productsValue: 0,
    totalInventoryValue: 0,
    pendingPayments: 0,
    totalSales: 0,
  })
  const [loading, setLoading] = useState(true)
  const { effectiveBranchId } = useBranch()

  useEffect(() => {
    const fetchFinancialMetrics = async () => {
      if (!effectiveBranchId || isLoading) return

      try {
        setLoading(true)

        // Usar o período fornecido ou padrão para os últimos 30 dias
        const today = new Date()
        const from = dateRange?.from || new Date(today.setDate(today.getDate() - 30))
        const to = dateRange?.to || new Date()

        // Buscar reservas pendentes
        const reservations = await reservationService.getAll(effectiveBranchId)
        const pendingReservations = reservations.filter((r) => r.status === "pending")
        const reservationValue = pendingReservations.reduce((sum, r) => {
          // Se tiver pagamento adiantado, considerar apenas o valor restante
          if (r.hasAdvancePayment && r.remainingAmount) {
            return sum + r.remainingAmount
          }
          return sum + r.total
        }, 0)

        // Buscar valor dos ingredientes em estoque
        const ingredients = await ingredientService.getAll(effectiveBranchId)
        const ingredientsValue = ingredients.reduce((sum, ing) => {
          return sum + (ing.stock || 0) * (ing.unitCost || 0)
        }, 0)

        // Buscar valor dos produtos em estoque
        const products = await productService.getAllProductsForBranch(effectiveBranchId)
        const productsValue = products.reduce((sum, prod) => {
          // Se o produto tiver tamanhos, calcular com base no preço médio
          if (prod.sizes && prod.sizes.length > 0) {
            const avgPrice = prod.sizes.reduce((sum, size) => sum + size.price, 0) / prod.sizes.length
            return sum + (prod.stock || 0) * avgPrice
          }
          return sum + (prod.stock || 0) * (prod.price || 0)
        }, 0)

        // Calcular valor total do estoque (ingredientes + produtos)
        const totalInventoryValue = ingredientsValue + productsValue

        // Buscar vendas com pagamentos pendentes
        const sales = await saleService.getByDateRange(from, to, effectiveBranchId)
        const pendingPayments = sales
          .filter((sale) => sale.status === "pending" || sale.paymentStatus === "pending")
          .reduce((sum, sale) => sum + (sale.total || 0), 0)

        // Total de vendas no período
        const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)

        setMetrics({
          reservationValue,
          ingredientsValue,
          productsValue,
          totalInventoryValue,
          pendingPayments,
          totalSales,
        })
      } catch (error) {
        console.error("Erro ao carregar métricas financeiras:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialMetrics()
  }, [effectiveBranchId, isLoading, dateRange])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor em Reservas</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">R$ {metrics.reservationValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Capital a receber de reservas pendentes</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor em Ingredientes</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">R$ {metrics.ingredientsValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Capital investido em matéria-prima</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor em Produtos</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">R$ {metrics.productsValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Capital em produtos prontos</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total em Estoque</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">R$ {metrics.totalInventoryValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Capital total retido em estoque</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
