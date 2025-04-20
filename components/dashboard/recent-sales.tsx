"use client"

import { useEffect, useState } from "react"
import { saleService } from "@/lib/services/sale-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Sale {
  id: string
  date: Date
  total: number
  items: any[]
  customerId?: string
  customerName?: string
}

export function RecentSales({ isLoading }: { isLoading?: boolean }) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const { effectiveBranchId } = useBranch()

  useEffect(() => {
    const fetchRecentSales = async () => {
      if (!effectiveBranchId) return

      try {
        setLoading(true)
        const recentSales = await saleService.getRecent(effectiveBranchId, 5)
        setSales(recentSales)
      } catch (error) {
        console.error("Erro ao carregar vendas recentes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentSales()
  }, [effectiveBranchId])

  const actualLoading = isLoading || loading

  return (
    <div className="space-y-8">
      {actualLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="ml-4 space-y-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <div className="ml-auto">
                <Skeleton className="h-4 w-[80px]" />
              </div>
            </div>
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">Nenhuma venda recente</div>
      ) : (
        sales.map((sale) => (
          <div key={sale.id} className="flex items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">{sale.customerName || "Cliente não identificado"}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(sale.date), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
            <div className="ml-auto font-medium">R$ {sale.total.toFixed(2)}</div>
          </div>
        ))
      )}
    </div>
  )
}
