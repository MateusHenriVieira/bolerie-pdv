"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, PrinterIcon, Download } from "lucide-react"
import { VendasReport, ProdutosReport, EstoqueReport, FinanceiroReport } from "@/components/relatorios"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { exportToExcel } from "@/lib/excel-export"
import { reportService } from "@/lib/services/report-service"
import { toast } from "@/components/ui/use-toast"

export default function RelatoriosPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date
    to: Date
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })

  const [activeTab, setActiveTab] = useState("vendas")
  const [isExporting, setIsExporting] = useState(false)

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true)

      let reportData

      switch (activeTab) {
        case "vendas":
          reportData = await reportService.getVendasReport(dateRange.from, dateRange.to)
          await exportToExcel("Vendas", reportData, dateRange)
          break
        case "produtos":
          reportData = await reportService.getProdutosReport(dateRange.from, dateRange.to)
          await exportToExcel("Produtos", reportData, dateRange)
          break
        case "estoque":
          reportData = await reportService.getEstoqueReport()
          await exportToExcel("Estoque", reportData, dateRange)
          break
        case "financeiro":
          reportData = await reportService.getFinanceiroReport(dateRange.from, dateRange.to)
          await exportToExcel("Financeiro", reportData, dateRange)
          break
      }

      toast({
        title: "Relatório exportado com sucesso",
        description: "O arquivo Excel foi gerado e baixado.",
        variant: "default",
      })
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
      toast({
        title: "Erro ao exportar relatório",
        description: "Ocorreu um erro ao gerar o arquivo Excel.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <h1 className="text-3xl font-bold">Relatórios</h1>

      <div className="flex justify-between items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 h-10">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  setDateRange(range as { from: Date; to: Date })
                }
              }}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" title="Imprimir" onClick={() => window.print()}>
            <PrinterIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Exportar para Excel"
            onClick={handleExportToExcel}
            disabled={isExporting}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="vendas" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-background border">
          <TabsTrigger value="vendas" className="data-[state=active]:bg-muted">
            Vendas
          </TabsTrigger>
          <TabsTrigger value="produtos" className="data-[state=active]:bg-muted">
            Produtos
          </TabsTrigger>
          <TabsTrigger value="estoque" className="data-[state=active]:bg-muted">
            Estoque
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="data-[state=active]:bg-muted">
            Financeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-4">
          <VendasReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="produtos" className="space-y-4">
          <ProdutosReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="estoque" className="space-y-4">
          <EstoqueReport dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <FinanceiroReport dateRange={dateRange} />
        </TabsContent>
      </Tabs>

      <footer className="text-center text-sm text-muted-foreground mt-8 pb-4">
        <p>© 2025 Bolerie. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-4 mt-1">
          <a href="#" className="hover:underline">
            Termos
          </a>
          <a href="#" className="hover:underline">
            Privacidade
          </a>
          <a href="#" className="hover:underline">
            Suporte
          </a>
        </div>
      </footer>
    </div>
  )
}
