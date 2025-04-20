// Serviço para impressão de comprovantes
class PrintService {
  // Tipos de impressora suportados
  printerTypes = {
    POS: "pos",
    THERMAL: "thermal",
    A4: "a4",
  }

  // Configuração padrão
  private config = {
    printerType: "thermal", // Tipo padrão
    storeName: "",
    storeAddress: "",
    storePhone: "",
    logo: null as string | null,
    footer: "Obrigado pela preferência!\nVolte sempre!",
  }

  // Configura o serviço de impressão
  configure(config: Partial<typeof this.config>) {
    this.config = { ...this.config, ...config }
    return this
  }

  // Carrega as configurações da filial atual
  async loadBranchSettings(branchId: string) {
    try {
      if (!branchId) {
        console.error("ID da filial não fornecido para carregar configurações")
        return this
      }

      // Importar o serviço de filiais
      const { branchService } = await import("./branch-service")

      // Buscar os dados da filial
      const branch = await branchService.getById(branchId)

      if (branch) {
        this.config.storeName = branch.name || ""
        this.config.storeAddress = branch.address || ""
        this.config.storePhone = branch.phone || ""
      }

      return this
    } catch (error) {
      console.error("Erro ao carregar configurações da filial:", error)
      return this
    }
  }

  // Formata e imprime um comprovante de venda
  async printReceipt(saleData: {
    customer: { id: string; name: string } | null
    items: Array<{
      name: string
      price: number
      quantity: number
      size?: string
    }>
    total: number
    paymentMethod: string
    date?: Date
    branchId?: string
  }): Promise<void> {
    // Se branchId for fornecido, carrega as configurações da filial
    if (saleData.branchId) {
      await this.loadBranchSettings(saleData.branchId)
    }

    // Criar uma nova janela para impressão
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
      console.error("Não foi possível abrir a janela de impressão")
      alert("Por favor, permita pop-ups para imprimir o comprovante")
      return
    }

    // Data e hora atual
    const now = saleData.date || new Date()
    const dateFormatted = now.toLocaleDateString("pt-BR")
    const timeFormatted = now.toLocaleTimeString("pt-BR")

    // Formatar itens com base no tipo de impressora
    let itemsHtml = ""

    switch (this.config.printerType) {
      case this.printerTypes.POS:
      case this.printerTypes.THERMAL:
        // Formato compacto para impressoras térmicas/POS
        itemsHtml = saleData.items
          .map(
            (item) => `
            <tr>
              <td colspan="2" class="item-name">${item.name}${item.size ? ` (${item.size})` : ""}</td>
            </tr>
            <tr>
              <td class="item-qty">${item.quantity}x R$ ${item.price.toFixed(2)}</td>
              <td align="right" class="item-total">R$ ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `,
          )
          .join(
            "<tr><td colspan='2'><hr style='border-top: 1px dashed #000; border-bottom: none; margin: 4px 0;'></td></tr>",
          )
        break

      case this.printerTypes.A4:
      default:
        // Formato completo para impressoras A4
        itemsHtml = saleData.items
          .map(
            (item) => `
            <tr>
              <td>${item.name}${item.size ? ` (${item.size})` : ""}</td>
              <td>${item.quantity}x</td>
              <td>R$ ${item.price.toFixed(2)}</td>
              <td>R$ ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `,
          )
          .join("")
        break
    }

    // Criar o HTML do comprovante com base no tipo de impressora
    let receiptHtml = ""
    let pageWidth = "100%"
    let fontSize = "14px"

