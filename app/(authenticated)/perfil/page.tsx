"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Key, Save, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/firebase/auth"
import { userService } from "@/lib/services"
import {
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth"

export default function PerfilPage() {
  const { user, userData, isAdmin } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "")
      setEmail(userData.email || "")
    } else if (user) {
      setDisplayName(user.displayName || "")
      setEmail(user.email || "")
    }
  }, [user, userData])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    setIsLoading(true)

    try {
      // Atualizar nome de exibição no Firebase Auth
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName })
      }

      // Atualizar nome de exibição no Firestore
      if (userData && displayName !== userData.displayName) {
        await userService.updateUser(userData.id, { displayName })
      }

      // Atualizar email (requer reautenticação)
      if (email !== user.email && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword)

        await reauthenticateWithCredential(user, credential)
        await updateEmail(user, email)

        // Atualizar email no Firestore
        if (userData) {
          await userService.updateUser(userData.id, { email })
        }
      }

      // Atualizar senha (requer reautenticação)
      if (newPassword && newPassword === confirmPassword && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword)

        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, newPassword)

        // Limpar campos de senha
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error)
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Ocorreu um erro ao atualizar suas informações.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-6">Meu Perfil</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Atualize suas informações pessoais e credenciais de acesso</CardDescription>
          </CardHeader>

          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-4">
              {/* Tipo de usuário */}
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Tipo de conta:
                  <Badge variant={isAdmin ? "default" : "outline"}>{isAdmin ? "Administrador" : "Funcionário"}</Badge>
                </p>
                {isAdmin && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Como administrador, você tem acesso a todas as filiais e funcionalidades do sistema.
                  </p>
                )}
                {userData?.branchId && !isAdmin && (
                  <p className="text-xs text-muted-foreground mt-1">Filial: {userData.branchId}</p>
                )}
              </div>

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="flex items-center gap-1">
                  <User className="h-4 w-4" /> Nome
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="pt-2 border-t">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
                  <Key className="h-4 w-4" /> Alterar Senha
                </h3>

                {/* Senha atual */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                  <p className="text-xs text-muted-foreground">Necessário para alterar email ou senha</p>
                </div>

                {/* Nova senha */}
                <div className="grid gap-4 mt-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova senha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-1">
                {isLoading ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Salvar Alterações
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
