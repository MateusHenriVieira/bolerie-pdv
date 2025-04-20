import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, serverTimestamp } from "firebase/firestore"

export interface Branch {
  id: string
  name: string
  address: string
  phone: string
  email: string
  manager: string
  isActive: boolean
}

const COLLECTION = "branches"

export const branchService = {
  // Get all branches
  getAll: async (): Promise<Branch[]> => {
    const querySnapshot = await getDocs(collection(db, COLLECTION))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Branch[]
  },

  // Get a single branch by ID
  getById: async (id: string): Promise<Branch | null> => {
    const docRef = doc(db, COLLECTION, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Branch
    } else {
      return null
    }
  },

  // Add a new branch
  add: async (branch: Omit<Branch, "id">): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...branch,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  },

  // Update a branch
  update: async (id: string, branch: Partial<Branch>): Promise<void> => {
    const docRef = doc(db, COLLECTION, id)
    await updateDoc(docRef, {
      ...branch,
      updatedAt: serverTimestamp(),
    })
  },

  // Delete a branch
  delete: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTION, id)
    await deleteDoc(docRef)
  },
}
