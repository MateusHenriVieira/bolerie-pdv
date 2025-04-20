"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { saleService } from "@/lib/services/sale-service"
import { customerService } from "@/lib/services/customer-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingBag, CakeIcon, Users, DollarSign } from "lucide-react"

export function DashboardStats() {
  const [stats, setStats] = useState({
    dailySales: { total: 0, count: 0, percentChange: 0 },
    cakesSold: { count: 0, percentChange: 0 },
    newCustomers: { count: 0, percentChange: 0 },
    profit: { total: 0, percentChange: 0 },
  })
  const [loading, setLoading] = useState(true)
  const { effectiveBranchId } = useBranch()

  useEffect(() => {
    const fetchStats = async () => {
      if (!effectiveBranchId) return

      try {
        setLoading(true)

        // Buscar estatísticas de vendas
        const salesStats = await saleService.getSummary(effectiveBranchId)

        // Buscar estatísticas de clientes
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        // Buscar clientes criados hoje
        const newCustomersToday = await customerService.getNewCustomersCount(effectiveBranchId, today)

        // Buscar clientes criados ontem para comparação
        const newCustomersYesterday = await customerService.getNewCustomersCount(effectiveBranchId, yesterday, today)

        // Calcular a mudança percentual
        const customerPercentChange =
          newCustomersYesterday > 0 ? ((newCustomersToday - newCustomersYesterday) / newCustomersYesterday) * 100 : 0

        // Calcular bolos vendidos (assumindo que cada item vendido é um bolo)
        const cakesSold = await saleService.getCakesSoldCount(effectiveBranchId, today)
        const cakesSoldYesterday = await saleService.getCakesSoldCount(effectiveBranchId, yesterday, today)
        const cakesPercentChange =
          cakesSoldYesterday > 0 ? ((cakesSold - cakesSoldYesterday) / cakesSoldYesterday) * 100 : 0

        // Calcular mudança percentual para vendas diárias
        const yesterdaySales = await saleService.getDailySalesTotal(effectiveBranchId, yesterday, today)
        const salesPercentChange =
          yesterdaySales > 0 ? ((salesStats.dailySales.total - yesterdaySales) / yesterdaySales) * 100 : 0

        // Calcular mudança percentual para lucro
        const yesterdayProfit = yesterdaySales * 0.3 // Assumindo margem de lucro de 30%
        const profitPercentChange =
          yesterdayProfit > 0 ? ((salesStats.profit.total - yesterdayProfit) / yesterdayProfit) * 100 : 0

        setStats({
          dailySales: {
            ...salesStats.dailySales,
            percentChange: salesPercentChange,
          },
          cakesSold: {
            count: cakesSold,
            percentChange: cakesPercentChange,
          },
          newCustomers: {
            count: newCustomersToday,
            percentChange: customerPercentChange,
          },
          profit: {
            total: salesStats.profit.total,
            percentChange: profitPercentChange,
          },
        })
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [effectiveBranchId])

  // Função para formatar a porcentagem
  const formatPercentChange = (value: number) => {
    const formattedValue = value.toFixed(1)
    return `${formattedValue}% em relação a ontem`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">R$ {stats.dailySales.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{formatPercentChange(stats.dailySales.percentChange)}</p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bolos Vendidos</CardTitle>
          <CakeIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.cakesSold.count}</div>
              <p className="text-xs text-muted-foreground">{formatPercentChange(stats.cakesSold.percentChange)}</p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Novos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.newCustomers.count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.newCustomers.percentChange.toFixed(1)}% em relação à média
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lucro</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">R$ {stats.profit.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{formatPercentChange(stats.profit.percentChange)}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
