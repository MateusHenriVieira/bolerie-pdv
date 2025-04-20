import ExcelJS from "exceljs"
import { saveAs } from "file-saver"

// Função para exportar dados para Excel com gráficos
export async function exportToExcel(reportType: string, data: any, dateRange: { from: Date; to: Date }) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(`Relatório de ${reportType}`)

  // Formatação de cabeçalho
  worksheet.getRow(1).font = { bold: true, size: 14, color: { argb: "4F4F4F" } }
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" }

  // Adicionar título do relatório
  worksheet.mergeCells("A1:G1")
  worksheet.getCell("A1").value =
    `Relatório de ${reportType} - ${dateRange.from.toLocaleDateString("pt-BR")} a ${dateRange.to.toLocaleDateString("pt-BR")}`
  worksheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "4F4F4F" } }
  worksheet.getRow(1).height = 30

  // Configurar dados específicos para cada tipo de relatório
  switch (reportType) {
    case "Vendas":
      exportVendasReport(worksheet, data)
      break
    case "Produtos":
      exportProdutosReport(worksheet, data)
      break
    case "Estoque":
      exportEstoqueReport(worksheet, data)
      break
    case "Financeiro":
      exportFinanceiroReport(worksheet, data)
      break
    default:
      throw new Error(`Tipo de relatório não suportado: ${reportType}`)
  }

  // Ajustar largura das colunas
  worksheet.columns.forEach((column) => {
    column.width = 20
  })

  // Gerar arquivo
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  saveAs(blob, `relatorio-${reportType.toLowerCase()}-${new Date().toISOString().split("T")[0]}.xlsx`)
}

// Função para exportar relatório de vendas
function exportVendasReport(worksheet: ExcelJS.Worksheet, data: any) {
  // Adicionar dados de métricas
  worksheet.addRow([])
  worksheet.addRow(["Métricas Principais", ""])
  worksheet.getRow(worksheet.rowCount).font = { bold: true }

  worksheet.addRow(["Total de Vendas", `R$ ${data.totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`])
  worksheet.addRow(["Número de Pedidos", data.numeroPedidos])
  worksheet.addRow(["Ticket Médio", `R$ ${data.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`])
  worksheet.addRow([
    "Forma de Pagamento Mais Usada",
    `${data.formaPagamentoMaisUsada.method} (${Math.round(data.formaPagamentoMaisUsada.percentage)}%)`,
  ])

  // Adicionar dados de vendas por dia
  worksheet.addRow([])
  worksheet.addRow(["Vendas por Dia", ""])
  worksheet.getRow(worksheet.rowCount).font = { bold: true }

  worksheet.addRow(["Data", "Valor (R$)"])
  data.vendasPorDia.forEach((item: any) => {
    worksheet.addRow([item.name, item.value])
  })

  // Adicionar gráfico de vendas por dia
  const chartVendasPorDia = worksheet.addChart(ExcelJS.ValueType.LineChart, {
    title: { name: "Vendas por Dia" },
    legend: { position: "right" },
    plotArea: {
      catAxis: { title: { name: "Data" } },
      valAxis: { title: { name: "Valor (R$)" } },
    },
    showBlanksAs: "zero",
  }) as ExcelJS.LineChart

  // Configurar série de dados para o gráfico
  const lastRow = worksheet.rowCount
  const firstDataRow = lastRow - data.vendasPorDia.length

  chartVendasPorDia.addSeries({
    name: "Vendas",
    xSeries: [`'${worksheet.name}'!$A$${firstDataRow + 1}:$A$${lastRow}`],
    values: [`'${worksheet.name}'!$B$${firstDataRow + 1}:$B$${lastRow}`],
    color: "4472C4",
  })

  // Posicionar o gráfico
  chartVendasPorDia.position = {
    type: "oneCellAnchor",
    from: {
      col: 3,
      row: 3,
    },
    to: {
      col: 10,
      row: 20,
    },
  }

  worksheet.addChart(chartVendasPorDia)

  // Adicionar dados de vendas por forma de pagamento
  worksheet.addRow([])
  worksheet.addRow(["Vendas por Forma de Pagamento", ""])
  worksheet.getRow(worksheet.rowCount).font = { bold: true }

  worksheet.addRow(["Método", "Porcentagem (%)"])
  data.vendasPorCategoria.forEach((item: any) => {
    worksheet.addRow([item.name, item.value])
  })

  // Adicionar gráfico de pizza para formas de pagamento
  const chartFormasPagamento = worksheet.addChart(ExcelJS.ValueType.PieChart, {
    title: { name: "Vendas por Forma de Pagamento" },
    legend: { position: "right" },
    dataLabels: { showPercent: true },
  }) as ExcelJS.PieChart

  // Configurar série de dados para o gráfico
  const lastRowPagamento = worksheet.rowCount
  const firstDataRowPagamento = lastRowPagamento - data.vendasPorCategoria.length

  chartFormasPagamento.addSeries({
    name: "Formas de Pagamento",
    labels: [`'${worksheet.name}'!$A$${firstDataRowPagamento + 1}:$A$${lastRowPagamento}`],
    values: [`'${worksheet.name}'!$B$${firstDataRowPagamento + 1}:$B$${lastRowPagamento}`],
  })

  // Posicionar o gráfico
  chartFormasPagamento.position = {
    type: "oneCellAnchor",
    from: {
      col: 3,
      row: 22,
    },
    to: {
      col: 10,
      row: 40,
    },
  }

  worksheet.addChart(chartFormasPagamento)
}

