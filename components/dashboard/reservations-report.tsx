"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, DollarSign, Package, User } from "lucide-react"
import { useBranch } from "@/lib/contexts/branch-context"
import { reservationService, type Reservation } from "@/lib/services/reservation-service"
import { format, isToday, isThisWeek, isThisMonth, isAfter, isBefore, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
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

interface ReservationsReportProps {
  isLoading?: boolean
  dateRange?: { from: Date; to: Date }
}

export function ReservationsReport({ isLoading = false, dateRange }: ReservationsReportProps) {
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const { effectiveBranchId } = useBranch()

  // Cores para os gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]
  const STATUS_COLORS = {
    pending: "#FFBB28",
    completed: "#00C49F",
    cancelled: "#FF8042",
  }

  useEffect(() => {
    const fetchReservations = async () => {
      if (!effectiveBranchId || isLoading) return

      try {
        setLoading(true)

        // Buscar todas as reservas da filial
        const allReservations = await reservationService.getAll(effectiveBranchId)

        // Filtrar por período se dateRange for fornecido
        let filteredReservations = allReservations
        if (dateRange?.from && dateRange?.to) {
          filteredReservations = allReservations.filter((reservation) => {
            const reservationDate =
              reservation.date instanceof Date ? reservation.date : new Date(reservation.date.seconds * 1000)

            return isAfter(reservationDate, dateRange.from) && isBefore(reservationDate, addDays(dateRange.to, 1))
          })
        }

        setReservations(filteredReservations)
      } catch (error) {
        console.error("Erro ao buscar reservas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [effectiveBranchId, isLoading, dateRange])

  // Função para formatar data do Firebase
  const formatFirebaseDate = (date: any): Date => {
    if (date instanceof Date) return date
    if (date && date.seconds) return new Date(date.seconds * 1000)
    return new Date()
  }

  // Calcular métricas de reservas
  const calculateMetrics = () => {
    const total = reservations.length
    const pendingCount = reservations.filter((r) => r.status === "pending").length
    const completedCount = reservations.filter((r) => r.status === "completed").length
    const cancelledCount = reservations.filter((r) => r.status === "cancelled").length

    const pendingValue = reservations
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => {
        // Se tiver pagamento adiantado, considerar apenas o valor restante
        if (r.hasAdvancePayment && r.remainingAmount) {
          return sum + r.remainingAmount
        }
        return sum + r.total
      }, 0)

    const todayReservations = reservations.filter((r) => {
      const date = formatFirebaseDate(r.date)
      return isToday(date)
    }).length

    const thisWeekReservations = reservations.filter((r) => {
      const date = formatFirebaseDate(r.date)
      return isThisWeek(date)
    }).length

    const thisMonthReservations = reservations.filter((r) => {
      const date = formatFirebaseDate(r.date)
      return isThisMonth(date)
    }).length

    return {
      total,
      pendingCount,
      completedCount,
      cancelledCount,
      pendingValue,
      todayReservations,
      thisWeekReservations,
      thisMonthReservations,
    }
  }

  // Preparar dados para o gráfico de status
  const prepareStatusChartData = () => {
    const metrics = calculateMetrics()
    return [
      { name: "Pendentes", value: metrics.pendingCount, color: STATUS_COLORS.pending },
      { name: "Concluídas", value: metrics.completedCount, color: STATUS_COLORS.completed },
      { name: "Canceladas", value: metrics.cancelledCount, color: STATUS_COLORS.cancelled },
    ]
  }

  // Preparar dados para o gráfico de reservas por dia da semana
  const prepareWeekdayChartData = () => {
    const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
    const counts = Array(7).fill(0)

    reservations.forEach((reservation) => {
      const date = formatFirebaseDate(reservation.date)
      const dayOfWeek = date.getDay()
      counts[dayOfWeek]++
    })

    return weekdays.map((day, index) => ({
      name: day,
      reservas: counts[index],
    }))
  }

  // Preparar dados para o gráfico de produtos mais reservados
  const prepareProductsChartData = () => {
    const productCounts: Record<string, { count: number; value: number }> = {}

    reservations.forEach((reservation) => {
      if (reservation.items && Array.isArray(reservation.items)) {
        reservation.items.forEach((item) => {
          const productName = item.productName || "Produto sem nome"
          if (!productCounts[productName]) {
            productCounts[productName] = { count: 0, value: 0 }
          }
          productCounts[productName].count += item.quantity || 0
          productCounts[productName].value += (item.price || 0) * (item.quantity || 0)
        })
      } else if (reservation.productName) {
        // Para reservas antigas que não usam o array items
        const productName = reservation.productName
        if (!productCounts[productName]) {
          productCounts[productName] = { count: 0, value: 0 }
        }
        productCounts[productName].count += reservation.quantity || 0
        productCounts[productName].value += (reservation.price || 0) * (reservation.quantity || 0)
      }
    })

    return Object.entries(productCounts)
      .map(([name, data]) => ({
        name,
        quantidade: data.count,
        valor: data.value,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)
  }

  // Formatar nome do produto para o gráfico
  const formatProductName = (name: string) => {
    if (name.length <= 20) return name
    return name.substring(0, 17) + "..."
  }

  const metrics = calculateMetrics()
  const statusChartData = prepareStatusChartData()
  const weekdayChartData = prepareWeekdayChartData()
  const productsChartData = prepareProductsChartData()

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="products">Produtos Reservados</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Cards de métricas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{metrics.total}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.pendingCount} pendentes, {metrics.completedCount} concluídas
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor a Receber</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">R$ {metrics.pendingValue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">De {metrics.pendingCount} reservas pendentes</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reservas Hoje</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{metrics.todayReservations}</div>
                    <p className="text-xs text-muted-foreground">{metrics.thisWeekReservations} esta semana</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {metrics.total > 0 ? `${Math.round((metrics.completedCount / metrics.total) * 100)}%` : "0%"}
                    </div>
                    <p className="text-xs text-muted-foreground">{metrics.cancelledCount} reservas canceladas</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de status e dia da semana */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status das Reservas</CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} reservas`, "Quantidade"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reservas por Dia da Semana</CardTitle>
                <CardDescription>Distribuição ao longo da semana</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={weekdayChartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 30,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value} reservas`, "Quantidade"]} />
                      <Bar dataKey="reservas" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lista de próximas reservas */}
          <Card>
            <CardHeader>
              <CardTitle>Próximas Reservas</CardTitle>
              <CardDescription>Reservas pendentes mais próximas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations
                    .filter((r) => r.status === "pending")
                    .sort((a, b) => {
                      const dateA = formatFirebaseDate(a.date)
                      const dateB = formatFirebaseDate(b.date)
                      return dateA.getTime() - dateB.getTime()
                    })
                    .slice(0, 5)
                    .map((reservation, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{reservation.customerName || "Cliente não informado"}</span>
                          <span className="text-sm text-muted-foreground">
                            {format(formatFirebaseDate(reservation.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">R$ {reservation.total.toFixed(2)}</span>
                          <Badge variant="outline" className="bg-yellow-100">
                            Pendente
                          </Badge>
                        </div>
                      </div>
                    ))}

                  {reservations.filter((r) => r.status === "pending").length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">Não há reservas pendentes</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Reservados</CardTitle>
              <CardDescription>Top 10 produtos com mais reservas</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={productsChartData}
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 200,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={200}
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatProductName}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === "quantidade") return [`${value} unidades`, "Quantidade"]
                        if (name === "valor") return [`R$ ${value.toFixed(2)}`, "Valor Total"]
                        return [value, name]
                      }}
                      labelFormatter={(label) => label}
                    />
                    <Legend />
                    <Bar dataKey="quantidade" name="Quantidade" fill="#8884d8" />
                    <Bar dataKey="valor" name="Valor Total (R$)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes dos Produtos Reservados</CardTitle>
              <CardDescription>Informações detalhadas sobre os produtos mais reservados</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Produto
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Quantidade
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Valor Total
                        </th>
                        <th scope="col" className="px-6 py-3">
                          % do Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsChartData.map((product, index) => {
                        const totalQuantity = productsChartData.reduce((sum, p) => sum + p.quantidade, 0)
                        const percentOfTotal = (product.quantidade / totalQuantity) * 100

                        return (
                          <tr key={index} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium">{product.name}</td>
                            <td className="px-6 py-4">{product.quantidade} un</td>
                            <td className="px-6 py-4">R$ {product.valor.toFixed(2)}</td>
                            <td className="px-6 py-4">{percentOfTotal.toFixed(1)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendências de Reservas</CardTitle>
              <CardDescription>Análise de tendências ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : (
                <div className="text-center py-10">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Análise de tendências em desenvolvimento</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Esta funcionalidade estará disponível em breve.</p>
                  <Button variant="outline" className="mt-4">
                    Notificar quando disponível
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
