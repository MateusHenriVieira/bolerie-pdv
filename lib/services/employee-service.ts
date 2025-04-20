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
} from "firebase/firestore"

export interface Employee {
  id: string
  name: string
  age: number
  hireDate: Date
  salary: number
  paymentDay: number
  role: string
  branchId: string
  address: string
  isActive: boolean
}

const COLLECTION = "employees"

export const employeeService = {
  // Get all employees
  getAll: async (branchId?: string): Promise<Employee[]> => {
    let q
    if (branchId) {
      q = query(collection(db, COLLECTION), where("branchId", "==", branchId))
    } else {
      q = collection(db, COLLECTION)
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        hireDate: data.hireDate?.toDate() || new Date(),
      }
    }) as Employee[]
  },

  // Get employees by branch
  getByBranch: async (branchId: string): Promise<Employee[]> => {
    const q = query(collection(db, COLLECTION), where("branchId", "==", branchId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        hireDate: data.hireDate?.toDate() || new Date(),
      }
    }) as Employee[]
  },

  // Get a single employee by ID
  getById: async (id: string): Promise<Employee | null> => {
    const docRef = doc(db, COLLECTION, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        hireDate: data.hireDate?.toDate() || new Date(),
      } as Employee
    } else {
      return null
    }
  },

  // Add a new employee
  add: async (employee: Omit<Employee, "id">): Promise<string> => {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...employee,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  },

  // Update an employee
  update: async (id: string, employee: Partial<Employee>): Promise<void> => {
    const docRef = doc(db, COLLECTION, id)
    await updateDoc(docRef, {
      ...employee,
      updatedAt: serverTimestamp(),
    })
  },

  // Delete an employee
  delete: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTION, id)
    await deleteDoc(docRef)
  },
}
