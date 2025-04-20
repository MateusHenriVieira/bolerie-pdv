import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import type { Sale } from "@/lib/types"
import { customerService } from "./customer-service"
import { productService } from "./product-service"

export interface SalesByPaymentMethod {
  method: string
  total: number
  count: number
}

class SaleService {
  async getAll(branchId: string): Promise<Sale[]> {
    if (!branchId) {
      console.error("BranchId is required to get sales")
      return []
    }

    try {
      // Primeiro, tenta buscar da subcoleção
      const branchSalesRef = collection(db, `branches/${branchId}/sales`)
      const branchQuery = query(branchSalesRef, orderBy("date", "desc"))
      const branchSnapshot = await getDocs(branchQuery)

      if (branchSnapshot.size > 0) {
        // Se encontrou vendas na subcoleção, retorna elas
        return branchSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
            branchId, // Adicionar branchId para manter compatibilidade
          } as Sale
        })
      }

      // Se não encontrou na subcoleção, busca na coleção antiga
      const salesRef = collection(db, "sales")
      const q = query(salesRef, where("branchId", "==", branchId), orderBy("date", "desc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
        } as Sale
      })
    } catch (error) {
      console.error("Error getting sales:", error)
      throw new Error("Failed to get sales")
    }
  }

  async getByDateRange(startDate: Date, endDate: Date, branchId: string): Promise<Sale[]> {
    if (!branchId) {
      console.error("BranchId is required to get sales by date range")
      return []
    }

    try {
      // Primeiro, tenta buscar da subcoleção
      const branchSalesRef = collection(db, `branches/${branchId}/sales`)
      const startTimestamp = Timestamp.fromDate(startDate)
      const endTimestamp = Timestamp.fromDate(endDate)

      const branchQuery = query(
        branchSalesRef,
        where("date", ">=", startTimestamp),
        where("date", "<=", endTimestamp),
        orderBy("date", "desc"),
      )

      const branchSnapshot = await getDocs(branchQuery)

      if (branchSnapshot.size > 0) {
        // Se encontrou vendas na subcoleção, retorna elas
        return branchSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
            branchId, // Adicionar branchId para manter compatibilidade
          } as Sale
        })
      }

      // Se não encontrou na subcoleção, busca na coleção antiga
      const salesRef = collection(db, "sales")
      const q = query(
        salesRef,
        where("branchId", "==", branchId),
        where("date", ">=", startTimestamp),
        where("date", "<=", endTimestamp),
        orderBy("date", "desc"),
      )

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
        } as Sale
      })
    } catch (error) {
      console.error("Error getting sales by date range:", error)
      throw new Error("Failed to get sales by date range")
    }
  }

  async getRecent(branchId: string, limitCount = 5): Promise<Sale[]> {
    if (!branchId) {
      console.error("BranchId is required to get recent sales")
      return []
    }

    try {
      // Primeiro, tenta buscar da subcoleção
      const branchSalesRef = collection(db, `branches/${branchId}/sales`)
      const branchQuery = query(
        branchSalesRef,
        where("status", "==", "completed"),
        orderBy("date", "desc"),
        limit(limitCount),
      )

      const branchSnapshot = await getDocs(branchQuery)

      let sales: Sale[] = []

      if (branchSnapshot.size > 0) {
        // Se encontrou vendas na subcoleção, usa elas
        sales = branchSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
            branchId, // Adicionar branchId para manter compatibilidade
          } as Sale
        })
      } else {
        // Se não encontrou na subcoleção, busca na coleção antiga
        const salesRef = collection(db, "sales")
        const q = query(
          salesRef,
          where("branchId", "==", branchId),
          where("status", "==", "completed"),
          orderBy("date", "desc"),
          limit(limitCount),
        )

        const querySnapshot = await getDocs(q)

        sales = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
          } as Sale
        })
      }

      // Buscar os nomes dos clientes para cada venda
      const salesWithCustomerNames = await Promise.all(
        sales.map(async (sale) => {
          if (sale.customerId) {
            try {
              const customer = await customerService.getById(sale.customerId, branchId)
              if (customer) {
                return {
                  ...sale,
                  customerName: customer.name,
                }
              }
            } catch (error) {
              console.error(`Erro ao buscar cliente para venda ${sale.id}:`, error)
            }
          }
          return sale
        }),
      )

      return salesWithCustomerNames
    } catch (error) {
      console.error("Error getting recent sales:", error)
      throw new Error("Failed to get recent sales")
    }
  }

  async getSummary(
    branchId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    dailySales: { total: number; count: number; averageTicket: number }
    weeklySales: { total: number; count: number; averageTicket: number }
    monthlySales: { total: number; count: number; averageTicket: number }
    salesByPaymentMethod: SalesByPaymentMethod[]
    profit: { total: number }
  }> {
    if (!branchId) {
      console.error("BranchId is required to get sales summary")
      return {
        dailySales: { total: 0, count: 0, averageTicket: 0 },
        weeklySales: { total: 0, count: 0, averageTicket: 0 },
        monthlySales: { total: 0, count: 0, averageTicket: 0 },
        salesByPaymentMethod: [],
        profit: { total: 0 },
      }
    }

    try {
      let sales: Sale[] = []

      // Primeiro, tenta buscar da subcoleção
      const branchSalesRef = collection(db, `branches/${branchId}/sales`)
      let branchQuery = query(branchSalesRef, where("status", "==", "completed"))

      // Add date filters if provided
      if (startDate && endDate) {
        branchQuery = query(
          branchQuery,
          where("date", ">=", Timestamp.fromDate(startDate)),
          where("date", "<=", Timestamp.fromDate(endDate)),
        )
      }

      const branchSnapshot = await getDocs(branchQuery)

      if (branchSnapshot.size > 0) {
        // Se encontrou vendas na subcoleção, usa elas
        sales = branchSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
            branchId, // Adicionar branchId para manter compatibilidade
          } as Sale
        })
      } else {
        // Se não encontrou na subcoleção, busca na coleção antiga
        const salesRef = collection(db, "sales")
        let q = query(salesRef, where("branchId", "==", branchId), where("status", "==", "completed"))

        // Add date filters if provided
        if (startDate && endDate) {
          q = query(
            q,
            where("date", ">=", Timestamp.fromDate(startDate)),
            where("date", "<=", Timestamp.fromDate(endDate)),
          )
        }

        const snapshot = await getDocs(q)
        sales = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
          } as Sale
        })
      }

      // Calculate daily sales (today)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dailySales = this.calculateSummary(
        sales.filter((sale) => {
          const saleDate = sale.date instanceof Date ? sale.date : new Date(sale.date)
          return saleDate >= today
        }),
      )

      // Calculate weekly sales (last 7 days)
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 7)
      weekStart.setHours(0, 0, 0, 0)
      const weeklySales = this.calculateSummary(
        sales.filter((sale) => {
          const saleDate = sale.date instanceof Date ? sale.date : new Date(sale.date)
          return saleDate >= weekStart
        }),
      )

      // Calculate monthly sales (current month)
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const monthlySales = this.calculateSummary(
        sales.filter((sale) => {
          const saleDate = sale.date instanceof Date ? sale.date : new Date(sale.date)
          return saleDate >= monthStart
        }),
      )

      // Calculate sales by payment method
      const salesByPaymentMethod = this.calculateSalesByPaymentMethod(sales)

      // Calculate profit (simplified - assuming 30% profit margin)
      const profit = {
        total: monthlySales.total * 0.3,
      }

      return {
        dailySales,
        weeklySales,
        monthlySales,
        salesByPaymentMethod,
        profit,
      }
    } catch (error) {
      console.error("Error getting sales summary:", error)
      throw new Error("Failed to get sales summary")
    }
  }

  private calculateSummary(sales: Sale[]): { total: number; count: number; averageTicket: number } {
    const total = sales.reduce((sum, sale) => sum + sale.total, 0)
    const count = sales.length
    const averageTicket = count > 0 ? total / count : 0

    return {
      total,
      count,
      averageTicket,
    }
  }

  private calculateSalesByPaymentMethod(sales: Sale[]): SalesByPaymentMethod[] {
    const methodMap = new Map<string, { total: number; count: number }>()

    sales.forEach((sale) => {
      const method = sale.paymentMethod || "Não especificado"
      const current = methodMap.get(method) || { total: 0, count: 0 }

      methodMap.set(method, {
        total: current.total + sale.total,
        count: current.count + 1,
      })
    })

    return Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      total: data.total,
      count: data.count,
    }))
  }

  // Atualizando apenas o método add para incluir o custo do produto
  async add(
    cart: any[],
    totalValue: number,
    paymentMethod: string,
    customerId: string | null,
    branchId: string,
  ): Promise<string> {
    if (!branchId) {
      throw new Error("BranchId is required to add a sale")
    }

    try {
      // Mapear os itens do carrinho, garantindo que não haja valores undefined
      const items = cart.map((item) => ({
        productId: item.product?.id || "",
        name: item.product?.name || "Produto sem nome",
        quantity: item.quantity || 0,
        price: item.product?.price || 0,
        costPrice: item.product?.costPrice || 0, // Adicionando o preço de custo
        size: item.product?.selectedSize || null,
        total: (item.product?.price || 0) * (item.quantity || 0),
        totalCost: (item.product?.costPrice || 0) * (item.quantity || 0), // Adicionando o custo total
      }))

      // Calcular o custo total e o lucro
      const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0)
      const profit = totalValue - totalCost

      // Se tiver um cliente associado, buscar o nome do cliente
      let customerName = null
      if (customerId) {
        try {
          const customer = await customerService.getById(customerId, branchId)
          if (customer) {
            customerName = customer.name
          }
        } catch (error) {
          console.error("Erro ao buscar cliente:", error)
        }
      }

      // Criar o objeto de venda, garantindo que não haja valores undefined
      const sale = {
        items,
        total: totalValue || 0,
        totalCost: totalCost || 0, // Adicionando o custo total
        profit: profit || 0, // Adicionando o lucro
        paymentMethod: paymentMethod || "não especificado",
        status: "completed",
        date: Timestamp.now(),
        createdAt: serverTimestamp(),
        // Usar null explicitamente se customerId for undefined
        customerId: customerId || null,
        customerName: customerName || null,
      }

      // Verificar se há algum valor undefined no objeto sale
      Object.entries(sale).forEach(([key, value]) => {
        if (value === undefined) {
          console.warn(`Campo '${key}' com valor undefined foi detectado e será substituído por null`)
          // @ts-ignore
          sale[key] = null
        }
      })

      let docRef: any
      // Adicionar venda à subcoleção da filial
      try {
        docRef = await addDoc(collection(db, `branches/${branchId}/sales`), sale)

        // Se tiver um cliente associado, adicionar ao histórico de pedidos
        if (customerId) {
          const orderForHistory = {
            id: docRef.id,
            date: new Date(),
            items: items,
            total: totalValue || 0,
            paymentMethod: paymentMethod || "não especificado",
            status: "completed",
          }

          await customerService.addOrderToHistory(customerId, orderForHistory, branchId)
        }
      } catch (error) {
        console.error("Error adding sale:", error)
        throw new Error(`Failed to add sale: ${error instanceof Error ? error.message : String(error)}`)
      }

      // Atualizar o estoque para cada item vendido
      for (const item of cart) {
        try {
          if (item.product?.id) {
            // Buscar o produto atual para obter o estoque atual
            const product = await productService.getById(item.product.id, branchId)

            if (product && typeof product.stock === "number") {
              // Calcular o novo estoque
              const newStock = Math.max(0, product.stock - (item.quantity || 0))

              // Atualizar o estoque do produto
              await productService.update(item.product.id, {
                stock: newStock,
                branchId,
              })

              console.log(`Estoque atualizado para o produto ${item.product.name}: ${product.stock} -> ${newStock}`)

              // Se o estoque ficar baixo (menos de 10 unidades), mostrar um alerta
              if (newStock < 10) {
                console.warn(`Estoque baixo: ${item.product.name} (${newStock} unidades)`)
              }
            }
          }
        } catch (error) {
          console.error(`Erro ao atualizar estoque do produto ${item.product?.name || "desconhecido"}:`, error)
        }
      }

      return docRef.id
    } catch (error) {
      console.error("Error adding sale:", error)
      throw new Error(`Failed to add sale: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async update(id: string, sale: Partial<Sale>): Promise<void> {
    try {
      if (!sale.branchId) {
        throw new Error("BranchId is required to update a sale")
      }

      const branchId = sale.branchId

      // Remover branchId do objeto para não duplicar
      const { branchId: _, ...updateData } = sale

      if (sale.date) {
        updateData.date = Timestamp.fromDate(sale.date)
      }

      // Primeiro, verifica se a venda existe na subcoleção
      const branchSaleRef = doc(db, `branches/${branchId}/sales`, id)
      const branchSaleSnap = await getDoc(branchSaleRef)

      if (branchSaleSnap.exists()) {
        // Se existe na subcoleção, atualiza lá
        await updateDoc(branchSaleRef, {
          ...updateData,
          updatedAt: serverTimestamp(),
        })
      } else {
        // Se não existe na subcoleção, verifica na coleção antiga
        const saleRef = doc(db, "sales", id)
        const saleSnap = await getDoc(saleRef)

        if (saleSnap.exists()) {
          // Se existe na coleção antiga, atualiza lá
          await updateDoc(saleRef, updateData)
        } else {
          throw new Error("Venda não encontrada")
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar venda:", error)
      throw new Error("Falha ao atualizar venda")
    }
  }

  async delete(id: string, branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("BranchId is required to delete a sale")
      }

      // Primeiro, verifica se a venda existe na subcoleção
      const branchSaleRef = doc(db, `branches/${branchId}/sales`, id)
      const branchSaleSnap = await getDoc(branchSaleRef)

      if (branchSaleSnap.exists()) {
        // Se existe na subcoleção, exclui de lá
        await deleteDoc(branchSaleRef)
      } else {
        // Se não existe na subcoleção, verifica na coleção antiga
        const saleRef = doc(db, "sales", id)
        const saleSnap = await getDoc(saleRef)

        if (saleSnap.exists()) {
          // Se existe na coleção antiga, exclui de lá
          await deleteDoc(saleRef)
        } else {
          throw new Error("Venda não encontrada")
        }
      }
    } catch (error) {
      console.error("Erro ao excluir venda:", error)
      throw new Error("Falha ao excluir venda")
    }
  }

  async getById(id: string, branchId: string): Promise<Sale | null> {
    try {
      if (!branchId) {
        throw new Error("BranchId is required to get a sale by ID")
      }

      // Primeiro, verifica se a venda existe na subcoleção
      const branchSaleRef = doc(db, `branches/${branchId}/sales`, id)
      const branchSaleSnap = await getDoc(branchSaleRef)

      if (branchSaleSnap.exists()) {
        // Se existe na subcoleção, retorna de lá
        const data = branchSaleSnap.data()
        return {
          id: branchSaleSnap.id,
          ...data,
          date: data.date.toDate(),
          branchId, // Adicionar branchId para manter compatibilidade
        } as Sale
      }

      // Se não existe na subcoleção, verifica na coleção antiga
      const saleRef = doc(db, "sales", id)
      const saleSnap = await getDoc(saleRef)

      if (saleSnap.exists()) {
        // Se existe na coleção antiga, retorna de lá
        const data = saleSnap.data()
        return {
          id: saleSnap.id,
          ...data,
          date: data.date.toDate(),
        } as Sale
      }

      return null
    } catch (error) {
      console.error("Erro ao buscar venda por ID:", error)
      throw new Error("Falha ao buscar venda por ID")
    }
  }

  // Método para migrar vendas da coleção antiga para subcoleções
  async migrateSalesToBranchSubcollections(): Promise<void> {
    try {
      // Buscar todas as vendas da coleção antiga
      const oldSalesRef = collection(db, "sales")
      const querySnapshot = await getDocs(oldSalesRef)

      // Agrupar vendas por filial
      const salesByBranch: Record<string, any[]> = {}

      querySnapshot.forEach((doc) => {
        const sale = { id: doc.id, ...doc.data() }
        const branchId = sale.branchId

        if (branchId) {
          if (!salesByBranch[branchId]) {
            salesByBranch[branchId] = []
          }

          // Remover branchId para não duplicar
          const { branchId: _, ...saleData } = sale
          salesByBranch[branchId].push({ ...saleData, id: doc.id })
        }
      })

      // Salvar vendas nas subcoleções das filiais
      for (const [branchId, sales] of Object.entries(salesByBranch)) {
        for (const sale of sales) {
          const { id, ...saleData } = sale
          const saleRef = doc(db, `branches/${branchId}/sales`, id)
          await updateDoc(saleRef, {
            ...saleData,
            createdAt: serverTimestamp(),
          })
        }
      }

      console.log("Migração de vendas concluída com sucesso")
    } catch (error) {
      console.error("Erro ao migrar vendas:", error)
      throw error
    }
  }

  // Adicione estes novos métodos à classe SaleService

  async getCakesSoldCount(branchId: string, startDate: Date, endDate?: Date): Promise<number> {
    if (!branchId) {
      console.error("BranchId is required to get cakes sold count")
      return 0
    }

    try {
      const endDateToUse = endDate || new Date()

      // Buscar vendas no período
      const sales = await this.getByDateRange(startDate, endDateToUse, branchId)

      // Contar o número total de itens vendidos (bolos)
      let totalCakes = 0
      sales.forEach((sale) => {
        if (sale.items && Array.isArray(sale.items)) {
          totalCakes += sale.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        }
      })

      return totalCakes
    } catch (error) {
      console.error("Error getting cakes sold count:", error)
      return 0
    }
  }

  async getDailySalesTotal(branchId: string, startDate: Date, endDate?: Date): Promise<number> {
    if (!branchId) {
      console.error("BranchId is required to get daily sales total")
      return 0
    }

    try {
      const endDateToUse = endDate || new Date()

      // Buscar vendas no período
      const sales = await this.getByDateRange(startDate, endDateToUse, branchId)

      // Calcular o total de vendas
      const total = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)

      return total
    } catch (error) {
      console.error("Error getting daily sales total:", error)
      return 0
    }
  }
}

export const saleService = new SaleService()
