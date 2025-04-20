"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { SalesReportChart } from "@/components/relatorios/sales-report-chart"
import { ProductsReportChart } from "@/components/relatorios/products-report-chart"
import { FinancialSummary } from "@/components/relatorios/financial-summary"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function RelatoriosPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
      <p className="text-muted-foreground">Visualize relatórios detalhados sobre vendas, produtos e finanças.</p>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Período</Label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select defaultValue="sales">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="products">Produtos</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Gerar Relatório</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <SalesReportChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Produtos</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ProductsReportChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <FinancialSummary />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
