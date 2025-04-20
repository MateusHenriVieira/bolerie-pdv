"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Employee } from "@/lib/types"

interface AuthContextType {
  user: FirebaseUser | null
  userDetails: Employee | null
  userData: any
  loading: boolean
  isAdmin: boolean
  isOwner: boolean
  login: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userDetails: null,
  userData: null,
  loading: true,
  isAdmin: false,
  isOwner: false,
  login: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userDetails, setUserDetails] = useState<Employee | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const auth = getAuth()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          // Verificar se é admin com base no email
          const isAdminUser = user.email?.endsWith("@boleriee.com") || false
          setIsAdmin(isAdminUser)

          // Buscar detalhes do usuário
          const userDoc = await getDoc(doc(db, "employees", user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data() as Employee
            setUserDetails(userData)
            setUserData(userData)

            // Verificar se é dono
            setIsOwner(userData.role === "dono")
          }
        } catch (error) {
          console.error("Erro ao buscar detalhes do usuário:", error)
        }
      } else {
        setUserDetails(null)
        setUserData(null)
        setIsAdmin(false)
        setIsOwner(false)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [auth])

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Verificar se é admin com base no email
      const isAdminUser = email.endsWith("@boleriee.com")
      setIsAdmin(isAdminUser)

      // Buscar detalhes do usuário
      const userDoc = await getDoc(doc(db, "employees", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data() as Employee
        setUserDetails(userData)
        setUserData(userData)

        // Verificar se é dono
        setIsOwner(userData.role === "dono")
      }

      return userCredential
    } catch (error) {
      console.error("Erro de login:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setUserDetails(null)
      setUserData(null)
      setIsAdmin(false)
      setIsOwner(false)
      localStorage.removeItem("currentBranchId")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userDetails,
        userData,
        loading,
        isAdmin,
        isOwner,
        login,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
