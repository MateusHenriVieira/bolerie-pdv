import type { Timestamp } from "firebase/firestore"

// Atualização apenas para os tipos relacionados ao cliente e fidelidade
export interface CustomerOrder {
  id: string
  date: Date | Timestamp
  items: {
    productId: string
    name: string
    quantity: number
    price: number
    size?: string
  }[]
  total: number
  paymentMethod: string
  status: "completed" | "pending" | "cancelled"
}

export interface LoyaltyLevel {
  id: string
  name: string
  minimumPoints: number
  discountPercentage: number
  benefits: string[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Customer {
  id: string
  branchId: string
  name: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  loyaltyPoints: number
  totalOrders: number
  lastOrderDate: Date | null
  orderHistory?: CustomerOrder[]
  loyaltyLevel?: string // ID do nível de fidelidade
  createdAt?: any
  updatedAt?: any
}

export interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsRequired: number
  isActive: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface LoyaltyRedemption {
  id: string
  customerId: string
  rewardId: string
  rewardName: string
  pointsRedeemed: number
  redeemedAt: Date | Timestamp
}
