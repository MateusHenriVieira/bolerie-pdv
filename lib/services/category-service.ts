import { db } from "@/lib/firebase"
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"

export interface Category {
  id?: string
  name: string
  branchId?: string
  createdAt?: Date
  updatedAt?: Date
}

class CategoryService {
  async getAll(branchId: string): Promise<Category[]> {
    try {
      // Usar a subcoleção "categories" dentro do documento da filial
      const categoriesRef = collection(db, `branches/${branchId}/categories`)
      const querySnapshot = await getDocs(categoriesRef)

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Category,
      )
    } catch (error) {
      console.error("Error getting categories:", error)
      return []
    }
  }

  async getById(id: string, branchId: string): Promise<Category | null> {
    try {
      // Usar a subcoleção "categories" dentro do documento da filial
      const docRef = doc(db, `branches/${branchId}/categories`, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Category
      }

      return null
    } catch (error) {
      console.error("Error getting category:", error)
      return null
    }
  }

  async add(category: Category, branchId: string): Promise<string | null> {
    try {
      // Usar a subcoleção "categories" dentro do documento da filial
      const categoriesRef = collection(db, `branches/${branchId}/categories`)
      const newCategory = {
        name: category.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const docRef = await addDoc(categoriesRef, newCategory)
      return docRef.id
    } catch (error) {
      console.error("Error adding category:", error)
      return null
    }
  }

  async update(id: string, category: Partial<Category>, branchId: string): Promise<boolean> {
    try {
      // Usar a subcoleção "categories" dentro do documento da filial
      const docRef = doc(db, `branches/${branchId}/categories`, id)
      const updateData = {
        name: category.name,
        updatedAt: new Date(),
      }

      await updateDoc(docRef, updateData)
      return true
    } catch (error) {
      console.error("Error updating category:", error)
      return false
    }
  }

  async delete(id: string, branchId: string): Promise<boolean> {
    try {
      // Usar a subcoleção "categories" dentro do documento da filial
      const docRef = doc(db, `branches/${branchId}/categories`, id)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error("Error deleting category:", error)
      return false
    }
  }
}

export const categoryService = new CategoryService()
