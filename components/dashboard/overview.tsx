"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { saleService } from "@/lib/services"
import { useBranch } from "@/lib/contexts/branch-context"

interface OverviewProps {
  isLoading?: boolean
}

export function Overview({ isLoading = false }: OverviewProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { currentBranch } = useBranch()

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!currentBranch?.id) {
          console.warn("Nenhuma filial selecionada ao buscar dados para o gráfico")
          setLoading(false)
          return
        }

        // Obter vendas da última semana
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const sales = await saleService.getByDateRange(weekAgo, now, currentBranch.id)

        // Agrupar vendas por dia
        const dailySales: Record<string, number> = {}
        const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

        // Inicializar todos os dias com zero
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dayName = days[date.getDay()]
          dailySales[dayName] = 0
        }

        // Somar vendas por dia
        sales.forEach((sale) => {
          const date = sale.date instanceof Date ? sale.date : new Date(sale.date)
          const dayName = days[date.getDay()]
          dailySales[dayName] = (dailySales[dayName] || 0) + sale.total
        })

        // Converter para o formato esperado pelo gráfico
        const chartData = Object.entries(dailySales).map(([name, total]) => ({
          name,
          total,
        }))

        setData(chartData)
        setLoading(false)
      } catch (error) {
        console.error("Erro ao buscar dados de vendas:", error)
        setLoading(false)
      }
    }

    if (!isLoading) {
      fetchData()
    }
  }, [isLoading, currentBranch])

  if (isLoading || loading) {
    return (
      <div className="h-[300px] w-full">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value}`}
        />
        <Tooltip
          formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Vendas"]}
          labelFormatter={(label) => `Dia: ${label}`}
        />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}
