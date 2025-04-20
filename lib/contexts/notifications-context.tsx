"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { reservationService, productService, ingredientService } from "@/lib/services"

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  date: Date
  read: boolean
  link?: string
}

interface NotificationsContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "date" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
})

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Carregar notificações do localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem("notifications")
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications)
        // Converter strings de data para objetos Date
        const notificationsWithDates = parsedNotifications.map((n: any) => ({
          ...n,
          date: new Date(n.date),
        }))
        setNotifications(notificationsWithDates)
      } catch (error) {
        console.error("Erro ao carregar notificações:", error)
      }
    }
  }, [])

  // Salvar notificações no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }, [notifications])

  // Verificar reservas próximas
  useEffect(() => {
    const checkUpcomingReservations = async () => {
      try {
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(23, 59, 59, 999)

        const reservations = await reservationService.getByDateRange(now, tomorrow)

        // Filtrar apenas reservas pendentes
        const upcomingReservations = reservations.filter(
          (r) => r.status === "pending" && r.reservationDate > now && r.reservationDate <= tomorrow,
        )

        // Adicionar notificações para reservas próximas
        upcomingReservations.forEach((reservation) => {
          const customerName = reservation.customer?.name || "Cliente"
          const reservationTime = reservation.reservationDate.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })

          addNotification({
            title: "Reserva Próxima",
            message: `${customerName} tem uma reserva hoje às ${reservationTime}`,
            type: "reservation",
            link: `/reservas?id=${reservation.id}`,
          })
        })
      } catch (error) {
        console.error("Erro ao verificar reservas próximas:", error)
      }
    }

    // Verificar a cada 30 minutos
    checkUpcomingReservations()
    const interval = setInterval(checkUpcomingReservations, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Verificar produtos com estoque baixo
  useEffect(() => {
    const checkLowStockProducts = async () => {
      try {
        const products = await productService.getAll()
        const lowStockProducts = products.filter((p) => p.stock <= 3)

        // Adicionar notificações para produtos com estoque baixo
        lowStockProducts.forEach((product) => {
          addNotification({
            title: "Estoque Baixo",
            message: `${product.name} está com apenas ${product.stock} unidades em estoque`,
            type: "inventory",
            link: `/estoque`,
          })
        })

        // Verificar ingredientes com estoque baixo
        const ingredients = await ingredientService.getAll()
        const lowStockIngredients = ingredients.filter((i) => i.quantity <= i.minQuantity)

        // Adicionar notificações para ingredientes com estoque baixo
        lowStockIngredients.forEach((ingredient) => {
          addNotification({
            title: "Ingrediente em Falta",
            message: `${ingredient.name} está abaixo do nível mínimo (${ingredient.quantity} ${ingredient.unit})`,
            type: "inventory",
            link: `/estoque`,
          })
        })
      } catch (error) {
        console.error("Erro ao verificar produtos com estoque baixo:", error)
      }
    }

    // Verificar a cada hora
    checkLowStockProducts()
    const interval = setInterval(checkLowStockProducts, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const addNotification = (notification: Omit<Notification, "id" | "date" | "read">) => {
    // Verificar se já existe uma notificação similar para evitar duplicatas
    const existingSimilar = notifications.find(
      (n) => n.title === notification.title && n.message === notification.message && !n.read,
    )

    if (!existingSimilar) {
      const newNotification: Notification = {
        ...notification,
        id: uuidv4(),
        date: new Date(),
        read: false,
      }

      setNotifications((prev) => [newNotification, ...prev])
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
