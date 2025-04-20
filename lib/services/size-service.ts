import { db } from "@/lib/firebase"
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"

export interface Size {
  id?: string
  name: string
  referenceValue: number
  createdAt?: Date
  updatedAt?: Date
}

class SizeService {
  async getAll(branchId: string): Promise<Size[]> {
    try {
      // Usar a subcoleção "sizes" dentro do documento da filial
      const sizesRef = collection(db, `branches/${branchId}/sizes`)
      const querySnapshot = await getDocs(sizesRef)

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Size,
      )
    } catch (error) {
      console.error("Error getting sizes:", error)
      return []
    }
  }

  async getById(id: string, branchId: string): Promise<Size | null> {
    try {
      // Usar a subcoleção "sizes" dentro do documento da filial
      const docRef = doc(db, `branches/${branchId}/sizes`, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Size
      }

      return null
    } catch (error) {
      console.error("Error getting size:", error)
      return null
    }
  }

  async add(size: Size, branchId: string): Promise<string | null> {
    try {
      // Usar a subcoleção "sizes" dentro do documento da filial
      const sizesRef = collection(db, `branches/${branchId}/sizes`)
      const newSize = {
        name: size.name,
        referenceValue: size.referenceValue,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const docRef = await addDoc(sizesRef, newSize)
      return docRef.id
    } catch (error) {
      console.error("Error adding size:", error)
      return null
    }
  }

  async update(id: string, size: Partial<Size>, branchId: string): Promise<boolean> {
    try {
      // Usar a subcoleção "sizes" dentro do documento da filial
      const docRef = doc(db, `branches/${branchId}/sizes`, id)
      const updateData = {
        ...size,
        updatedAt: new Date(),
      }

      await updateDoc(docRef, updateData)
      return true
    } catch (error) {
      console.error("Error updating size:", error)
      return false
    }
  }

  async delete(id: string, branchId: string): Promise<boolean> {
    try {
      // Usar a subcoleção "sizes" dentro do documento da filial
      const docRef = doc(db, `branches/${branchId}/sizes`, id)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error("Error deleting size:", error)
      return false
    }
  }
}

export const sizeService = new SizeService()
