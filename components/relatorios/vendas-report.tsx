"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { reportService } from "@/lib/services/report-service"
import { SalesReportChart } from "./sales-report-chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface VendasReportProps {
  dateRange: {
    from: Date
    to: Date
  }
}

export function VendasReport({ dateRange }: VendasReportProps) {
  const [salesData, setSalesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageTicket: 0,
    topProducts: [] as { name: string; quantity: number; revenue: number }[],
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const data = await reportService.getVendasReport(dateRange.from, dateRange.to)
        setSalesData(data)

        // Calcular resumo
        const totalSales = data.length
        const totalRevenue = data.reduce((sum, sale) => sum + sale.total, 0)
        const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0

        // Produtos mais vendidos
        const productMap = new Map()
        data.forEach((sale) => {
          sale.items.forEach((item: any) => {
            const key = item.product.name
            if (!productMap.has(key)) {
              productMap.set(key, { quantity: 0, revenue: 0 })
            }
            const current = productMap.get(key)
            productMap.set(key, {
              quantity: current.quantity + item.quantity,
              revenue: current.revenue + item.price * item.quantity,
            })
          })
        })

        const topProducts = Array.from(productMap.entries())
          .map(([name, { quantity, revenue }]) => ({ name, quantity, revenue }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)

        setSummary({
          totalSales,
          totalRevenue,
          averageTicket,
          topProducts,
        })
      } catch (error) {
        console.error("Erro ao carregar dados de vendas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(summary.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(summary.averageTicket)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Vendas no Período</CardTitle>
            <CardDescription>
              {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} até{" "}
              {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesReportChart data={salesData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.topProducts.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">{product.quantity}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(product.revenue)}
                  </TableCell>
                </TableRow>
              ))}
              {summary.topProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    Nenhum produto vendido no período selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Forma de Pagamento</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.map((sale, index) => (
                <TableRow key={index}>
                  <TableCell>{format(new Date(sale.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                  <TableCell>{sale.customer?.name || "Cliente não identificado"}</TableCell>
                  <TableCell>{sale.items.length}</TableCell>
                  <TableCell>{sale.paymentMethod}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(sale.total)}
                  </TableCell>
                </TableRow>
              ))}
              {salesData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    Nenhuma venda no período selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
