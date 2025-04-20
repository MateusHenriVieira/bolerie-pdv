"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/lib/contexts/branch-context"
import { reservationService } from "@/lib/services/reservation-service"
import { ingredientService } from "@/lib/services/ingredient-service"
import { productService } from "@/lib/services/product-service"
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface InventoryValueChartProps {
  isLoading?: boolean
  dateRange: { from: Date; to: Date }
}

export function InventoryValueChart({ isLoading = false, dateRange }: InventoryValueChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("combined")
  const { effectiveBranchId } = useBranch()

  useEffect(() => {
    const fetchInventoryValueData = async () => {
      if (!effectiveBranchId || isLoading) return

      try {
        setLoading(true)

        // Buscar dados históricos de estoque (simulado para demonstração)
        // Em um sistema real, você precisaria armazenar snapshots históricos

        // Buscar dados atuais
        const ingredients = await ingredientService.getAll(effectiveBranchId)
        const products = await productService.getAllProductsForBranch(effectiveBranchId)
        const reservations = await reservationService.getAll(effectiveBranchId)

        // Calcular valores atuais
        const ingredientsValue = ingredients.reduce((sum, ing) => sum + (ing.stock || 0) * (ing.unitCost || 0), 0)

        const productsValue = products.reduce((sum, prod) => {
          if (prod.sizes && prod.sizes.length > 0) {
            const avgPrice = prod.sizes.reduce((sum, size) => sum + size.price, 0) / prod.sizes.length
            return sum + (prod.stock || 0) * avgPrice
          }
          return sum + (prod.stock || 0) * (prod.price || 0)
        }, 0)

        const pendingReservations = reservations.filter((r) => r.status === "pending")
        const reservationsValue = pendingReservations.reduce((sum, r) => {
          if (r.hasAdvancePayment && r.remainingAmount) {
            return sum + r.remainingAmount
          }
          return sum + r.total
        }, 0)

        // Gerar dados históricos simulados
        // Em um sistema real, você buscaria esses dados do banco
        const today = new Date()
        const daysInRange = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))

        let intervals
        let dateFormat

        // Determinar o intervalo com base no período selecionado
        if (daysInRange <= 31) {
          // Para períodos curtos, mostrar dados diários
          intervals = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
          dateFormat = "dd/MM"
        } else if (daysInRange <= 90) {
          // Para períodos médios, mostrar dados semanais
          intervals = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to })
          dateFormat = "'Sem' w"
        } else {
          // Para períodos longos, mostrar dados mensais
          intervals = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to })
          dateFormat = "MMM/yy"
        }

        // Gerar dados simulados para cada intervalo
        const data = intervals.map((date, index) => {
          // Variação aleatória para simular mudanças no estoque
          const randomFactor = 0.9 + Math.random() * 0.2

          // Se for o último dia (hoje), usar valores reais
          if (isSameDay(date, today)) {
            return {
              date: format(date, dateFormat, { locale: ptBR }),
              ingredientes: ingredientsValue,
              produtos: productsValue,
              reservas: reservationsValue,
              total: ingredientsValue + productsValue + reservationsValue,
            }
          }

          // Caso contrário, simular valores históricos
          // Quanto mais antigo, menor o valor (simulando crescimento)
          const ageFactor = 0.7 + (index / intervals.length) * 0.3

          return {
            date: format(date, dateFormat, { locale: ptBR }),
            ingredientes: Math.round(ingredientsValue * ageFactor * randomFactor),
            produtos: Math.round(productsValue * ageFactor * randomFactor),
            reservas: Math.round(reservationsValue * ageFactor * randomFactor * 0.8),
            total: Math.round((ingredientsValue + productsValue + reservationsValue) * ageFactor * randomFactor),
          }
        })

        setChartData(data)
      } catch (error) {
        console.error("Erro ao carregar dados de valor de estoque:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryValueData()
  }, [effectiveBranchId, isLoading, dateRange])

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Evolução do Capital Retido</CardTitle>
        <CardDescription>Acompanhamento do valor retido em estoque e reservas ao longo do tempo</CardDescription>
        <Tabs defaultValue="combined" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="combined">Combinado</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="reservations">Reservas</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="w-full h-[350px] flex items-center justify-center">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `R$${value.toLocaleString("pt-BR")}`} width={80} />
              <Tooltip
                formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, ""]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Legend />
              {activeTab === "combined" && (
                <>
                  <Bar dataKey="ingredientes" name="Ingredientes" fill="#8884d8" stackId="a" />
                  <Bar dataKey="produtos" name="Produtos" fill="#82ca9d" stackId="a" />
                  <Bar dataKey="reservas" name="Reservas" fill="#ffc658" stackId="a" />
                </>
              )}
              {activeTab === "ingredients" && <Bar dataKey="ingredientes" name="Ingredientes" fill="#8884d8" />}
              {activeTab === "products" && <Bar dataKey="produtos" name="Produtos" fill="#82ca9d" />}
              {activeTab === "reservations" && <Bar dataKey="reservas" name="Reservas" fill="#ffc658" />}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
