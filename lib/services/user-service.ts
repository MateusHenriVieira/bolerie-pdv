import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore"

export interface UserData {
  id: string
  uid: string
  email: string
  name: string
  role: "admin" | "employee" | "owner" | "dono"
  branchIds?: string[] // Array de IDs de filiais que o usuário tem acesso
  phone?: string
  createdAt?: Date
  updatedAt?: Date
}

const COLLECTION = "users"

export const userService = {
  // Get all users
  getAll: async (): Promise<UserData[]> => {
    const querySnapshot = await getDocs(collection(db, COLLECTION))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserData[]
  },

  // Get users by branch
  getUsersByBranch: async (branchId: string): Promise<UserData[]> => {
    try {
      // Primeiro, buscar todos os usuários que têm acesso a esta filial
      const branchUsersQuery = query(collection(db, COLLECTION), where("branchIds", "array-contains", branchId))
      const branchUsersSnapshot = await getDocs(branchUsersQuery)
      const branchUsers = branchUsersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[]

      // Depois, buscar todos os usuários do tipo "owner" ou "dono"
      const ownersQuery = query(collection(db, COLLECTION), where("role", "in", ["owner", "dono"]))
      const ownersSnapshot = await getDocs(ownersQuery)
      const owners = ownersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[]

      // Combinar os resultados, removendo duplicatas
      const allUsers = [...branchUsers]

      // Adicionar owners que não estão na lista de usuários da filial
      owners.forEach((owner) => {
        if (!allUsers.some((user) => user.id === owner.id)) {
          allUsers.push(owner)
        }
      })

      return allUsers
    } catch (error) {
      console.error("Erro ao buscar usuários por filial:", error)
      return []
    }
  },

  // Get a single user by ID
  getById: async (id: string): Promise<UserData | null> => {
    const docRef = doc(db, COLLECTION, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as UserData
    } else {
      return null
    }
  },

  // Get user details by UID (alias for getByUid for compatibility)
  getUserDetails: async (uid: string): Promise<UserData | null> => {
    return userService.getByUid(uid)
  },

  // Get a user by email
  getByEmail: async (email: string): Promise<UserData | null> => {
    const q = query(collection(db, COLLECTION), where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as UserData
    } else {
      return null
    }
  },

  // Get a user by Firebase Auth UID
  getByUid: async (uid: string): Promise<UserData | null> => {
    const q = query(collection(db, COLLECTION), where("uid", "==", uid))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as UserData
    } else {
      return null
    }
  },

  // Add a new user
  add: async (userData: Omit<UserData, "id">): Promise<string> => {
    // Garantir que usuários do tipo "owner" ou "dono" tenham acesso a todas as filiais
    const dataToSave = { ...userData }

    // Se for owner/dono e não tiver branchIds, inicializar como array vazio
    if ((userData.role === "owner" || userData.role === "dono") && !userData.branchIds) {
      dataToSave.branchIds = []
    }

    const docRef = await addDoc(collection(db, COLLECTION), {
      ...dataToSave,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Se o usuário foi associado a uma filial, atualizar a filial também
    if (userData.branchIds && userData.branchIds.length > 0) {
      for (const branchId of userData.branchIds) {
        const branchRef = doc(db, "branches", branchId)
        await updateDoc(branchRef, {
          userIds: arrayUnion(docRef.id),
        })
      }
    }

    return docRef.id
  },

  // Update a user
  update: async (id: string, userData: Partial<UserData>): Promise<void> => {
    const docRef = doc(db, COLLECTION, id)
    await updateDoc(docRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    })
  },

  // Add user to branch
  addUserToBranch: async (userId: string, branchId: string): Promise<void> => {
    try {
      // Atualizar o usuário para incluir a filial
      const userRef = doc(db, COLLECTION, userId)
      await updateDoc(userRef, {
        branchIds: arrayUnion(branchId),
        updatedAt: serverTimestamp(),
      })

      // Atualizar a filial para incluir o usuário
      const branchRef = doc(db, "branches", branchId)
      await updateDoc(branchRef, {
        userIds: arrayUnion(userId),
      })
    } catch (error) {
      console.error("Erro ao adicionar usuário à filial:", error)
      throw error
    }
  },

  // Delete a user
  delete: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTION, id)
    await deleteDoc(docRef)
  },
}
