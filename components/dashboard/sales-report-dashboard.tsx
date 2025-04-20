"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useBranch } from "@/lib/contexts/branch-context"
import { saleService } from "@/lib/services/sale-service"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfWeek,
  endOfWeek,
  parseISO,
  isValid,
  differenceInDays,
} from "date-fns"
import { ptBR } from "date-fns/locale"

interface SalesReportDashboardProps {
  isLoading?: boolean
  dateRange: { from: Date; to: Date }
  period: "weekly" | "monthly" | "yearly"
}

interface SalesByDay {
  date: string
  total: number
  count: number
  avgTicket: number
}

interface SalesByPaymentMethod {
  method: string
  total: number
  count: number
  percentage: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

export function SalesReportDashboard({ isLoading = false, dateRange, period }: SalesReportDashboardProps) {
  const [salesData, setSalesData] = useState<SalesByDay[]>([])
  const [paymentMethodData, setPaymentMethodData] = useState<SalesByPaymentMethod[]>([])
  const [bestDays, setBestDays] = useState<SalesByDay[]>([])
  const [loading, setLoading] = useState(true)
  const { effectiveBranchId } = useBranch()
  const [reportType, setReportType] = useState<"sales" | "tickets" | "count">("sales")

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!effectiveBranchId || isLoading || !dateRange.from || !dateRange.to) return

