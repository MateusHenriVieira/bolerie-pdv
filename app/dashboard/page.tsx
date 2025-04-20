"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/dashboard/overview"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { InventoryAlert } from "@/components/dashboard/inventory-alert"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { SalesReportDashboard } from "@/components/dashboard/sales-report-dashboard"
import { ProductAnalytics } from "@/components/dashboard/product-analytics"
import { CustomerAnalytics } from "@/components/dashboard/customer-analytics"
import { FinancialMetrics } from "@/components/dashboard/financial-metrics"
import { InventoryValueChart } from "@/components/dashboard/inventory-value-chart"
import { ReservationsReport } from "@/components/dashboard/reservations-report"
import { DateRangePicker } from "@/components/date-range-picker"
import { useToast } from "@/hooks/use-toast"
import { useBranch } from "@/lib/contexts/branch-context"
import { Button } from "@/components/ui/button"
import { subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from "date-fns"

export default function Dashboard() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const { currentBranch } = useBranch()
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [reportPeriod, setReportPeriod] = useState<"weekly" | "monthly" | "yearly">("weekly")
  const [reportType, setReportType] = useState<"sales" | "reservations" | "inventory">("sales")

  useEffect(() => {
    // Simulando carregamento de dados
    const timer = setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Sistema inicializado",
        description: `Bem-vindo ao PDV ${currentBranch?.name || "Bolerie"}!`,
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [toast, currentBranch])

  // Função para atualizar o período do relatório
  const handlePeriodChange = (period: "weekly" | "monthly" | "yearly") => {
    setReportPeriod(period)

    const today = new Date()
    let from, to

    switch (period) {
      case "weekly":
        from = subDays(today, 7)
        to = today
        break
      case "monthly":
        from = startOfMonth(today)
        to = endOfMonth(today)
        break
      case "yearly":
        from = startOfYear(today)
        to = endOfYear(today)
        break
    }

    setDateRange({ from, to })
  }

  // Adicione esta nova função após handlePeriodChange
  const handleQuickDateSelect = (preset: string) => {
    const today = new Date()
    let from, to

    switch (preset) {
      case "today":
        from = startOfDay(today)
        to = endOfDay(today)
        break
      case "yesterday":
        const yesterday = subDays(today, 1)
        from = startOfDay(yesterday)
        to = endOfDay(yesterday)
        break
      case "last7days":
        from = subDays(today, 7)
        to = today
        setReportPeriod("weekly")
        break
      case "last30days":
        from = subDays(today, 30)
        to = today
        break
      case "thisMonth":
        from = startOfMonth(today)
        to = endOfMonth(today)
        setReportPeriod("monthly")
        break
      case "lastMonth":
        const lastMonth = subMonths(today, 1)
        from = startOfMonth(lastMonth)
        to = endOfMonth(lastMonth)
        setReportPeriod("monthly")
        break
      case "thisYear":
        from = startOfYear(today)
        to = endOfYear(today)
        setReportPeriod("yearly")
        break
      default:
        return
    }

    setDateRange({ from, to })
  }

  // Agora, vamos criar um componente de seleção de período para reutilizar
  const PeriodSelector = () => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect("today")}>
          Hoje
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect("yesterday")}>
          Ontem
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect("last7days")}>
          Últimos 7 dias
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickDateSelect("thisMonth")}>
          Este mês
        </Button>
      </div>
      <DateRangePicker
        date={dateRange}
        onUpdate={(range) => {
          if (range.from && range.to) {
            setDateRange({ from: range.from, to: range.to })
          }
        }}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">Visão geral do seu negócio, vendas e estoque.</p>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Análise</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <DashboardStats isLoading={isLoading} />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Vendas Semanais</CardTitle>
                <CardDescription>Comparativo de vendas dos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview isLoading={isLoading} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Vendas Recentes</CardTitle>
                <CardDescription>Últimas vendas realizadas hoje</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>

          <InventoryAlert isLoading={isLoading} />

          <FinancialMetrics isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold">Análise Detalhada</h2>
              <PeriodSelector />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ProductAnalytics isLoading={isLoading} dateRange={dateRange} />
              <CustomerAnalytics isLoading={isLoading} dateRange={dateRange} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold">Relatórios</h2>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setReportType("sales")}
                    className={`px-3 py-1 rounded-md ${reportType === "sales" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    Vendas
                  </button>
                  <button
                    onClick={() => setReportType("reservations")}
                    className={`px-3 py-1 rounded-md ${reportType === "reservations" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    Reservas
                  </button>
                  <button
                    onClick={() => setReportType("inventory")}
                    className={`px-3 py-1 rounded-md ${reportType === "inventory" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    Estoque
                  </button>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePeriodChange("weekly")}
                      className={`px-3 py-1 rounded-md ${reportPeriod === "weekly" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      Semanal
                    </button>
                    <button
                      onClick={() => handlePeriodChange("monthly")}
                      className={`px-3 py-1 rounded-md ${reportPeriod === "monthly" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      Mensal
                    </button>
                    <button
                      onClick={() => handlePeriodChange("yearly")}
                      className={`px-3 py-1 rounded-md ${reportPeriod === "yearly" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      Anual
                    </button>
                  </div>
                  <PeriodSelector />
                </div>
              </div>
            </div>

            {/* Métricas financeiras atualizadas com o período selecionado */}
            <FinancialMetrics isLoading={isLoading} dateRange={dateRange} />

            {/* Relatórios baseados no tipo selecionado */}
            {reportType === "sales" && (
              <SalesReportDashboard isLoading={isLoading} dateRange={dateRange} period={reportPeriod} />
            )}

            {reportType === "reservations" && <ReservationsReport isLoading={isLoading} dateRange={dateRange} />}

            {reportType === "inventory" && (
              <>
                <InventoryValueChart isLoading={isLoading} dateRange={dateRange} />
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
