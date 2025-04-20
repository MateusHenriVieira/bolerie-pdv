"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useAuth } from "@/lib/firebase/auth"
import { useBranch } from "@/lib/contexts/branch-context"
import { userService } from "@/lib/services"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Building, Mail, User, Briefcase } from "lucide-react"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, userData } = useAuth()
  const { currentBranch } = useBranch()
  const [userDetails, setUserDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user?.uid) {
        try {
          setLoading(true)
          // Buscar informações adicionais do usuário no Firebase
          const details = await userService.getUserDetails(user.uid)
          setUserDetails(
            details || {
              displayName: user.displayName,
              email: user.email,
              role: userData?.role || "Funcionário",
              birthDate: userData?.birthDate || null,
              createdAt: user.metadata?.creationTime ? new Date(user.metadata.creationTime) : new Date(),
              photoURL: user.photoURL,
            },
          )
          setLoading(false)
        } catch (error) {
          console.error("Erro ao buscar detalhes do usuário:", error)
          setLoading(false)
        }
      }
    }

    if (isOpen) {
      fetchUserDetails()
    }
  }, [isOpen, user, userData])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não informado"
    try {
      return format(new Date(dateString), "dd/MM/yyyy")
    } catch (error) {
      return "Data inválida"
    }
  }

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "N/A"

    try {
      const birth = new Date(birthDate)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }

      return `${age} anos`
    } catch (error) {
      return "N/A"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Meu Perfil</DialogTitle>
          <DialogDescription>Informações do usuário conectado</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner"></span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userDetails?.photoURL || "/placeholder-user.jpg"} alt="Foto do usuário" />
                <AvatarFallback className="text-2xl">
                  {userDetails?.displayName?.substring(0, 2) || "??"}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-4 text-xl font-semibold">{userDetails?.displayName}</h3>
              <Badge className="mt-2">{userDetails?.role || "Funcionário"}</Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{userDetails?.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Filial</p>
                  <p className="text-sm text-muted-foreground">{currentBranch?.name || "Não definida"}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Cargo</p>
                  <p className="text-sm text-muted-foreground">{userDetails?.role || "Não definido"}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Data de Nascimento</p>
                  <p className="text-sm text-muted-foreground">{formatDate(userDetails?.birthDate)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Idade</p>
                  <p className="text-sm text-muted-foreground">{calculateAge(userDetails?.birthDate)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
