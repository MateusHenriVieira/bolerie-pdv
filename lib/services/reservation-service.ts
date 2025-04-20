import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface ReservationItem {
  productId: string
  productName: string
  quantity: number
  price: number
  size?: string
}

export interface Reservation {
  id: string
  branchId?: string
  customerId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerAddress?: string // Novo campo de endereço
  date: Date | Timestamp
  deliveryDate: Date | Timestamp
  notes?: string
  status: "pending" | "completed" | "cancelled"
  total: number
  productId?: string
  productName?: string
  quantity: number
  price: number
  paymentMethod?: string
  hasAdvancePayment?: boolean
  advanceAmount?: number
  advancePaymentMethod?: string
  remainingAmount?: number
  items?: ReservationItem[]
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
}

class ReservationService {
  private getCollectionRef(branchId: string) {
    return collection(db, "branches", branchId, "reservations")
  }

  async getAll(branchId: string): Promise<Reservation[]> {
    try {
      const q = query(this.getCollectionRef(branchId), orderBy("date", "desc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[]
    } catch (error) {
      console.error("Erro ao buscar reservas:", error)
      throw error
    }
  }

  async getById(branchId: string, id: string): Promise<Reservation | null> {
    try {
      const docRef = doc(this.getCollectionRef(branchId), id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Reservation
      }

      return null
    } catch (error) {
      console.error("Erro ao buscar reserva:", error)
      throw error
    }
  }

  async add(branchId: string, data: Omit<Reservation, "id" | "createdAt" | "updatedAt">): Promise<Reservation> {
    try {
      const now = Timestamp.now()

      const docRef = await addDoc(this.getCollectionRef(branchId), {
        ...data,
        createdAt: now,
        updatedAt: now,
      })

      return {
        id: docRef.id,
        ...data,
        createdAt: now,
        updatedAt: now,
      }
    } catch (error) {
      console.error("Erro ao adicionar reserva:", error)
      throw error
    }
  }

  async update(
    branchId: string,
    id: string,
    data: Partial<Omit<Reservation, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Reservation> {
    try {
      const docRef = doc(this.getCollectionRef(branchId), id)
      const now = Timestamp.now()

      await updateDoc(docRef, {
        ...data,
        updatedAt: now,
      })

      const updatedDoc = await getDoc(docRef)

      if (!updatedDoc.exists()) {
        throw new Error("Reserva não encontrada após atualização")
      }

      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as Reservation
    } catch (error) {
      console.error("Erro ao atualizar reserva:", error)
      throw error
    }
  }

  async delete(branchId: string, id: string): Promise<void> {
    try {
      const docRef = doc(this.getCollectionRef(branchId), id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error("Erro ao excluir reserva:", error)
      throw error
    }
  }

  async getUpcoming(branchId: string, days = 7): Promise<Reservation[]> {
    try {
      const now = Timestamp.now()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days)
      const endTimestamp = Timestamp.fromDate(endDate)

      const q = query(
        this.getCollectionRef(branchId),
        where("date", ">=", now),
        where("date", "<=", endTimestamp),
        where("status", "==", "pending"),
        orderBy("date", "asc"),
      )

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[]
    } catch (error) {
      console.error("Erro ao buscar próximas reservas:", error)
      throw error
    }
  }

  async getByCustomerId(branchId: string, customerId: string): Promise<Reservation[]> {
    try {
      const q = query(this.getCollectionRef(branchId), where("customerId", "==", customerId), orderBy("date", "desc"))

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[]
    } catch (error) {
      console.error("Erro ao buscar reservas do cliente:", error)
      throw error
    }
  }

  async getByDateRange(branchId: string, startDate: Date, endDate: Date): Promise<Reservation[]> {
    try {
      const startTimestamp = Timestamp.fromDate(startDate)
      const endTimestamp = Timestamp.fromDate(endDate)

      const q = query(
        this.getCollectionRef(branchId),
        where("date", ">=", startTimestamp),
        where("date", "<=", endTimestamp),
        orderBy("date", "asc"),
      )

      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Reservation[]
    } catch (error) {
      console.error("Erro ao buscar reservas por período:", error)
      throw error
    }
  }

  async changeStatus(
    branchId: string,
    id: string,
    status: "pending" | "completed" | "cancelled",
  ): Promise<Reservation> {
    return this.update(branchId, id, { status })
  }
}

export const reservationService = new ReservationService()
