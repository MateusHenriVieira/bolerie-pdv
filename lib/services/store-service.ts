import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

export interface StoreSettings {
  name: string
  address: string
  phone: string
  email: string
  logo?: string
  theme?: string
  branchId?: string
}

export const storeService = {
  // Obter configurações globais (compatibilidade com versões anteriores)
  async getGlobalSettings(): Promise<StoreSettings> {
    try {
      console.log("Buscando configurações globais da loja")
      const docRef = doc(db, "settings", "store")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        console.log("Configurações globais encontradas")
        return docSnap.data() as StoreSettings
      } else {
        console.log("Configurações globais não encontradas, retornando valores padrão")
        // Retornar valores padrão se não existir
        return {
          name: "Bolerie",
          address: "Rua das Flores, 123 - Centro",
          phone: "(11) 99999-9999",
          email: "contato@bolerie.com",
          theme: "light",
        }
      }
    } catch (error) {
      console.error("Erro ao buscar configurações globais:", error)
      // Retornar valores padrão em caso de erro
      return {
        name: "Bolerie",
        address: "Rua das Flores, 123 - Centro",
        phone: "(11) 99999-9999",
        email: "contato@bolerie.com",
        theme: "light",
      }
    }
  },

  // Obter configurações da loja (verifica primeiro a filial, depois as configurações globais)
  async getSettings(branchId?: string): Promise<StoreSettings> {
    try {
      // Se não houver ID de filial, retornar configurações globais
      if (!branchId) {
        console.log("Nenhum ID de filial fornecido, buscando configurações globais")
        return this.getGlobalSettings()
      }

      console.log(`Buscando configurações da filial: ${branchId}`)
      const branchSettingsRef = doc(db, "branches", branchId, "settings", "store")
      const branchSettingsSnap = await getDoc(branchSettingsRef)

      if (branchSettingsSnap.exists()) {
        console.log("Configurações da filial encontradas")
        return { ...branchSettingsSnap.data(), branchId } as StoreSettings
      }

      // Se não existir configuração específica, buscar a filial para usar seus dados básicos
      console.log("Configurações da filial não encontradas, buscando dados da filial")
      const branchRef = doc(db, "branches", branchId)
      const branchSnap = await getDoc(branchRef)

      if (branchSnap.exists()) {
        const branchData = branchSnap.data()
        console.log("Dados da filial encontrados, criando configurações baseadas na filial")
        return {
          name: `Bolerie - ${branchData.name}`,
          address: branchData.address || "",
          phone: branchData.phone || "",
          email: branchData.email || "",
          theme: "light",
          branchId,
        }
      }

      // Se a filial não existir, retornar configurações globais
      console.log("Filial não encontrada, buscando configurações globais")
      return this.getGlobalSettings()
    } catch (error) {
      console.error("Erro ao buscar configurações da loja:", error)
      // Em caso de erro, retornar configurações globais
      return this.getGlobalSettings()
    }
  },

  // Obter configurações específicas da filial (para compatibilidade com código existente)
  async getBranchSettings(branchId: string): Promise<StoreSettings | null> {
    if (!branchId) {
      console.error("ID da filial não fornecido")
      return null
    }

    try {
      console.log(`Buscando configurações da filial (método legado): ${branchId}`)
      const docRef = doc(db, "branches", branchId, "settings", "store")
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        console.log("Configurações da filial encontradas")
        return { ...docSnap.data(), branchId } as StoreSettings
      } else {
        // Se não existir configuração específica, buscar a filial para usar seus dados básicos
        console.log("Configurações da filial não encontradas, buscando dados da filial")
        const branchRef = doc(db, "branches", branchId)
        const branchSnap = await getDoc(branchRef)

        if (branchSnap.exists()) {
          const branchData = branchSnap.data()
          console.log("Dados da filial encontrados, criando configurações baseadas na filial")
          return {
            name: `Bolerie - ${branchData.name}`,
            address: branchData.address || "",
            phone: branchData.phone || "",
            email: branchData.email || "",
            theme: "light",
            branchId,
          }
        }
        return null
      }
    } catch (error) {
      console.error("Erro ao buscar configurações da filial:", error)
      return null
    }
  },

  // Salvar configurações globais
  async saveSettings(settings: StoreSettings): Promise<void> {
    try {
      console.log("Salvando configurações globais da loja")
      const docRef = doc(db, "settings", "store")
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      })
      console.log("Configurações globais salvas com sucesso")
    } catch (error) {
      console.error("Erro ao salvar configurações globais:", error)
      throw error
    }
  },

  // Salvar configurações específicas da filial
  async saveBranchSettings(branchId: string, settings: StoreSettings): Promise<void> {
    try {
      if (!branchId) {
        throw new Error("ID da filial não fornecido")
      }

      console.log(`Salvando configurações da filial: ${branchId}`)
      const docRef = doc(db, "branches", branchId, "settings", "store")
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      })
      console.log("Configurações da filial salvas com sucesso")
    } catch (error) {
      console.error("Erro ao salvar configurações da filial:", error)
      throw error
    }
  },
}
