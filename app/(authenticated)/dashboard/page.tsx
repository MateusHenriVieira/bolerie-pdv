import { Suspense } from "react"
import type { Metadata } from "next"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { InventoryAlert } from "@/components/dashboard/inventory-alert"
import { DateRangePicker } from "@/components/date-range-picker"
import { FinancialMetrics } from "@/components/dashboard/financial-metrics"
import { InventoryValueChart } from "@/components/dashboard/inventory-value-chart"
import { ProductInventoryDetail } from "@/components/dashboard/product-inventory-detail"
import { InventorySummary } from "@/components/dashboard/inventory-summary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Visão geral do seu negócio",
}

export default function DashboardPage() {
  // Data atual para o DateRangePicker
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <DateRangePicker initialDateFrom={thirtyDaysAgo} initialDateTo={today} align="end" />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
          <TabsTrigger value="analytics">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Suspense fallback={<FinancialMetrics isLoading />}>
            <FinancialMetrics />
          </Suspense>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Suspense
              fallback={
                <div className="col-span-4">
                  <DashboardStats isLoading />
                </div>
              }
            >
              <div className="col-span-4">
                <DashboardStats />
              </div>
            </Suspense>

            <Suspense
              fallback={
                <div className="col-span-3">
                  <RecentSales isLoading />
                </div>
              }
            >
              <div className="col-span-3">
                <RecentSales />
              </div>
            </Suspense>
          </div>

          <Suspense fallback={<InventoryAlert isLoading />}>
            <InventoryAlert />
          </Suspense>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Suspense fallback={<FinancialMetrics isLoading />}>
            <FinancialMetrics />
          </Suspense>

          <Suspense fallback={<InventoryValueChart isLoading dateRange={{ from: thirtyDaysAgo, to: today }} />}>
            <InventoryValueChart dateRange={{ from: thirtyDaysAgo, to: today }} />
          </Suspense>

          <Suspense fallback={<InventorySummary isLoading />}>
            <InventorySummary />
          </Suspense>

          <Suspense fallback={<ProductInventoryDetail isLoading />}>
            <ProductInventoryDetail />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Suspense fallback={<div>Carregando análises...</div>}>
            <div className="grid gap-4">
              {/* Componentes de análise serão adicionados aqui */}
              <div className="p-8 text-center">
                <h3 className="text-xl font-medium mb-2">Análises Avançadas</h3>
                <p className="text-muted-foreground">
                  Componentes de análise detalhada serão implementados nesta seção.
                </p>
              </div>
            </div>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