// Função para exportar relatório de produtos
function exportProdutosReport(worksheet: ExcelJS.Worksheet, data: any) {
  // Adicionar dados de desempenho de produtos
  worksheet.addRow([])
  worksheet.addRow(["Desempenho de Produtos", ""])
  worksheet.getRow(worksheet.rowCount).font = { bold: true }

  worksheet.addRow(["Produto", "Vendas (R$)", "Lucro (R$)"])
  data.desempenhoData.forEach((item: any) => {
    worksheet.addRow([item.name, item.vendas, item.lucro])
  })

  // Adicionar gráfico de barras para desempenho de produtos
  const chartDesempenho = worksheet.addChart(ExcelJS.ValueType.ColumnChart, {
    title: { name: "Desempenho de Produtos" },
    legend: { position: "right" },
    plotArea: {
      catAxis: { title: { name: "Produto" } },
      valAxis: { title: { name: "Valor (R$)" } },
    },
    showBlanksAs: "zero",
  }) as ExcelJS.ColumnChart

  // Configurar séries de dados para o gráfico
  const lastRow = worksheet.rowCount
  const firstDataRow = lastRow - data.desempenhoData.length

  chartDesempenho.addSeries({
    name: "Vendas",
    xSeries: [`'${worksheet.name}'!$A$${firstDataRow + 1}:$A$${lastRow}`],
    values: [`'${worksheet.name}'!$B$${firstDataRow + 1}:$B$${lastRow}`],
    color: "4472C4",
  })

  chartDesempenho.addSeries({
    name: "Lucro",
    xSeries: [`'${worksheet.name}'!$A$${firstDataRow + 1}:$A$${lastRow}`],
    values: [`'${worksheet.name}'!$C$${firstDataRow + 1}:$C$${lastRow}`],
    color: "70AD47",
  })

  // Posicionar o gráfico
  chartDesempenho.position = {
    type: "oneCellAnchor",
    from: {
      col: 4,
      row: 3,
    },
    to: {
      col: 11,
      row: 20,
    },
  }

  worksheet.addChart(chartDesempenho)

  // Adicionar dados de top produtos
  worksheet.addRow([])
  worksheet.addRow(["Top 5 Produtos Mais Vendidos", ""])
  worksheet.getRow(worksheet.rowCount).font = { bold: true }

  worksheet.addRow(["Produto", "Unidades Vendidas"])
  data.topProdutos.forEach((item: any) => {
    worksheet.addRow([item.name, item.units])
  })
}

// Função para exportar relatório de estoque
function exportEstoqueReport(worksheet: ExcelJS.Worksheet, data: any) {
  // Adicionar dados de uso de ingredientes
  worksheet.addRow([])
  worksheet.addRow(["Uso de Ingredientes", ""])
  worksheet.getRow(worksheet.rowCount).font = { bold: true }

  worksheet.addRow(["Ingrediente", "Quantidade Consumida"])
  data.ingredientUsageData.forEach((item: any) => {
    worksheet.addRow([item.name, item.value])
  })

  // Adicionar gráfico de barras para uso de ingredientes
  const chartUsoIngredientes = worksheet.addChart(ExcelJS.ValueType.BarChart, {
    title: { name: "Uso de Ingredientes" },
    legend: { position: "right" },
    plotArea: {
      catAxis: { title: { name: "Ingrediente" } },
      valAxis: { title: { name: "Quantidade Consumida" } },
    },
    showBlanksAs: "zero",
  }) as ExcelJS.BarChart

  // Configurar série de dados para o gráfico
  const lastRow = worksheet.rowCount
  const firstDataRow = lastRow - data.ingredientUsageData.length

  chartUsoIngredientes.addSeries({
    name: "Consumo",
    xSeries: [`'${worksheet.name}'!$A$${firstDataRow + 1}:$A$${lastRow}`],
    values: [`'${worksheet.name}'!$B$${firstDataRow + 1}:$B$${lastRow}`],
    color: "4472C4",
  })

  // Posicionar o gráfico
  chartUsoIngredientes.position = {
    type: "oneCellAnchor",
    from: {
      col: 4,
      row: 3,
    },
    to: {
      col: 11,
      row: 20,
    },
  }

  worksheet.addChart(chartUsoIngredientes)

  // Adicionar dados de top ingredientes
  worksheet.addRow([])
  worksheet.addRow(["Top Ingredientes Mais Utilizados", ""])
  worksheet.getRow(worksheet.rowCount).font = { bold: true }

  worksheet.addRow(["Ingrediente", "Quantidade"])
  data.topIngredients.forEach((item: any) => {
    worksheet.addRow([item.name, item.quantity])
  })
}