      try {
        setLoading(true)

        // Buscar vendas no período selecionado
        const sales = await saleService.getByDateRange(dateRange.from, dateRange.to, effectiveBranchId)

        // Agrupar vendas por dia, semana ou mês dependendo do período
        const groupedSales: Record<string, { total: number; count: number }> = {}

        // Inicializar todos os períodos com zero
        let intervals: Date[] = []

        if (period === "weekly") {
          // Para períodos curtos (até 31 dias), mostrar por dia
          const dayDiff = differenceInDays(dateRange.to, dateRange.from)
          if (dayDiff <= 31) {
            intervals = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
            intervals.forEach((date) => {
              const key = format(date, "yyyy-MM-dd")
              groupedSales[key] = { total: 0, count: 0 }
            })
          } else {
            // Para períodos mais longos, agrupar por semana
            intervals = eachWeekOfInterval(
              { start: dateRange.from, end: dateRange.to },
              { weekStartsOn: 0 }, // Domingo como início da semana
            )
            intervals.forEach((date) => {
              const weekStart = startOfWeek(date, { weekStartsOn: 0 })
              const weekEnd = endOfWeek(date, { weekStartsOn: 0 })
              const key = `${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}`
              groupedSales[key] = { total: 0, count: 0 }
            })
          }
        } else if (period === "monthly") {
          intervals = eachWeekOfInterval(
            { start: dateRange.from, end: dateRange.to },
            { weekStartsOn: 0 }, // Domingo como início da semana
          )
          intervals.forEach((date) => {
            const weekStart = startOfWeek(date, { weekStartsOn: 0 })
            const weekEnd = endOfWeek(date, { weekStartsOn: 0 })
            const key = `${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}`
            groupedSales[key] = { total: 0, count: 0 }
          })
        } else if (period === "yearly") {
          intervals = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to })
          intervals.forEach((date) => {
            const key = format(date, "MMM", { locale: ptBR })
            groupedSales[key] = { total: 0, count: 0 }
          })
        }

        // Agrupar vendas por período
        sales.forEach((sale) => {
          const saleDate = sale.date instanceof Date ? sale.date : new Date(sale.date)

          let key: string
          if (period === "weekly") {
            // Para períodos curtos (até 31 dias), mostrar por dia
            const dayDiff = differenceInDays(dateRange.to, dateRange.from)
            if (dayDiff <= 31) {
              key = format(saleDate, "yyyy-MM-dd")
            } else {
              // Para períodos mais longos, agrupar por semana
              const weekStart = startOfWeek(saleDate, { weekStartsOn: 0 })
              const weekEnd = endOfWeek(saleDate, { weekStartsOn: 0 })
              key = `${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}`
            }
          } else if (period === "monthly") {
            const weekStart = startOfWeek(saleDate, { weekStartsOn: 0 })
            const weekEnd = endOfWeek(saleDate, { weekStartsOn: 0 })
            key = `${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}`
          } else {
            key = format(saleDate, "MMM", { locale: ptBR })
          }

          if (!groupedSales[key]) {
            groupedSales[key] = { total: 0, count: 0 }
          }

          groupedSales[key].total += sale.total || 0
          groupedSales[key].count += 1
        })

        // Converter para o formato esperado pelo gráfico
        const formattedData = Object.entries(groupedSales).map(([date, data]) => ({
          date,
          total: data.total,
          count: data.count,
          avgTicket: data.count > 0 ? data.total / data.count : 0,
        }))

        // Ordenar por data
        const sortedData = formattedData.sort((a, b) => {
          // Para período semanal com dias, ordenar por data
          if (period === "weekly" && a.date.includes("-") && b.date.includes("-")) {
            return parseISO(a.date).getTime() - parseISO(b.date).getTime()
          }
          // Para outros períodos, manter a ordem original
          return 0
        })

        // Encontrar os melhores dias (por total de vendas)
        const bestDaysByTotal = [...formattedData].sort((a, b) => b.total - a.total).slice(0, 5)

        // Agrupar vendas por método de pagamento
        const paymentMethods: Record<string, { total: number; count: number }> = {}

        sales.forEach((sale) => {
          const method = sale.paymentMethod || "Não especificado"

          if (!paymentMethods[method]) {
            paymentMethods[method] = { total: 0, count: 0 }
          }

          paymentMethods[method].total += sale.total || 0
          paymentMethods[method].count += 1
        })

        // Calcular o total geral para percentuais
        const totalSales = Object.values(paymentMethods).reduce((sum, data) => sum + data.total, 0)

        // Converter para o formato esperado pelo gráfico
        const formattedPaymentData = Object.entries(paymentMethods).map(([method, data]) => ({
          method,
          total: data.total,
          count: data.count,
          percentage: totalSales > 0 ? (data.total / totalSales) * 100 : 0,
        }))

        // Ordenar por total
        const sortedPaymentData = formattedPaymentData.sort((a, b) => b.total - a.total)

        setSalesData(sortedData)
        setPaymentMethodData(sortedPaymentData)
        setBestDays(bestDaysByTotal)
      } catch (error) {
        console.error("Erro ao carregar dados de vendas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [effectiveBranchId, isLoading, dateRange, period])

  // Função para formatar o tooltip do gráfico
  const formatTooltip = (value: number, name: string) => {
    if (name === "total") return [`R$ ${value.toFixed(2)}`, "Total"]
    if (name === "avgTicket") return [`R$ ${value.toFixed(2)}`, "Ticket Médio"]
    if (name === "count") return [value, "Quantidade"]
    return [value, name]
  }

  // Função para formatar o eixo Y
  const formatYAxis = (value: number) => {
    if (reportType === "sales" || reportType === "tickets") {
      return `R$${value}`
    }
    return value
  }

  // Função para renderizar o gráfico correto baseado no tipo de relatório
  const renderChart = () => {
    if (loading) {
      return <Skeleton className="h-[400px] w-full" />
    }

    if (reportType === "sales" || reportType === "tickets") {
      const dataKey = reportType === "sales" ? "total" : "avgTicket"

      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={salesData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                if (period === "weekly") {
                  // Para período semanal, mostrar dia da semana
                  try {
                    const date = parseISO(value)
                    if (isValid(date)) {
                      return format(date, "EEE", { locale: ptBR })
                    }
                  } catch (e) {}
                }
                return value
              }}
            />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
            <Tooltip formatter={formatTooltip} labelFormatter={(label) => `Período: ${label}`} />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    // Gráfico de quantidade de vendas
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={salesData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              if (period === "weekly") {
                // Para período semanal, mostrar dia da semana
                try {
                  const date = parseISO(value)
                  if (isValid(date)) {
                    return format(date, "EEE", { locale: ptBR })
                  }
                } catch (e) {}
              }
              return value
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={formatTooltip} labelFormatter={(label) => `Período: ${label}`} />
          <Legend />
          <Bar dataKey="count" fill="#82ca9d" name="Quantidade de Vendas" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatório de Vendas</CardTitle>
              <CardDescription>
                {period === "weekly" ? "Vendas diárias" : period === "monthly" ? "Vendas semanais" : "Vendas mensais"}
              </CardDescription>
            </div>
            <Tabs
              defaultValue="sales"
              className="w-[400px]"
              onValueChange={(value) => setReportType(value as "sales" | "tickets" | "count")}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sales">Vendas (R$)</TabsTrigger>
                <TabsTrigger value="tickets">Ticket Médio</TabsTrigger>
                <TabsTrigger value="count">Quantidade</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>{renderChart()}</CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Melhores Dias de Venda</CardTitle>
            <CardDescription>Dias com maior volume de vendas no período</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bestDays} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `R$${value}`} />
                  <YAxis
                    dataKey="date"
                    type="category"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (period === "weekly") {
                        // Para período semanal, mostrar dia da semana
                        try {
                          const date = parseISO(value)
                          if (isValid(date)) {
                            return format(date, "dd/MM (EEE)", { locale: ptBR })
                          }
                        } catch (e) {}
                      }
                      return value
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Total"]}
                    labelFormatter={(label) => `Dia: ${label}`}
                  />
                  <Bar dataKey="total" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Método de Pagamento</CardTitle>
            <CardDescription>Distribuição de vendas por forma de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="method"
                    label={({ method, percentage }) => `${method}: ${percentage.toFixed(1)}%`}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name, props) => {
                      const entry = props.payload
                      return [`R$ ${value.toFixed(2)} (${entry.percentage.toFixed(1)}%)`, entry.method]
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
