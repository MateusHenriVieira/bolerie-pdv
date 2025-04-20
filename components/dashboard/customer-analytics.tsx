"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/lib/contexts/branch-context"
import { saleService } from "@/lib/services/sale-service"
import { customerService } from "@/lib/services/customer-service"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { format } from "date-fns"

interface CustomerAnalyticsProps {
  isLoading?: boolean
  dateRange: { from: Date; to: Date }
}

interface TopCustomer {
  id: string
  name: string
  totalSpent: number
  orderCount: number
  avgTicket: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export function CustomerAnalytics({ isLoading = false, dateRange }: CustomerAnalyticsProps) {
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    avgTicket: 0,
    loyaltyDistribution: [] as { name: string; value: number }[],
  })
  const [loading, setLoading] = useState(true)
  const { effectiveBranchId } = useBranch()

  useEffect(() => {
    const fetchCustomerAnalytics = async () => {
      if (!effectiveBranchId || isLoading || !dateRange.from || !dateRange.to) return

      try {
        setLoading(true)

        // Buscar vendas no período selecionado
        const sales = await saleService.getByDateRange(dateRange.from, dateRange.to, effectiveBranchId)

        // Buscar todos os clientes
        const allCustomers = await customerService.getAll(effectiveBranchId)

        // Agrupar vendas por cliente
        const customerMap: Record<
          string,
          {
            id: string
            name: string
            totalSpent: number
            orderCount: number
            orders: any[]
          }
        > = {}

        // Inicializar com clientes que têm nome
        allCustomers.forEach((customer) => {
          if (customer.id && customer.name) {
            customerMap[customer.id] = {
              id: customer.id,
              name: customer.name,
              totalSpent: 0,
              orderCount: 0,
              orders: [],
            }
          }
        })

        // Processar todas as vendas
        for (const sale of sales) {
          if (sale.customerId) {
            if (!customerMap[sale.customerId]) {
              customerMap[sale.customerId] = {
                id: sale.customerId,
                name: sale.customerName || "Cliente Desconhecido",
                totalSpent: 0,
                orderCount: 0,
                orders: [],
              }
            }

            customerMap[sale.customerId].totalSpent += sale.total || 0
            customerMap[sale.customerId].orderCount += 1
            customerMap[sale.customerId].orders.push(sale)
          }
        }

        // Converter para array e ordenar por valor total gasto
        const customersArray = Object.values(customerMap)
          .filter((c) => c.orderCount > 0) // Apenas clientes com pedidos
          .map((c) => ({
            id: c.id,
            name: c.name,
            totalSpent: c.totalSpent,
            orderCount: c.orderCount,
            avgTicket: c.totalSpent / c.orderCount,
          }))
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 10) // Top 10 clientes

        // Calcular estatísticas gerais
        const customersWithOrders = Object.values(customerMap).filter((c) => c.orderCount > 0)
        const totalSpent = customersWithOrders.reduce((sum, c) => sum + c.totalSpent, 0)
        const totalOrders = customersWithOrders.reduce((sum, c) => sum + c.orderCount, 0)

        // Contar clientes novos (que fizeram apenas 1 pedido)
        const newCustomers = customersWithOrders.filter((c) => c.orderCount === 1).length
        const returningCustomers = customersWithOrders.length - newCustomers

        // Distribuição de níveis de fidelidade
        const loyaltyLevels = await customerService.getLoyaltyLevels(effectiveBranchId)
        const loyaltyDistribution: { name: string; value: number }[] = []

        // Inicializar contagem para cada nível
        loyaltyLevels.forEach((level) => {
          loyaltyDistribution.push({
            name: level.name,
            value: 0,
          })
        })

        // Contar clientes por nível
        allCustomers.forEach((customer) => {
          const levelIndex = loyaltyLevels.findIndex((l) => l.id === customer.loyaltyLevel)
          if (levelIndex >= 0) {
            loyaltyDistribution[levelIndex].value += 1
          }
        })

        setTopCustomers(customersArray)
        setCustomerStats({
          totalCustomers: allCustomers.length,
          newCustomers,
          returningCustomers,
          avgTicket: totalOrders > 0 ? totalSpent / totalOrders : 0,
          loyaltyDistribution,
        })
      } catch (error) {
        console.error("Erro ao carregar análise de clientes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerAnalytics()
  }, [effectiveBranchId, isLoading, dateRange])

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Análise de Clientes</CardTitle>
        <CardDescription>
          {`Clientes que mais compraram de ${format(dateRange.from, "dd/MM/yyyy")} a ${format(dateRange.to, "dd/MM/yyyy")}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            {loading ? (
              <Skeleton className="h-6 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold">R$ {customerStats.avgTicket.toFixed(2)}</p>
            )}
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Clientes Recorrentes</p>
            {loading ? (
              <Skeleton className="h-6 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{customerStats.returningCustomers}</p>
            )}
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCustomers} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
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
                  if (name === "totalSpent") return [`R$ ${Number(value).toFixed(2)}`, "Total Gasto"]
                  if (name === "avgTicket") return [`R$ ${Number(value).toFixed(2)}`, "Ticket Médio"]
                  if (name === "orderCount") return [value, "Número de Pedidos"]
                  return [value, name]
                }}
              />
              <Legend />
              <Bar dataKey="totalSpent" name="Total Gasto (R$)" fill="#8884d8" />
              <Bar dataKey="orderCount" name="Número de Pedidos" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {!loading && customerStats.loyaltyDistribution.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Distribuição de Níveis de Fidelidade</h4>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={customerStats.loyaltyDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {customerStats.loyaltyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    return [value, props.payload.name]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