    switch (this.config.printerType) {
      case this.printerTypes.POS:
      case this.printerTypes.THERMAL:
        pageWidth = "80mm" // Largura padrão para impressoras térmicas
        fontSize = "12px" // Aumentado de 10px para 12px

        receiptHtml = this.getThermalReceiptHtml({
          dateFormatted,
          timeFormatted,
          customer: saleData.customer,
          itemsHtml,
          total: saleData.total,
          paymentMethod: saleData.paymentMethod,
          pageWidth,
          fontSize,
          title: "COMPROVANTE DE VENDA",
        })
        break

      case this.printerTypes.A4:
      default:
        pageWidth = "210mm" // Largura A4
        fontSize = "12px"

        receiptHtml = this.getA4ReceiptHtml({
          dateFormatted,
          timeFormatted,
          customer: saleData.customer,
          itemsHtml,
          total: saleData.total,
          paymentMethod: saleData.paymentMethod,
          pageWidth,
          fontSize,
          title: "COMPROVANTE DE VENDA",
        })
        break
    }

    // Escrever o HTML na janela de impressão
    printWindow.document.write(receiptHtml)
    printWindow.document.close()

    // Focar na janela de impressão
    printWindow.focus()

    // Imprimir automaticamente após carregar
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        // Fechar após imprimir (opcional)
        // printWindow.onafterprint = () => printWindow.close();
      }, 500)
    }
  }

  // Formata e imprime um comprovante de reserva
  async printReservationReceipt(reservationData: {
    customer: { id: string; name: string } | null
    customerAddress?: string // Novo campo de endereço
    items: Array<{
      name: string
      price: number
      quantity: number
      size?: string
    }>
    total: number
    paymentMethod: string
    date?: Date
    branchId?: string
    deliveryDate: string
    hasAdvancePayment?: boolean
    advanceAmount?: number
    advancePaymentMethod?: string
    remainingAmount?: number
    notes?: string
  }): Promise<void> {
    // Se branchId for fornecido, carrega as configurações da filial
    if (reservationData.branchId) {
      await this.loadBranchSettings(reservationData.branchId)
    }

    // Criar uma nova janela para impressão
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
      console.error("Não foi possível abrir a janela de impressão")
      alert("Por favor, permita pop-ups para imprimir o comprovante")
      return
    }

    // Data e hora atual
    const now = reservationData.date || new Date()
    const dateFormatted = now.toLocaleDateString("pt-BR")
    const timeFormatted = now.toLocaleTimeString("pt-BR")

    // Formatar itens com base no tipo de impressora
    let itemsHtml = ""

    switch (this.config.printerType) {
      case this.printerTypes.POS:
      case this.printerTypes.THERMAL:
        // Formato compacto para impressoras térmicas/POS
        itemsHtml = reservationData.items
          .map(
            (item) => `
            <tr>
              <td colspan="2" class="item-name">${item.name}${item.size ? ` (${item.size})` : ""}</td>
            </tr>
            <tr>
              <td class="item-qty">${item.quantity}x R$ ${item.price.toFixed(2)}</td>
              <td align="right" class="item-total">R$ ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `,
          )
          .join(
            "<tr><td colspan='2'><hr style='border-top: 1px dashed #000; border-bottom: none; margin: 4px 0;'></td></tr>",
          )
        break

      case this.printerTypes.A4:
      default:
        // Formato completo para impressoras A4
        itemsHtml = reservationData.items
          .map(
            (item) => `
            <tr>
              <td>${item.name}${item.size ? ` (${item.size})` : ""}</td>
              <td>${item.quantity}x</td>
              <td>R$ ${item.price.toFixed(2)}</td>
              <td>R$ ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `,
          )
          .join("")
        break
    }

    // Informações adicionais da reserva
    let reservationInfoHtml = ""

    switch (this.config.printerType) {
      case this.printerTypes.POS:
      case this.printerTypes.THERMAL:
        // Adicionar endereço do cliente
        if (reservationData.customerAddress) {
          reservationInfoHtml += `
            <tr>
              <td colspan="2" class="reservation-info">
                <strong>Endereço de Entrega:</strong><br>
                ${reservationData.customerAddress.replace(/\n/g, "<br>")}
              </td>
            </tr>
          `
        }

        reservationInfoHtml += `
          <tr>
            <td colspan="2" class="reservation-info">
              <strong>Data de Entrega:</strong> ${reservationData.deliveryDate}
            </td>
          </tr>
        `

        if (reservationData.hasAdvancePayment) {
          reservationInfoHtml += `
            <tr>
              <td colspan="2" class="reservation-info">
                <strong>Adiantamento:</strong> R$ ${reservationData.advanceAmount?.toFixed(2) || "0.00"}
              </td>
            </tr>
            <tr>
              <td colspan="2" class="reservation-info">
                <strong>Forma de Pagamento (Adiantamento):</strong> ${this.formatPaymentMethod(reservationData.advancePaymentMethod || "")}
              </td>
            </tr>
            <tr>
              <td colspan="2" class="reservation-info">
                <strong>Valor Restante:</strong> R$ ${reservationData.remainingAmount?.toFixed(2) || "0.00"}
              </td>
            </tr>
          `
        }

        if (reservationData.notes) {
          reservationInfoHtml += `
            <tr>
              <td colspan="2" class="reservation-info">
                <strong>Observações:</strong><br>
                ${reservationData.notes.replace(/\n/g, "<br>")}
              </td>
            </tr>
          `
        }
        break

      case this.printerTypes.A4:
      default:
        // Adicionar endereço do cliente
        if (reservationData.customerAddress) {
          reservationInfoHtml += `
            <tr>
              <td colspan="4" class="reservation-info">
                <strong>Endereço de Entrega:</strong><br>
                ${reservationData.customerAddress.replace(/\n/g, "<br>")}
              </td>
            </tr>
          `
        }

        reservationInfoHtml += `
          <tr>
            <td colspan="4" class="reservation-info">
              <strong>Data de Entrega:</strong> ${reservationData.deliveryDate}
            </td>
          </tr>
        `

        if (reservationData.hasAdvancePayment) {
          reservationInfoHtml += `
            <tr>
              <td colspan="4" class="reservation-info">
                <strong>Adiantamento:</strong> R$ ${reservationData.advanceAmount?.toFixed(2) || "0.00"}
              </td>
            </tr>
            <tr>
              <td colspan="4" class="reservation-info">
                <strong>Forma de Pagamento (Adiantamento):</strong> ${this.formatPaymentMethod(reservationData.advancePaymentMethod || "")}
              </td>
            </tr>
            <tr>
              <td colspan="4" class="reservation-info">
                <strong>Valor Restante:</strong> R$ ${reservationData.remainingAmount?.toFixed(2) || "0.00"}
              </td>
            </tr>
          `
        }

        if (reservationData.notes) {
          reservationInfoHtml += `
            <tr>
              <td colspan="4" class="reservation-info">
                <strong>Observações:</strong><br>
                ${reservationData.notes.replace(/\n/g, "<br>")}
              </td>
            </tr>
          `
        }
        break
    }

    // Criar o HTML do comprovante com base no tipo de impressora
    let receiptHtml = ""
    let pageWidth = "100%"
    let fontSize = "12px"

    switch (this.config.printerType) {
      case this.printerTypes.POS:
      case this.printerTypes.THERMAL:
        pageWidth = "80mm" // Largura padrão para impressoras térmicas
        fontSize = "12px" // Aumentado de 10px para 12px

        receiptHtml = this.getThermalReceiptHtml({
          dateFormatted,
          timeFormatted,
          customer: reservationData.customer,
          itemsHtml,
          total: reservationData.total,
          paymentMethod: reservationData.paymentMethod,
          pageWidth,
          fontSize,
          title: "COMPROVANTE DE RESERVA",
          additionalInfo: reservationInfoHtml,
        })
        break

      case this.printerTypes.A4:
      default:
        pageWidth = "210mm" // Largura A4
        fontSize = "12px"

        receiptHtml = this.getA4ReceiptHtml({
          dateFormatted,
          timeFormatted,
          customer: reservationData.customer,
          itemsHtml,
          total: reservationData.total,
          paymentMethod: reservationData.paymentMethod,
          pageWidth,
          fontSize,
          title: "COMPROVANTE DE RESERVA",
          additionalInfo: reservationInfoHtml,
        })
        break
    }

    // Escrever o HTML na janela de impressão
    printWindow.document.write(receiptHtml)
    printWindow.document.close()

    // Focar na janela de impressão
    printWindow.focus()

    // Imprimir automaticamente após carregar
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        // Fechar após imprimir (opcional)
        // printWindow.onafterprint = () => printWindow.close();
      }, 500)
    }
  }

  // Gera HTML para impressoras térmicas/POS
  private getThermalReceiptHtml({
    dateFormatted,
    timeFormatted,
    customer,
    itemsHtml,
    total,
    paymentMethod,
    pageWidth,
    fontSize,
    title = "CUPOM NÃO FISCAL",
    additionalInfo = "",
  }: {
    dateFormatted: string
    timeFormatted: string
    customer: { id: string; name: string } | null
    itemsHtml: string
    total: number
    paymentMethod: string
    pageWidth: string
    fontSize: string
    title?: string
    additionalInfo?: string
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: ${pageWidth} auto;
            margin: 0mm;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: ${fontSize};
            width: ${pageWidth};
            max-width: ${pageWidth};
            margin: 0;
            padding: 8px;
            color: black;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 3px solid black;
          }
          .header h2 {
            margin: 5px 0;
            font-size: 18px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .header p {
            margin: 5px 0;
            font-size: ${fontSize};
          }
          .info {
            margin-bottom: 12px;
            border: 1px solid black;
            padding: 8px;
            background-color: #f8f8f8;
          }
          .info p {
            margin: 5px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          th, td {
            text-align: left;
            padding: 5px 0;
            font-size: ${fontSize};
          }
          .item-name {
            font-size: 14px;
            letter-spacing: 0.5px;
          }
          .item-qty {
            font-size: 13px;
          }
          .item-total {
            font-size: 13px;
            text-align: right;
          }
          .total {
            border-top: 3px solid black;
            padding-top: 8px;
            font-size: 15px;
          }
          .total p {
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            margin-top: 12px;
            border-top: 3px solid black;
            padding-top: 8px;
            font-size: ${fontSize};
          }
          .cupom-title {
            text-align: center;
            font-size: 16px;
            margin: 10px 0;
            padding: 5px;
            border: 2px solid black;
            background-color: #f0f0f0;
            letter-spacing: 1px;
          }
          .reservation-info {
            padding: 5px 0;
            border-bottom: 1px solid #ccc;
          }
          hr.divider {
            border: none;
            border-top: 2px solid black;
            margin: 8px 0;
          }
          .no-print {
            display: none;
          }
          @media print {
            body {
              width: ${pageWidth};
              max-width: ${pageWidth};
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${this.config.storeName}</h2>
          <p>${this.config.storeAddress}</p>
          <p>${this.config.storePhone}</p>
        </div>
        
        <div class="info">
          <p><strong>Data:</strong> ${dateFormatted}</p>
          <p><strong>Hora:</strong> ${timeFormatted}</p>
          ${customer ? `<p><strong>Cliente:</strong> ${customer.name}</p>` : ""}
        </div>
        
        <div class="cupom-title">
          ${title}
        </div>
        
        <table>
          <tbody>
            ${itemsHtml}
            ${additionalInfo}
          </tbody>
        </table>
        
        <div class="total">
          <p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
          <p><strong>Forma de pagamento:</strong> ${this.formatPaymentMethod(paymentMethod)}</p>
        </div>
        
        <div class="footer">
          <p>${this.config.footer.replace(/\n/g, "<br>")}</p>
        </div>
      </body>
      </html>
    `
  }

  // Gera HTML para impressoras A4
  private getA4ReceiptHtml({
    dateFormatted,
    timeFormatted,
    customer,
    itemsHtml,
    total,
    paymentMethod,
    pageWidth,
    fontSize,
    title = "CUPOM NÃO FISCAL",
    additionalInfo = "",
  }: {
    dateFormatted: string
    timeFormatted: string
    customer: { id: string; name: string } | null
    itemsHtml: string
    total: number
    paymentMethod: string
    pageWidth: string
    fontSize: string
    title?: string
    additionalInfo?: string
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprovante</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: ${fontSize};
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: black;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid black;
          }
          .header h2 {
            margin: 8px 0;
            font-size: 20px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .header p {
            margin: 5px 0;
            font-size: 14px;
          }
          .info {
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            border: 1px solid black;
            padding: 10px;
            background-color: #f8f8f8;
          }
          .info-block {
            flex: 1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid black;
          }
          th, td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid black;
            border-right: 1px solid #ddd;
          }
          th {
            background-color: #f0f0f0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-size: 14px;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .total {
            text-align: right;
            font-size: 16px;
            margin-bottom: 20px;
            border: 2px solid black;
            padding: 10px;
            background-color: #f0f0f0;
          }
          .total p {
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid black;
            font-size: 14px;
          }
          .title-box {
            text-align: center;
            border: 2px solid black;
            padding: 10px;
            background-color: #f0f0f0;
            margin-bottom: 20px;
            letter-spacing: 1px;
            font-size: 18px;
          }
          .reservation-info {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          .no-print {
            display: none;
          }
          @media print {
            body {
              width: 100%;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${this.config.storeName}</h2>
          <p>${this.config.storeAddress}</p>
          <p>${this.config.storePhone}</p>
        </div>
        
        <div class="info">
          <div class="info-block">
            <p><strong>Data:</strong> ${dateFormatted}</p>
            <p><strong>Hora:</strong> ${timeFormatted}</p>
          </div>
          <div class="info-block">
            ${customer ? `<p><strong>Cliente:</strong> ${customer.name}</p>` : ""}
          </div>
        </div>
        
        <div class="title-box">
          ${title}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qtd</th>
              <th>Preço Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            ${additionalInfo}
          </tbody>
        </table>
        
        <div class="total">
          <p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
          <p><strong>Forma de pagamento:</strong> ${this.formatPaymentMethod(paymentMethod)}</p>
        </div>
        
        <div class="footer">
          <p>${this.config.footer.replace(/\n/g, "<br>")}</p>
        </div>
      </body>
      </html>
    `
  }

  // Formata o método de pagamento para exibição
  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      cash: "Dinheiro",
      pix: "PIX",
      dinheiro: "Dinheiro",
      cartao: "Cartão",
      pix: "PIX",
      transferencia: "Transferência",
    }

    return methods[method] || method
  }

  // Testa a impressão com dados simulados
  async testPrint(printerType?: string, branchId?: string) {
    // Salvar configuração atual
    const currentType = this.config.printerType

    // Definir tipo de impressora para teste se fornecido
    if (printerType) {
      this.config.printerType = printerType
    }

    // Carregar configurações da filial se fornecido
    if (branchId) {
      await this.loadBranchSettings(branchId)
    }

    // Criar dados de teste
    const testData = {
      customer: { id: "test-id", name: "Cliente Teste" },
      items: [
        { name: "Bolo de Chocolate", price: 45.9, quantity: 1, size: "Médio" },
        { name: "Cupcake", price: 8.5, quantity: 2 },
        { name: "Torta de Morango", price: 55.0, quantity: 1, size: "Grande" },
      ],
      total: 117.9,
      paymentMethod: "credit",
      date: new Date(),
      branchId,
    }

    // Imprimir comprovante de teste
    await this.printReceipt(testData)

    // Restaurar configuração original
    this.config.printerType = currentType
  }
}

export const printService = new PrintService()
