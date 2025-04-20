import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore"
import type { Ingredient } from "@/lib/types"

export const ingredientService = {
  // Get all ingredients for a specific branch
  getAll: async (branchId?: string): Promise<Ingredient[]> => {
    try {
      if (!branchId) {
        console.warn("branchId não fornecido ao buscar ingredientes")
        return []
      }

      // Buscar ingredientes na subcoleção da filial
      const branchIngredientsRef = collection(db, `branches/${branchId}/ingredients`)
      const querySnapshot = await getDocs(branchIngredientsRef)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        branchId, // Adicionar o branchId ao objeto retornado
        ...doc.data(),
      })) as Ingredient[]
    } catch (error) {
      console.error("Erro ao buscar ingredientes:", error)
      return []
    }
  },

  // Get ingredients with low stock for a specific branch
  getLowStock: async (branchId?: string): Promise<Ingredient[]> => {
    try {
      if (!branchId) {
        console.warn("branchId não fornecido ao buscar ingredientes com estoque baixo")
        return []
      }

      const ingredients = await ingredientService.getAll(branchId)
      return ingredients.filter((ingredient) => ingredient.quantity <= ingredient.minQuantity) as Ingredient[]
    } catch (error) {
      console.error("Erro ao buscar ingredientes com estoque baixo:", error)
      return []
    }
  },

  // Get a single ingredient by ID for a specific branch
  getById: async (id: string, branchId?: string): Promise<Ingredient | null> => {
    try {
      if (!branchId) {
        console.warn("branchId não fornecido ao buscar ingrediente por ID")
        return null
      }

      const docRef = doc(db, `branches/${branchId}/ingredients`, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          branchId, // Adicionar o branchId ao objeto retornado
          ...docSnap.data(),
        } as Ingredient
      } else {
        return null
      }
    } catch (error) {
      console.error("Erro ao buscar ingrediente por ID:", error)
      return null
    }
  },

  // Add a new ingredient for a specific branch
  add: async (ingredient: Omit<Ingredient, "id">, branchId: string): Promise<string> => {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para adicionar um ingrediente")
      }

      // Verificar se a coleção existe e criar se necessário
      const branchRef = doc(db, "branches", branchId)
      const branchSnap = await getDoc(branchRef)

      if (!branchSnap.exists()) {
        throw new Error(`Filial com ID ${branchId} não encontrada`)
      }

      const branchIngredientsRef = collection(db, `branches/${branchId}/ingredients`)
      const docRef = await addDoc(branchIngredientsRef, {
        ...ingredient,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Registrar a entrada inicial no histórico
      const historyRef = collection(db, `branches/${branchId}/ingredients/${docRef.id}/history`)
      await addDoc(historyRef, {
        type: "entrada",
        quantity: ingredient.quantity,
        date: serverTimestamp(),
        reason: "Entrada inicial",
      })

      return docRef.id
    } catch (error) {
      console.error("Erro ao adicionar ingrediente:", error)
      throw error
    }
  },

  // Update an ingredient for a specific branch
  update: async (id: string, ingredient: Partial<Ingredient>, branchId: string): Promise<void> => {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para atualizar um ingrediente")
      }

      const docRef = doc(db, `branches/${branchId}/ingredients`, id)
      await updateDoc(docRef, {
        ...ingredient,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Erro ao atualizar ingrediente:", error)
      throw error
    }
  },

  // Delete an ingredient for a specific branch
  delete: async (id: string, branchId: string): Promise<void> => {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para excluir um ingrediente")
      }

      const docRef = doc(db, `branches/${branchId}/ingredients`, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error("Erro ao excluir ingrediente:", error)
      throw error
    }
  },

  // Update ingredient quantity for a specific branch
  updateQuantity: async (id: string, quantity: number, branchId: string, reason = ""): Promise<void> => {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para atualizar a quantidade de um ingrediente")
      }

      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, `branches/${branchId}/ingredients`, id)
        const docSnap = await transaction.get(docRef)

        if (!docSnap.exists()) {
          throw new Error("Ingrediente não encontrado")
        }

        const currentData = docSnap.data()
        const currentQuantity = currentData.quantity || 0
        const newQuantity = currentQuantity + quantity

        // Verificar se a nova quantidade é válida
        if (newQuantity < 0) {
          throw new Error("A quantidade resultante não pode ser negativa")
        }

        // Atualizar a quantidade do ingrediente
        transaction.update(docRef, {
          quantity: newQuantity,
          updatedAt: serverTimestamp(),
        })

        // Registrar no histórico
        const historyRef = collection(db, `branches/${branchId}/ingredients/${id}/history`)
        transaction.set(doc(historyRef), {
          type: quantity > 0 ? "entrada" : "saída",
          quantity: Math.abs(quantity),
          date: serverTimestamp(),
          reason: reason || (quantity > 0 ? "Entrada manual" : "Saída manual"),
        })
      })
    } catch (error) {
      console.error("Erro ao atualizar quantidade do ingrediente:", error)
      throw error
    }
  },

  // Get ingredient history for a specific branch
  getHistory: async (id: string, branchId: string): Promise<any[]> => {
    try {
      if (!branchId) {
        throw new Error("branchId é obrigatório para buscar o histórico de um ingrediente")
      }

      const historyRef = collection(db, `branches/${branchId}/ingredients/${id}/history`)
      const querySnapshot = await getDocs(historyRef)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Erro ao buscar histórico do ingrediente:", error)
      return []
    }
  },
}
