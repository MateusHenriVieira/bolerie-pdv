import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
  getDoc,
  Timestamp,
  arrayUnion,
  deleteDoc,
  limit,
} from "firebase/firestore"
import type { Customer, CustomerOrder, LoyaltyLevel, LoyaltyReward, LoyaltyRedemption } from "@/lib/types"

class CustomerService {
  async getAll(branchId: string): Promise<Customer[]> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para obter todos os clientes")
      }

      console.log(`Buscando todos os clientes da filial: ${branchId}`)
      const customersRef = collection(db, `branches/${branchId}/customers`)
      const q = query(customersRef, orderBy("name"))
      const querySnapshot = await getDocs(q)

      const customers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        branchId, // Adicionando branchId para compatibilidade
      })) as Customer[]

      console.log(`Encontrados ${customers.length} clientes`)
      return customers
    } catch (error) {
      console.error("Erro ao obter todos os clientes:", error)
      throw error
    }
  }

  async getById(id: string, branchId: string): Promise<Customer | null> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para obter cliente por ID")
      }

      console.log(`Buscando cliente com ID ${id} da filial: ${branchId}`)
      const docRef = doc(db, `branches/${branchId}/customers`, id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        console.log(`Cliente com ID ${id} não encontrado`)
        return null
      }

      const customer = {
        id: docSnap.id,
        ...docSnap.data(),
        branchId, // Adicionando branchId para compatibilidade
      } as Customer

      console.log(`Cliente encontrado: ${customer.name}`)
      return customer
    } catch (error) {
      console.error(`Erro ao obter cliente com ID ${id}:`, error)
      throw error
    }
  }

  async create(customer: Omit<Customer, "id">, branchId: string): Promise<string> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para criar cliente")
      }

      console.log(`Criando novo cliente na filial: ${branchId}`)
      // Remover branchId do objeto para evitar duplicação
      const { branchId: _, ...customerData } = customer as any

      const customerToSave = {
        ...customerData,
        loyaltyPoints: customerData.loyaltyPoints || 0,
        totalOrders: customerData.totalOrders || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, `branches/${branchId}/customers`), customerToSave)
      console.log(`Cliente criado com ID: ${docRef.id}`)
      return docRef.id
    } catch (error) {
      console.error("Erro ao criar cliente:", error)
      throw error
    }
  }

  async update(id: string, customer: Partial<Customer>, branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para atualizar cliente")
      }

      console.log(`Atualizando cliente com ID ${id} na filial: ${branchId}`)
      // Remover branchId e id do objeto para evitar duplicação
      const { branchId: _, id: __, ...customerData } = customer as any

      const customerToUpdate = {
        ...customerData,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(doc(db, `branches/${branchId}/customers`, id), customerToUpdate)
      console.log(`Cliente atualizado com sucesso`)
    } catch (error) {
      console.error(`Erro ao atualizar cliente com ID ${id}:`, error)
      throw error
    }
  }

  async delete(id: string, branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para excluir cliente")
      }

      console.log(`Excluindo cliente com ID ${id} da filial: ${branchId}`)
      await deleteDoc(doc(db, `branches/${branchId}/customers`, id))
      console.log(`Cliente excluído com sucesso`)
    } catch (error) {
      console.error(`Erro ao excluir cliente com ID ${id}:`, error)
      throw error
    }
  }

  async search(searchQuery: string, branchId: string): Promise<Customer[]> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para buscar clientes")
      }

      console.log(`Buscando clientes com query "${searchQuery}" na filial: ${branchId}`)
      const customersRef = collection(db, `branches/${branchId}/customers`)

      // Se a busca estiver vazia, retornar todos os clientes
      if (!searchQuery || searchQuery.trim() === "") {
        const q = query(customersRef, orderBy("name"), limit(50))
        const querySnapshot = await getDocs(q)

        const customers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          branchId, // Adicionando branchId para compatibilidade
        })) as Customer[]

        console.log(`Encontrados ${customers.length} clientes`)
        return customers
      }

      // Busca por nome, email ou telefone
      const searchQueryLower = searchQuery.toLowerCase()

      // Primeiro, tentamos buscar todos os clientes (limitado a 100 para performance)
      const q = query(customersRef, orderBy("name"), limit(100))
      const querySnapshot = await getDocs(q)

      // Filtramos no cliente para busca mais flexível
      const customers = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          branchId, // Adicionando branchId para compatibilidade
        }))
        .filter((customer: any) => {
          const nameMatch = customer.name?.toLowerCase().includes(searchQueryLower)
          const emailMatch = customer.email?.toLowerCase().includes(searchQueryLower)
          const phoneMatch = customer.phone?.includes(searchQuery)
          return nameMatch || emailMatch || phoneMatch
        }) as Customer[]

      console.log(`Encontrados ${customers.length} clientes com a busca "${searchQuery}"`)
      return customers
    } catch (error) {
      console.error(`Erro ao buscar clientes com query "${searchQuery}":`, error)
      throw error
    }
  }

  // Adicione este novo método à classe CustomerService

  async getNewCustomersCount(branchId: string, startDate: Date, endDate?: Date): Promise<number> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para contar novos clientes")
      }

      const endDateToUse = endDate || new Date()

      console.log(`Contando novos clientes entre ${startDate.toISOString()} e ${endDateToUse.toISOString()}`)

      // Buscar todos os clientes da filial
      const customersRef = collection(db, `branches/${branchId}/customers`)
      const querySnapshot = await getDocs(customersRef)

      // Filtrar clientes criados no período especificado
      let newCustomersCount = 0

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.createdAt) {
          const createdAt = data.createdAt.toDate()
          if (createdAt >= startDate && createdAt <= endDateToUse) {
            newCustomersCount++
          }
        }
      })

      console.log(`Encontrados ${newCustomersCount} novos clientes no período`)
      return newCustomersCount
    } catch (error) {
      console.error("Erro ao contar novos clientes:", error)
      return 0
    }
  }

  // Método para adicionar um pedido ao histórico do cliente
  async addOrderToHistory(customerId: string, order: Omit<CustomerOrder, "id">, branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para adicionar pedido ao histórico")
      }

      const customerRef = doc(db, `branches/${branchId}/customers`, customerId)
      const customerDoc = await getDoc(customerRef)

      if (!customerDoc.exists()) {
        throw new Error("Cliente não encontrado")
      }

      // Criar um objeto de pedido para salvar no histórico
      const orderToSave = {
        ...order,
        date: order.date instanceof Date ? Timestamp.fromDate(order.date) : order.date,
      }

      // Adicionar o pedido ao array de histórico
      await updateDoc(customerRef, {
        orderHistory: arrayUnion(orderToSave),
        totalOrders: (customerDoc.data().totalOrders || 0) + 1,
        lastOrderDate: orderToSave.date,
        updatedAt: serverTimestamp(),
      })

      // Atualizar pontos de fidelidade baseado no valor do pedido
      await this.updateLoyaltyPointsFromOrder(customerId, order.total, branchId)
    } catch (error) {
      console.error("Erro ao adicionar pedido ao histórico:", error)
      throw error
    }
  }

  // Método para obter o histórico de pedidos de um cliente
  async getOrderHistory(customerId: string, branchId: string): Promise<CustomerOrder[]> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para obter histórico de pedidos")
      }

      const customerRef = doc(db, `branches/${branchId}/customers`, customerId)
      const customerDoc = await getDoc(customerRef)

      if (!customerDoc.exists()) {
        return []
      }

      const customerData = customerDoc.data()
      const orderHistory = customerData.orderHistory || []

      // Converter timestamps para Date
      return orderHistory.map((order: any) => ({
        ...order,
        date: order.date instanceof Timestamp ? order.date.toDate() : new Date(order.date),
      })) as CustomerOrder[]
    } catch (error) {
      console.error("Erro ao obter histórico de pedidos:", error)
      return []
    }
  }

  // Método para atualizar pontos de fidelidade baseado no valor do pedido
  async updateLoyaltyPointsFromOrder(customerId: string, orderTotal: number, branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para atualizar pontos de fidelidade")
      }

      // Regra: 1 ponto para cada R$ 10 gastos
      const pointsToAdd = Math.floor(orderTotal / 10)

      if (pointsToAdd <= 0) return

      const customerRef = doc(db, `branches/${branchId}/customers`, customerId)
      const customerDoc = await getDoc(customerRef)

      if (!customerDoc.exists()) {
        return
      }

      const currentPoints = customerDoc.data().loyaltyPoints || 0
      const newTotalPoints = currentPoints + pointsToAdd

      // Atualizar pontos
      await updateDoc(customerRef, {
        loyaltyPoints: newTotalPoints,
        updatedAt: serverTimestamp(),
      })

      // Verificar e atualizar nível de fidelidade
      await this.updateLoyaltyLevel(customerId, newTotalPoints, branchId)
    } catch (error) {
      console.error("Erro ao atualizar pontos de fidelidade:", error)
      throw error
    }
  }

  // Método para atualizar o nível de fidelidade do cliente
  async updateLoyaltyLevel(customerId: string, totalPoints: number, branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para atualizar nível de fidelidade")
      }

      // Obter todos os níveis de fidelidade
      const levels = await this.getLoyaltyLevels(branchId)

      // Encontrar o nível mais alto que o cliente se qualifica
      let highestQualifiedLevel: LoyaltyLevel | null = null

      for (const level of levels) {
        if (totalPoints >= level.minimumPoints) {
          if (!highestQualifiedLevel || level.minimumPoints > highestQualifiedLevel.minimumPoints) {
            highestQualifiedLevel = level
          }
        }
      }

      if (highestQualifiedLevel) {
        const customerRef = doc(db, `branches/${branchId}/customers`, customerId)
        await updateDoc(customerRef, {
          loyaltyLevel: highestQualifiedLevel.id,
          updatedAt: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar nível de fidelidade:", error)
      throw error
    }
  }

  // Método para obter os níveis de fidelidade
  async getLoyaltyLevels(branchId: string): Promise<LoyaltyLevel[]> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para obter níveis de fidelidade")
      }

      const q = query(collection(db, `branches/${branchId}/loyaltyLevels`), orderBy("minimumPoints"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LoyaltyLevel[]
    } catch (error) {
      console.error("Erro ao obter níveis de fidelidade:", error)
      return []
    }
  }

  // Método para adicionar um nível de fidelidade
  async addLoyaltyLevel(level: Omit<LoyaltyLevel, "id">, branchId: string): Promise<string> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para adicionar nível de fidelidade")
      }

      const docRef = await addDoc(collection(db, `branches/${branchId}/loyaltyLevels`), {
        ...level,
        createdAt: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error("Erro ao adicionar nível de fidelidade:", error)
      throw error
    }
  }

  // Método para atualizar um nível de fidelidade
  async updateLoyaltyLevel(
    levelId: string,
    levelData: Partial<Omit<LoyaltyLevel, "id">>,
    branchId: string,
  ): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para atualizar nível de fidelidade")
      }

      const levelRef = doc(db, `branches/${branchId}/loyaltyLevels`, levelId)
      await updateDoc(levelRef, {
        ...levelData,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Erro ao atualizar nível de fidelidade:", error)
      throw error
    }
  }

  // Método para excluir um nível de fidelidade
  async deleteLoyaltyLevel(levelId: string, branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para excluir nível de fidelidade")
      }

      await deleteDoc(doc(db, `branches/${branchId}/loyaltyLevels`, levelId))
    } catch (error) {
      console.error("Erro ao excluir nível de fidelidade:", error)
      throw error
    }
  }

  // Método para adicionar uma recompensa de fidelidade
  async addLoyaltyReward(reward: Omit<LoyaltyReward, "id">, branchId: string): Promise<string> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para adicionar recompensa de fidelidade")
      }

      const docRef = await addDoc(collection(db, `branches/${branchId}/loyaltyRewards`), {
        ...reward,
        createdAt: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error("Erro ao adicionar recompensa de fidelidade:", error)
      throw error
    }
  }

  // Método para atualizar uma recompensa de fidelidade
  async updateLoyaltyReward(
    rewardId: string,
    rewardData: Partial<Omit<LoyaltyReward, "id">>,
    branchId: string,
  ): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para atualizar recompensa de fidelidade")
      }

      const rewardRef = doc(db, `branches/${branchId}/loyaltyRewards`, rewardId)
      await updateDoc(rewardRef, {
        ...rewardData,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Erro ao atualizar recompensa de fidelidade:", error)
      throw error
    }
  }

  // Método para excluir uma recompensa de fidelidade
  async deleteLoyaltyReward(rewardId: string, branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para excluir recompensa de fidelidade")
      }

      await deleteDoc(doc(db, `branches/${branchId}/loyaltyRewards`, rewardId))
    } catch (error) {
      console.error("Erro ao excluir recompensa de fidelidade:", error)
      throw error
    }
  }

  // Método para obter as recompensas de fidelidade
  async getLoyaltyRewards(branchId: string): Promise<LoyaltyReward[]> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para obter recompensas de fidelidade")
      }

      const q = query(collection(db, `branches/${branchId}/loyaltyRewards`), orderBy("pointsRequired"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LoyaltyReward[]
    } catch (error) {
      console.error("Erro ao obter recompensas de fidelidade:", error)
      return []
    }
  }

  // Método para resgatar uma recompensa
  async redeemReward(customerId: string, rewardId: string, branchId: string): Promise<boolean> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para resgatar recompensa")
      }

      // Obter a recompensa
      const rewardRef = doc(db, `branches/${branchId}/loyaltyRewards`, rewardId)
      const rewardDoc = await getDoc(rewardRef)

      if (!rewardDoc.exists()) {
        throw new Error("Recompensa não encontrada")
      }

      const reward = rewardDoc.data() as LoyaltyReward

      // Verificar se a recompensa está ativa
      if (!reward.isActive) {
        throw new Error("Esta recompensa não está disponível no momento")
      }

      // Obter o cliente
      const customerRef = doc(db, `branches/${branchId}/customers`, customerId)
      const customerDoc = await getDoc(customerRef)

      if (!customerDoc.exists()) {
        throw new Error("Cliente não encontrado")
      }

      const customer = customerDoc.data() as Customer

      // Verificar se o cliente tem pontos suficientes
      if ((customer.loyaltyPoints || 0) < reward.pointsRequired) {
        return false
      }

      // Registrar o resgate
      const redemption: Omit<LoyaltyRedemption, "id"> = {
        customerId,
        rewardId,
        rewardName: reward.name,
        pointsRedeemed: reward.pointsRequired,
        redeemedAt: serverTimestamp() as Timestamp,
      }

      await addDoc(collection(db, `branches/${branchId}/loyaltyRedemptions`), redemption)

      // Atualizar pontos do cliente
      await updateDoc(customerRef, {
        loyaltyPoints: (customer.loyaltyPoints || 0) - reward.pointsRequired,
        updatedAt: serverTimestamp(),
      })

      return true
    } catch (error) {
      console.error("Erro ao resgatar recompensa:", error)
      return false
    }
  }

  // Método para obter o histórico de resgates de um cliente
  async getRedemptionHistory(customerId: string, branchId: string): Promise<LoyaltyRedemption[]> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para obter histórico de resgates")
      }

      const q = query(
        collection(db, `branches/${branchId}/loyaltyRedemptions`),
        where("customerId", "==", customerId),
        orderBy("redeemedAt", "desc"),
      )

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          redeemedAt: data.redeemedAt instanceof Timestamp ? data.redeemedAt.toDate() : new Date(data.redeemedAt),
        }
      }) as LoyaltyRedemption[]
    } catch (error) {
      console.error("Erro ao obter histórico de resgates:", error)
      return []
    }
  }

  // Método para obter todos os resgates da filial
  async getAllRedemptions(branchId: string): Promise<LoyaltyRedemption[]> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para obter todos os resgates")
      }

      const q = query(collection(db, `branches/${branchId}/loyaltyRedemptions`), orderBy("redeemedAt", "desc"))

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          redeemedAt: data.redeemedAt instanceof Timestamp ? data.redeemedAt.toDate() : new Date(data.redeemedAt),
        }
      }) as LoyaltyRedemption[]
    } catch (error) {
      console.error("Erro ao obter todos os resgates:", error)
      return []
    }
  }

  // Método para inicializar os níveis de fidelidade padrão
  async initializeDefaultLoyaltyLevels(branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para inicializar níveis de fidelidade")
      }

      // Verificar se já existem níveis
      const existingLevels = await this.getLoyaltyLevels(branchId)

      if (existingLevels.length > 0) {
        return // Já existem níveis, não inicializar novamente
      }

      // Níveis padrão
      const defaultLevels = [
        {
          name: "Bronze",
          minimumPoints: 0,
          discountPercentage: 0,
          benefits: ["Acumule 1 ponto a cada R$ 10 em compras"],
        },
        {
          name: "Prata",
          minimumPoints: 100,
          discountPercentage: 5,
          benefits: ["5% de desconto em todos os produtos", "Bolo de aniversário com 10% de desconto"],
        },
        {
          name: "Ouro",
          minimumPoints: 300,
          discountPercentage: 10,
          benefits: ["10% de desconto em todos os produtos", "Bolo de aniversário grátis (até R$ 50)"],
        },
        {
          name: "Diamante",
          minimumPoints: 1000,
          discountPercentage: 15,
          benefits: ["15% de desconto em todos os produtos", "Bolo de aniversário grátis (até R$ 100)", "Frete grátis"],
        },
      ]

      // Adicionar níveis padrão
      for (const level of defaultLevels) {
        await this.addLoyaltyLevel(level, branchId)
      }
    } catch (error) {
      console.error("Erro ao inicializar níveis de fidelidade:", error)
      throw error
    }
  }

  // Método para inicializar as recompensas de fidelidade padrão
  async initializeDefaultLoyaltyRewards(branchId: string): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para inicializar recompensas de fidelidade")
      }

      // Verificar se já existem recompensas
      const existingRewards = await this.getLoyaltyRewards(branchId)

      if (existingRewards.length > 0) {
        return // Já existem recompensas, não inicializar novamente
      }

      // Recompensas padrão
      const defaultRewards = [
        {
          name: "Desconto de R$ 10",
          description: "Cupom de desconto de R$ 10 em qualquer compra",
          pointsRequired: 50,
          isActive: true,
        },
        {
          name: "Cupcake Grátis",
          description: "Um cupcake grátis na sua próxima compra",
          pointsRequired: 75,
          isActive: true,
        },
        {
          name: "Desconto de R$ 25",
          description: "Cupom de desconto de R$ 25 em qualquer compra",
          pointsRequired: 120,
          isActive: true,
        },
        {
          name: "Mini Bolo Grátis",
          description: "Um mini bolo grátis na sua próxima compra",
          pointsRequired: 200,
          isActive: true,
        },
        {
          name: "Bolo Personalizado com 50% de Desconto",
          description: "Desconto de 50% em um bolo personalizado",
          pointsRequired: 350,
          isActive: true,
        },
        {
          name: "Bolo Personalizado Grátis",
          description: "Um bolo personalizado grátis (até R$ 100)",
          pointsRequired: 500,
          isActive: true,
        },
      ]

      // Adicionar recompensas padrão
      for (const reward of defaultRewards) {
        await this.addLoyaltyReward(reward, branchId)
      }
    } catch (error) {
      console.error("Erro ao inicializar recompensas de fidelidade:", error)
      throw error
    }
  }
}

export const customerService = new CustomerService()
