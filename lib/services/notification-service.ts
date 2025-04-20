import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp, orderBy } from "firebase/firestore"
import { toast } from "sonner"

export interface Notification {
  id?: string
  userId: string
  title: string
  message: string
  type: "reservation" | "inventory" | "customer" | "system"
  read: boolean
  link?: string
  createdAt: Date | Timestamp
}

class NotificationService {
  async getAll(userId: string): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(notificationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const notifications: Notification[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        notifications.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          read: data.read,
          link: data.link,
          createdAt: data.createdAt.toDate(),
        })
      })

      return notifications
    } catch (error) {
      console.error("Error getting notifications:", error)
      throw error
    }
  }

  async getUnread(userId: string): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(
        notificationsRef,
        where("userId", "==", userId),
        where("read", "==", false),
        orderBy("createdAt", "desc"),
      )
      const querySnapshot = await getDocs(q)

      const notifications: Notification[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        notifications.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          read: data.read,
          link: data.link,
          createdAt: data.createdAt.toDate(),
        })
      })

      return notifications
    } catch (error) {
      console.error("Error getting unread notifications:", error)
      throw error
    }
  }

  async add(notification: Omit<Notification, "id" | "createdAt">): Promise<string> {
    try {
      const notificationToAdd = {
        ...notification,
        createdAt: Timestamp.now(),
      }

      const docRef = await addDoc(collection(db, "notifications"), notificationToAdd)
      return docRef.id
    } catch (error) {
      console.error("Error adding notification:", error)
      throw error
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true,
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      throw error
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const unreadNotifications = await this.getUnread(userId)

      const updatePromises = unreadNotifications.map((notification) => {
        if (notification.id) {
          return updateDoc(doc(db, "notifications", notification.id), {
            read: true,
          })
        }
        return Promise.resolve()
      })

      await Promise.all(updatePromises)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      throw error
    }
  }

  async createReservationNotification(
    userId: string,
    reservationId: string,
    customerName: string,
    reservationDate: Date,
  ): Promise<void> {
    try {
      // Criar notificação para o dia anterior
      const dayBefore = new Date(reservationDate)
      dayBefore.setDate(dayBefore.getDate() - 1)

      // Verificar se a data já passou
      const now = new Date()
      if (dayBefore > now) {
        await this.add({
          userId,
          title: "Reserva Amanhã",
          message: `Lembrete: Reserva para ${customerName} amanhã às ${reservationDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          type: "reservation",
          read: false,
          link: `/reservas?id=${reservationId}`,
        })
      }

      // Criar notificação para o próprio dia
      const sameDay = new Date(reservationDate)
      sameDay.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (sameDay.getTime() === today.getTime()) {
        await this.add({
          userId,
          title: "Reserva Hoje",
          message: `Reserva para ${customerName} hoje às ${reservationDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          type: "reservation",
          read: false,
          link: `/reservas?id=${reservationId}`,
        })
      }
    } catch (error) {
      console.error("Error creating reservation notification:", error)
      toast.error("Erro ao criar notificação de reserva")
    }
  }
}

export const notificationService = new NotificationService()