// Função para exportar relatório financeiro
function exportFinanceiroReport(worksheet: ExcelJS.Worksheet, data: any) {
  // Adicionar dados de métricas financeiras
  worksheet.addRow([])
  worksheet.addRow(["Métricas Financeiras", ""])
  worksheet.getRow(worksheet.rowCount).font = { bold: true }

  worksheet.addRow(["Receita Total", `R$ ${data.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`])
  worksheet.addRow([
    "Custo de Ingredientes",
    `R$ ${data.custoIngredientes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
  ])
  worksheet.addRow(["Outros Custos", `R$ ${data.outrosCustos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`])
  worksheet.addRow(["Lucro Líquido", `R$ ${data.lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`])

  // Adicionar dados de receitas por tipo
  worksheet.addRow([])
  worksheet.addRow(["Receitas por Tipo", ""])
  worksheet.getRow(worksheet.rowCount).font = { bold: true }

  worksheet.addRow(["Tipo", "Valor (R$)"])
  Object.entries(data.receitasPorTipo).forEach(([tipo, valor]: [string, any]) => {
    worksheet.addRow([tipo, valor])
  })

  // Adicionar gráfico de barras para receitas por tipo
  const chartReceitasPorTipo = worksheet.addChart(ExcelJS.ValueType.ColumnChart, {
    title: { name: "Receitas por Tipo" },
    legend: { position: "right" },
    plotArea: {
      catAxis: { title: { name: "Tipo" } },
      valAxis: { title: { name: "Valor (R$)" } },
    },
    showBlanksAs: "zero",
  }) as ExcelJS.ColumnChart

  // Configurar série de dados para o gráfico
  const lastRowReceitas = worksheet.rowCount
  const firstDataRowReceitas = lastRowReceitas - Object.keys(data.receitasPorTipo).length

  chartReceitasPorTipo.addSeries({
    name: "Receitas",
    xSeries: [`'${worksheet.name}'!$A$${firstDataRowReceitas + 1}:$A$${lastRowReceitas}`],
    values: [`'${worksheet.name}'!$B$${firstDataRowReceitas + 1}:$B$${lastRowReceitas}`],
    color: "4472C4",
  })

  // Posicionar o gráfico
  chartReceitasPorTipo.position = {
    type: "oneCellAnchor",
    from: {
      col: 4,
      row: 3,
    },
    to: {
      col: 11,
      row: 15,
    },
  }

  worksheet.addChart(chartReceitasPorTipo)

  // Adicionar dados de despesas
  worksheet.addRow([])
  worksheet.addRow(["Despesas", ""])
  worksheet.getRow(worksheet.rowCount).font = { bold: true }

  worksheet.addRow(["Tipo", "Valor (R$)"])
  Object.entries(data.despesas).forEach(([tipo, valor]: [string, any]) => {
    worksheet.addRow([tipo, valor])
  })

  // Adicionar gráfico de barras para despesas
  const chartDespesas = worksheet.addChart(ExcelJS.ValueType.ColumnChart, {
    title: { name: "Despesas" },
    legend: { position: "right" },
    plotArea: {
      catAxis: { title: { name: "Tipo" } },
      valAxis: { title: { name: "Valor (R$)" } },
    },
    showBlanksAs: "zero",
  }) as ExcelJS.ColumnChart

  // Configurar série de dados para o gráfico
  const lastRowDespesas = worksheet.rowCount
  const firstDataRowDespesas = lastRowDespesas - Object.keys(data.despesas).length

  chartDespesas.addSeries({
    name: "Despesas",
    xSeries: [`'${worksheet.name}'!$A$${firstDataRowDespesas + 1}:$A$${lastRowDespesas}`],
    values: [`'${worksheet.name}'!$B$${firstDataRowDespesas + 1}:$B$${lastRowDespesas}`],
    color: "ED7D31",
  })

  // Posicionar o gráfico
  chartDespesas.position = {
    type: "oneCellAnchor",
    from: {
      col: 4,
      row: 17,
    },
    to: {
      col: 11,
      row: 30,
    },
  }

  worksheet.addChart(chartDespesas)
}
