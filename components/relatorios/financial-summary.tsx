"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownIcon, ArrowUpIcon, DollarSign } from "lucide-react"

export function FinancialSummary() {
  return (
    <Tabs defaultValue="month">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mês</TabsTrigger>
          <TabsTrigger value="year">Ano</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="week" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FinancialCard
            title="Receita"
            value="R$ 3.250,00"
            description="+5% em relação à semana anterior"
            trend="up"
          />
          <FinancialCard
            title="Despesas"
            value="R$ 1.450,00"
            description="-2% em relação à semana anterior"
            trend="down"
          />
          <FinancialCard title="Lucro" value="R$ 1.800,00" description="+12% em relação à semana anterior" trend="up" />
          <FinancialCard
            title="Ticket Médio"
            value="R$ 65,00"
            description="+3% em relação à semana anterior"
            trend="up"
          />
        </div>
      </TabsContent>

      <TabsContent value="month" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FinancialCard title="Receita" value="R$ 12.850,00" description="+8% em relação ao mês anterior" trend="up" />
          <FinancialCard title="Despesas" value="R$ 5.750,00" description="+2% em relação ao mês anterior" trend="up" />
          <FinancialCard title="Lucro" value="R$ 7.100,00" description="+15% em relação ao mês anterior" trend="up" />
          <FinancialCard
            title="Ticket Médio"
            value="R$ 68,50"
            description="+5% em relação ao mês anterior"
            trend="up"
          />
        </div>
      </TabsContent>

      <TabsContent value="year" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FinancialCard
            title="Receita"
            value="R$ 145.200,00"
            description="+22% em relação ao ano anterior"
            trend="up"
          />
          <FinancialCard
            title="Despesas"
            value="R$ 68.500,00"
            description="+15% em relação ao ano anterior"
            trend="up"
          />
          <FinancialCard title="Lucro" value="R$ 76.700,00" description="+28% em relação ao ano anterior" trend="up" />
          <FinancialCard
            title="Ticket Médio"
            value="R$ 72,30"
            description="+10% em relação ao ano anterior"
            trend="up"
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}

interface FinancialCardProps {
  title: string
  value: string
  description: string
  trend: "up" | "down"
}

function FinancialCard({ title, value, description, trend }: FinancialCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center mt-1">
          {trend === "up" ? (
            <ArrowUpIcon className="h-4 w-4 text-emerald-500 mr-1" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-rose-500 mr-1" />
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
