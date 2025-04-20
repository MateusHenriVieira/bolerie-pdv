"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { branchService } from "@/lib/services/branch-service"
import type { Branch } from "@/lib/services/branch-service"
import { useAuth } from "@/lib/firebase/auth"

interface BranchContextType {
  currentBranch: Branch | null
  branches: Branch[]
  loading: boolean
  setCurrentBranch: (branch: Branch) => void
  userBranchId: string | null // ID da filial do usuário atual
  effectiveBranchId: string | null // ID da filial a ser usada para carregar dados
}

const BranchContext = createContext<BranchContextType>({
  currentBranch: null,
  branches: [],
  loading: true,
  setCurrentBranch: () => {},
  userBranchId: null,
  effectiveBranchId: null,
})

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [userBranchId, setUserBranchId] = useState<string | null>(null)
  const [effectiveBranchId, setEffectiveBranchId] = useState<string | null>(null)
  const { user, userData, isAdmin, isOwner } = useAuth()

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        console.log("Buscando filiais...")
        const fetchedBranches = await branchService.getAll()
        console.log(`Encontradas ${fetchedBranches.length} filiais`)
        setBranches(fetchedBranches)

        // Verificar se há uma filial salva no localStorage
        const savedBranchId = localStorage.getItem("currentBranchId")
        console.log(`Filial salva no localStorage: ${savedBranchId || "nenhuma"}`)

        // Determinar a filial do usuário
        let userBranch: Branch | null = null

        // Para usuários que não são owner/admin, usar a filial associada ao usuário
        if (!isOwner && !isAdmin && userData?.branchId) {
          console.log(`Usuário normal com filial: ${userData.branchId}`)
          userBranch = fetchedBranches.find((branch) => branch.id === userData.branchId) || null
          setUserBranchId(userData.branchId)

          // Para usuários normais, a filial efetiva é sempre a filial do usuário
          setEffectiveBranchId(userData.branchId)
          console.log(`Filial efetiva definida como: ${userData.branchId}`)

          // Definir a filial atual como a filial do usuário
          if (userBranch) {
            setCurrentBranch(userBranch)
            localStorage.setItem("currentBranchId", userBranch.id)
            console.log(`Filial atual definida como: ${userBranch.name} (${userBranch.id})`)
          } else if (fetchedBranches.length > 0) {
            // Fallback se a filial do usuário não for encontrada
            setCurrentBranch(fetchedBranches[0])
            setEffectiveBranchId(fetchedBranches[0].id)
            localStorage.setItem("currentBranchId", fetchedBranches[0].id)
            console.log(`Fallback: Filial atual definida como: ${fetchedBranches[0].name} (${fetchedBranches[0].id})`)
          }
        } else {
          // Para owner/admin, usar a filial selecionada no login
          console.log(`Usuário admin/owner`)
          if (savedBranchId) {
            const savedBranch = fetchedBranches.find((branch) => branch.id === savedBranchId)
            if (savedBranch) {
              setCurrentBranch(savedBranch)
              setEffectiveBranchId(savedBranch.id)
              console.log(`Filial salva encontrada: ${savedBranch.name} (${savedBranch.id})`)
            } else if (fetchedBranches.length > 0) {
              setCurrentBranch(fetchedBranches[0])
              setEffectiveBranchId(fetchedBranches[0].id)
              localStorage.setItem("currentBranchId", fetchedBranches[0].id)
              console.log(
                `Filial salva não encontrada, usando primeira: ${fetchedBranches[0].name} (${fetchedBranches[0].id})`,
              )
            }
          } else if (fetchedBranches.length > 0) {
            setCurrentBranch(fetchedBranches[0])
            setEffectiveBranchId(fetchedBranches[0].id)
            localStorage.setItem("currentBranchId", fetchedBranches[0].id)
            console.log(`Nenhuma filial salva, usando primeira: ${fetchedBranches[0].name} (${fetchedBranches[0].id})`)
          }

          // Para owner/admin, armazenar a filial do usuário se existir
          if (userData?.branchId) {
            setUserBranchId(userData.branchId)
            console.log(`ID da filial do usuário definido como: ${userData.branchId}`)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching branches:", error)
        setLoading(false)
      }
    }

    if (user) {
      fetchBranches()
    } else {
      setLoading(false)
      setBranches([])
      setCurrentBranch(null)
      setUserBranchId(null)
      setEffectiveBranchId(null)
    }
  }, [user, userData, isAdmin, isOwner])

  const handleSetCurrentBranch = (branch: Branch) => {
    console.log(`Alterando filial atual para: ${branch.name} (${branch.id})`)
    setCurrentBranch(branch)

    // Para owner/admin, atualizar a filial efetiva quando a filial atual mudar
    if (isOwner || isAdmin) {
      setEffectiveBranchId(branch.id)
      console.log(`Filial efetiva atualizada para: ${branch.id}`)
    }

    localStorage.setItem("currentBranchId", branch.id)
    console.log(`Filial salva no localStorage: ${branch.id}`)

    // Recarregar a página para atualizar todos os dados
    window.location.reload()
  }

  return (
    <BranchContext.Provider
      value={{
        currentBranch,
        branches,
        loading,
        setCurrentBranch: handleSetCurrentBranch,
        userBranchId,
        effectiveBranchId,
      }}
    >
      {children}
    </BranchContext.Provider>
  )
}

export const useBranch = () => useContext(BranchContext)
