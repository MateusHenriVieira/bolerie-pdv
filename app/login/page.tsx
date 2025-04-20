"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Building, CakeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/firebase/auth"
import { storeService } from "@/lib/services/store-service"
import { branchService } from "@/lib/services/branch-service"
import type { Branch } from "@/lib/services/branch-service"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState("")
  const { login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [storeName, setStoreName] = useState("Bolerie")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchStoreName = async () => {
      try {
        // Usar getGlobalSettings para evitar erros quando não há filial selecionada
        const settings = await storeService.getGlobalSettings()
        if (settings && settings.name) {
          setStoreName(settings.name)
        }
      } catch (error) {
        console.error("Erro ao buscar nome da loja:", error)
      }
    }

    const fetchBranches = async () => {
      try {
        console.log("Buscando filiais para a tela de login...")
        const fetchedBranches = await branchService.getAll()
        console.log(`Encontradas ${fetchedBranches.length} filiais`)
        setBranches(fetchedBranches)

        // Seleciona a primeira filial por padrão se houver filiais
        if (fetchedBranches.length > 0) {
          setSelectedBranchId(fetchedBranches[0].id)
          console.log(`Filial padrão selecionada: ${fetchedBranches[0].name} (${fetchedBranches[0].id})`)
        }
      } catch (error) {
        console.error("Erro ao buscar filiais:", error)
      }
    }

    fetchStoreName()
    fetchBranches()
  }, [])

  // Verifica se o email é de um administrador (@boleriee.com)
  const checkIfAdmin = (email: string) => {
    return email.endsWith("@boleriee.com")
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    setIsAdmin(checkIfAdmin(newEmail))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Verifica se é admin e se selecionou uma filial
    if (isAdmin && !selectedBranchId) {
      toast({
        title: "Selecione uma filial",
        description: "Você precisa selecionar uma filial para continuar.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      console.log(`Tentando login com email: ${email}`)
      const userCredential = await login(email, password)
      console.log("Login bem-sucedido")

      // Se for admin, usa a filial selecionada
      if (isAdmin) {
        console.log(`Admin logado, salvando filial selecionada: ${selectedBranchId}`)
        localStorage.setItem("currentBranchId", selectedBranchId)
      }
      // Para usuários não-admin, a filial será definida automaticamente no contexto de filial
      // com base no branchId do documento do usuário

      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo ao sistema PDV ${storeName}!`,
      })
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Erro de login:", error)
      toast({
        title: "Erro ao fazer login",
        description: getErrorMessage(error.code),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "Email inválido."
      case "auth/user-disabled":
        return "Este usuário foi desativado."
      case "auth/user-not-found":
        return "Usuário não encontrado."
      case "auth/wrong-password":
        return "Senha incorreta."
      default:
        return "Ocorreu um erro ao fazer login. Tente novamente."
    }
  }

  return (
    <div className="container flex h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <CakeIcon className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold store-name">{storeName}</CardTitle>
          <CardDescription>Sistema de Ponto de Venda para {storeName}</CardDescription>
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Use suas credenciais para acessar o sistema {storeName}</p>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={`seu@${storeName.toLowerCase().replace(/\s+/g, "")}.com`}
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Button variant="link" className="p-0 h-auto text-xs" type="button">
                  Esqueceu a senha?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="branch">Filial</Label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger id="branch" className="w-full">
                    <SelectValue placeholder="Selecione uma filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.length > 0 ? (
                      branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            {branch.name}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Carregando filiais...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Como administrador, você pode selecionar qual filial deseja acessar.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
