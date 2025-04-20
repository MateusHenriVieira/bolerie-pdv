"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { userService } from "@/lib/services/user-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { branchService } from "@/lib/services/branch-service"

export function UserSettings() {
  const { toast } = useToast()
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { currentBranch } = useBranch()
  const [branches, setBranches] = useState<any[]>([])

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "employee",
    branchId: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentBranch?.id) return

      setLoading(true)
      try {
        const fetchedUsers = await userService.getUsersByBranch(currentBranch.id)
        setUsers(fetchedUsers)
      } catch (error) {
        console.error("Erro ao buscar usuários:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os usuários.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    const fetchBranches = async () => {
      try {
        const fetchedBranches = await branchService.getAll()
        setBranches(fetchedBranches)
      } catch (error) {
        console.error("Erro ao buscar filiais:", error)
      }
    }

    fetchUsers()
    fetchBranches()
  }, [currentBranch, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewUser((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setNewUser((prev) => ({ ...prev, role: value }))
  }

  const handleBranchChange = (value: string) => {
    setNewUser((prev) => ({ ...prev, branchId: value }))
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await userService.update(userId, { active: !isActive })

      setUsers(users.map((user) => (user.id === userId ? { ...user, active: !isActive } : user)))

      toast({
        title: `Usuário ${!isActive ? "ativado" : "desativado"}`,
        description: `O usuário foi ${!isActive ? "ativado" : "desativado"} com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar status do usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do usuário.",
        variant: "destructive",
      })
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      })
      return
    }

    try {
      // Verificar se o email já existe
      const existingUser = await userService.getByEmail(newUser.email)
      if (existingUser) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já está sendo usado por outro usuário.",
          variant: "destructive",
        })
        return
      }

      // Criar o usuário no Firebase Authentication
      // Nota: Esta parte geralmente seria feita por uma função do servidor
      // por questões de segurança. Aqui é apenas um exemplo.

      // Adicionar o usuário ao Firestore
      const branchIds = newUser.branchId ? [newUser.branchId] : []

      const userId = await userService.add({
        uid: "temp-uid", // Isso seria substituído pelo UID real do Firebase Auth
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as any,
        branchIds,
        active: true,
      })

      // Se uma filial foi selecionada, adicionar o usuário à filial
      if (newUser.branchId) {
        await userService.addUserToBranch(userId, newUser.branchId)
      }

      // Atualizar a lista de usuários
      setUsers([
        ...users,
        {
          id: userId,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          active: true,
          branchIds,
        },
      ])

      // Limpar o formulário
      setNewUser({
        name: "",
        email: "",
        role: "employee",
        branchId: "",
        password: "",
        confirmPassword: "",
      })

      setIsAddUserOpen(false)

      toast({
        title: "Usuário adicionado",
        description: `O usuário ${newUser.name} foi adicionado com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o usuário. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      await userService.delete(userId)

      setUsers(users.filter((user) => user.id !== userId))

      toast({
        title: "Usuário removido",
        description: "O usuário foi removido com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao remover usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Usuários do Sistema</h3>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>Preencha os dados para criar um novo usuário no sistema.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  placeholder="Ex: joao@boleriee.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Função</Label>
                <Select value={newUser.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="employee">Funcionário</SelectItem>
                    <SelectItem value="owner">Proprietário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branchId">Filial</Label>
                <Select value={newUser.branchId} onValueChange={handleBranchChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddUser}>Adicionar Usuário</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Carregando usuários...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role === "admin"
                      ? "Administrador"
                      : user.role === "employee"
                        ? "Funcionário"
                        : user.role === "owner" || user.role === "dono"
                          ? "Proprietário"
                          : user.role}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.active !== false}
                        onCheckedChange={() => handleToggleUserStatus(user.id, user.active !== false)}
                      />
                      <span>{user.active !== false ? "Ativo" : "Inativo"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={user.role === "owner" || user.role === "dono" || user.role === "admin"}
                    >
                      <Trash className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
