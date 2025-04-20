"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Gift, Plus, Trash2, Edit } from "lucide-react"
import { customerService } from "@/lib/services/customer-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import type { LoyaltyLevel, LoyaltyReward } from "@/lib/types"

export function LoyaltyProgramSettings() {
  const { effectiveBranchId } = useBranch()
  const { toast } = useToast()
  const [loyaltyLevels, setLoyaltyLevels] = useState<LoyaltyLevel[]>([])
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>([])
  const [isAddingLevel, setIsAddingLevel] = useState(false)
  const [isAddingReward, setIsAddingReward] = useState(false)
  const [isEditingLevel, setIsEditingLevel] = useState(false)
  const [isEditingReward, setIsEditingReward] = useState(false)
  const [deletingLevelId, setDeletingLevelId] = useState<string | null>(null)
  const [deletingRewardId, setDeletingRewardId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    customersWithLoyalty: 0,
    totalRedemptions: 0,
  })

  // Formulário para novo/editar nível
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null)
  const [newLevel, setNewLevel] = useState<{
    name: string
    minimumPoints: number
    discountPercentage: number
    benefits: string[]
    newBenefit: string
  }>({
    name: "",
    minimumPoints: 0,
    discountPercentage: 0,
    benefits: [],
    newBenefit: "",
  })

  // Formulário para nova/editar recompensa
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null)
  const [newReward, setNewReward] = useState<{
    name: string
    description: string
    pointsRequired: number
    isActive: boolean
  }>({
    name: "",
    description: "",
    pointsRequired: 0,
    isActive: true,
  })

  // Carregar dados
  useEffect(() => {
    if (effectiveBranchId) {
      loadData()
      loadStats()
    }
  }, [effectiveBranchId])

  const loadData = async () => {
    if (!effectiveBranchId) return

    setIsLoading(true)
    try {
      // Inicializar níveis e recompensas padrão se não existirem
      await customerService.initializeDefaultLoyaltyLevels(effectiveBranchId)
      await customerService.initializeDefaultLoyaltyRewards(effectiveBranchId)

      // Carregar níveis
      const levels = await customerService.getLoyaltyLevels(effectiveBranchId)
      setLoyaltyLevels(levels.sort((a, b) => a.minimumPoints - b.minimumPoints))

      // Carregar recompensas
      const rewards = await customerService.getLoyaltyRewards(effectiveBranchId)
      setLoyaltyRewards(rewards.sort((a, b) => a.pointsRequired - b.pointsRequired))
    } catch (error) {
      console.error("Erro ao carregar dados do programa de fidelidade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do programa de fidelidade",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    if (!effectiveBranchId) return

    try {
      const customers = await customerService.getAll(effectiveBranchId)
      const customersWithLoyalty = customers.filter((c) => c.loyaltyPoints > 0).length
      const redemptions = await customerService.getAllRedemptions(effectiveBranchId)

      setStats({
        totalCustomers: customers.length,
        customersWithLoyalty,
        totalRedemptions: redemptions.length,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas do programa de fidelidade:", error)
    }
  }

  // Adicionar nível
  const handleAddLevel = async () => {
    if (!effectiveBranchId) return

    if (
      !newLevel.name ||
      newLevel.minimumPoints < 0 ||
      newLevel.discountPercentage < 0 ||
      newLevel.benefits.length === 0
    ) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await customerService.addLoyaltyLevel(
        {
          name: newLevel.name,
          minimumPoints: newLevel.minimumPoints,
          discountPercentage: newLevel.discountPercentage,
          benefits: newLevel.benefits,
        },
        effectiveBranchId,
      )

      toast({
        title: "Nível adicionado",
        description: `O nível ${newLevel.name} foi adicionado com sucesso`,
      })

      // Resetar formulário e recarregar dados
      setNewLevel({
        name: "",
        minimumPoints: 0,
        discountPercentage: 0,
        benefits: [],
        newBenefit: "",
      })
      setIsAddingLevel(false)
      loadData()
    } catch (error) {
      console.error("Erro ao adicionar nível:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o nível",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Editar nível
  const handleEditLevel = async () => {
    if (!effectiveBranchId || !editingLevelId) return

    if (
      !newLevel.name ||
      newLevel.minimumPoints < 0 ||
      newLevel.discountPercentage < 0 ||
      newLevel.benefits.length === 0
    ) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await customerService.updateLoyaltyLevel(
        editingLevelId,
        {
          name: newLevel.name,
          minimumPoints: newLevel.minimumPoints,
          discountPercentage: newLevel.discountPercentage,
          benefits: newLevel.benefits,
        },
        effectiveBranchId,
      )

      toast({
        title: "Nível atualizado",
        description: `O nível ${newLevel.name} foi atualizado com sucesso`,
      })

      // Resetar formulário e recarregar dados
      setNewLevel({
        name: "",
        minimumPoints: 0,
        discountPercentage: 0,
        benefits: [],
        newBenefit: "",
      })
      setEditingLevelId(null)
      setIsEditingLevel(false)
      loadData()
    } catch (error) {
      console.error("Erro ao atualizar nível:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nível",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Excluir nível
  const handleDeleteLevel = async () => {
    if (!effectiveBranchId || !deletingLevelId) return

    setIsLoading(true)
    try {
      await customerService.deleteLoyaltyLevel(deletingLevelId, effectiveBranchId)

      toast({
        title: "Nível excluído",
        description: "O nível foi excluído com sucesso",
      })

      setDeletingLevelId(null)
      loadData()
    } catch (error) {
      console.error("Erro ao excluir nível:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o nível",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Adicionar benefício ao formulário
  const handleAddBenefit = () => {
    if (!newLevel.newBenefit) return

    setNewLevel({
      ...newLevel,
      benefits: [...newLevel.benefits, newLevel.newBenefit],
      newBenefit: "",
    })
  }

  // Remover benefício do formulário
  const handleRemoveBenefit = (index: number) => {
    setNewLevel({
      ...newLevel,
      benefits: newLevel.benefits.filter((_, i) => i !== index),
    })
  }

  // Adicionar recompensa
  const handleAddReward = async () => {
    if (!effectiveBranchId) return

    if (!newReward.name || !newReward.description || newReward.pointsRequired <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await customerService.addLoyaltyReward(
        {
          name: newReward.name,
          description: newReward.description,
          pointsRequired: newReward.pointsRequired,
          isActive: newReward.isActive,
        },
        effectiveBranchId,
      )

      toast({
        title: "Recompensa adicionada",
        description: `A recompensa ${newReward.name} foi adicionada com sucesso`,
      })

      // Resetar formulário e recarregar dados
      setNewReward({
        name: "",
        description: "",
        pointsRequired: 0,
        isActive: true,
      })
      setIsAddingReward(false)
      loadData()
    } catch (error) {
      console.error("Erro ao adicionar recompensa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a recompensa",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Editar recompensa
  const handleEditReward = async () => {
    if (!effectiveBranchId || !editingRewardId) return

    if (!newReward.name || !newReward.description || newReward.pointsRequired <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await customerService.updateLoyaltyReward(
        editingRewardId,
        {
          name: newReward.name,
          description: newReward.description,
          pointsRequired: newReward.pointsRequired,
          isActive: newReward.isActive,
        },
        effectiveBranchId,
      )

      toast({
        title: "Recompensa atualizada",
        description: `A recompensa ${newReward.name} foi atualizada com sucesso`,
      })

      // Resetar formulário e recarregar dados
      setNewReward({
        name: "",
        description: "",
        pointsRequired: 0,
        isActive: true,
      })
      setEditingRewardId(null)
      setIsEditingReward(false)
      loadData()
    } catch (error) {
      console.error("Erro ao atualizar recompensa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a recompensa",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Excluir recompensa
  const handleDeleteReward = async () => {
    if (!effectiveBranchId || !deletingRewardId) return

    setIsLoading(true)
    try {
      await customerService.deleteLoyaltyReward(deletingRewardId, effectiveBranchId)

      toast({
        title: "Recompensa excluída",
        description: "A recompensa foi excluída com sucesso",
      })

      setDeletingRewardId(null)
      loadData()
    } catch (error) {
      console.error("Erro ao excluir recompensa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a recompensa",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Preparar edição de nível
  const prepareEditLevel = (level: LoyaltyLevel) => {
    setEditingLevelId(level.id)
    setNewLevel({
      name: level.name,
      minimumPoints: level.minimumPoints,
      discountPercentage: level.discountPercentage,
      benefits: [...level.benefits],
      newBenefit: "",
    })
    setIsEditingLevel(true)
  }

  // Preparar edição de recompensa
  const prepareEditReward = (reward: LoyaltyReward) => {
    setEditingRewardId(reward.id)
    setNewReward({
      name: reward.name,
      description: reward.description,
      pointsRequired: reward.pointsRequired,
      isActive: reward.isActive,
    })
    setIsEditingReward(true)
  }

  // Alternar status da recompensa
  const toggleRewardStatus = async (reward: LoyaltyReward) => {
    if (!effectiveBranchId) return

    setIsLoading(true)
    try {
      await customerService.updateLoyaltyReward(
        reward.id,
        {
          isActive: !reward.isActive,
        },
        effectiveBranchId,
      )

      toast({
        title: `Recompensa ${reward.isActive ? "desativada" : "ativada"}`,
        description: `A recompensa ${reward.name} foi ${reward.isActive ? "desativada" : "ativada"} com sucesso`,
      })

      loadData()
    } catch (error) {
      console.error("Erro ao atualizar status da recompensa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da recompensa",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Programa de Fidelidade</CardTitle>
        <CardDescription>
          Configure os níveis e recompensas do programa de fidelidade para seus clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Estatísticas do programa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-3xl font-semibold">{stats.totalCustomers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Clientes com Pontos</p>
                <p className="text-3xl font-semibold">{stats.customersWithLoyalty}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalCustomers > 0
                    ? `${Math.round((stats.customersWithLoyalty / stats.totalCustomers) * 100)}% do total`
                    : "0% do total"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Resgates Realizados</p>
                <p className="text-3xl font-semibold">{stats.totalRedemptions}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="levels" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="levels" className="flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Níveis
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center">
              <Gift className="h-4 w-4 mr-2" />
              Recompensas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="levels" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Níveis de Fidelidade</h3>
              <Button size="sm" onClick={() => setIsAddingLevel(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Nível
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {loyaltyLevels.map((level) => (
                  <Card key={level.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{level.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge>{level.minimumPoints} pontos</Badge>
                          <Button variant="ghost" size="icon" onClick={() => prepareEditLevel(level)}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingLevelId(level.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {level.discountPercentage > 0 && (
                        <CardDescription>{level.discountPercentage}% de desconto em todas as compras</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <h4 className="text-sm font-medium mb-2">Benefícios:</h4>
                      <ul className="space-y-1">
                        {level.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Recompensas Disponíveis</h3>
              <Button size="sm" onClick={() => setIsAddingReward(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Recompensa
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loyaltyRewards.map((reward) => (
                  <Card key={reward.id} className={!reward.isActive ? "opacity-60" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base flex items-center">
                          <Gift className="h-4 w-4 mr-2" />
                          {reward.name}
                          {!reward.isActive && (
                            <Badge variant="outline" className="ml-2 bg-muted">
                              Inativo
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={reward.isActive}
                            onCheckedChange={() => toggleRewardStatus(reward)}
                            aria-label={`${reward.isActive ? "Desativar" : "Ativar"} recompensa`}
                          />
                          <Button variant="ghost" size="icon" onClick={() => prepareEditReward(reward)}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingRewardId(reward.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>{reward.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline">{reward.pointsRequired} pontos</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Modal para adicionar nível */}
      <Dialog open={isAddingLevel} onOpenChange={setIsAddingLevel}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nível de Fidelidade</DialogTitle>
            <DialogDescription>Crie um novo nível para o programa de fidelidade</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level-name">Nome do Nível</Label>
                <Input
                  id="level-name"
                  value={newLevel.name}
                  onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                  placeholder="Ex: Ouro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimum-points">Pontos Mínimos</Label>
                <Input
                  id="minimum-points"
                  type="number"
                  min="0"
                  value={newLevel.minimumPoints}
                  onChange={(e) => setNewLevel({ ...newLevel, minimumPoints: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Desconto (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={newLevel.discountPercentage}
                onChange={(e) => setNewLevel({ ...newLevel, discountPercentage: Number.parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Benefícios</Label>
              <div className="flex gap-2">
                <Input
                  value={newLevel.newBenefit}
                  onChange={(e) => setNewLevel({ ...newLevel, newBenefit: e.target.value })}
                  placeholder="Adicione um benefício"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newLevel.newBenefit) {
                      e.preventDefault()
                      handleAddBenefit()
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={handleAddBenefit}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-2 space-y-2">
                {newLevel.benefits.map((benefit, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-md">
                    <span className="text-sm">{benefit}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveBenefit(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingLevel(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddLevel} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Nível"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar nível */}
      <Dialog open={isEditingLevel} onOpenChange={setIsEditingLevel}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Nível de Fidelidade</DialogTitle>
            <DialogDescription>Atualize as informações do nível de fidelidade</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-level-name">Nome do Nível</Label>
                <Input
                  id="edit-level-name"
                  value={newLevel.name}
                  onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                  placeholder="Ex: Ouro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minimum-points">Pontos Mínimos</Label>
                <Input
                  id="edit-minimum-points"
                  type="number"
                  min="0"
                  value={newLevel.minimumPoints}
                  onChange={(e) => setNewLevel({ ...newLevel, minimumPoints: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-discount">Desconto (%)</Label>
              <Input
                id="edit-discount"
                type="number"
                min="0"
                max="100"
                value={newLevel.discountPercentage}
                onChange={(e) => setNewLevel({ ...newLevel, discountPercentage: Number.parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Benefícios</Label>
              <div className="flex gap-2">
                <Input
                  value={newLevel.newBenefit}
                  onChange={(e) => setNewLevel({ ...newLevel, newBenefit: e.target.value })}
                  placeholder="Adicione um benefício"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newLevel.newBenefit) {
                      e.preventDefault()
                      handleAddBenefit()
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={handleAddBenefit}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-2 space-y-2">
                {newLevel.benefits.map((benefit, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded-md">
                    <span className="text-sm">{benefit}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveBenefit(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditingLevel(false)
                setEditingLevelId(null)
                setNewLevel({
                  name: "",
                  minimumPoints: 0,
                  discountPercentage: 0,
                  benefits: [],
                  newBenefit: "",
                })
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditLevel} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Atualizar Nível"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para adicionar recompensa */}
      <Dialog open={isAddingReward} onOpenChange={setIsAddingReward}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Recompensa</DialogTitle>
            <DialogDescription>Crie uma nova recompensa para o programa de fidelidade</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reward-name">Nome da Recompensa</Label>
              <Input
                id="reward-name"
                value={newReward.name}
                onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                placeholder="Ex: Desconto de R$ 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward-description">Descrição</Label>
              <Textarea
                id="reward-description"
                value={newReward.description}
                onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                placeholder="Descreva a recompensa"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points-required">Pontos Necessários</Label>
              <Input
                id="points-required"
                type="number"
                min="1"
                value={newReward.pointsRequired}
                onChange={(e) => setNewReward({ ...newReward, pointsRequired: Number.parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="reward-active"
                checked={newReward.isActive}
                onCheckedChange={(checked) => setNewReward({ ...newReward, isActive: checked })}
              />
              <Label htmlFor="reward-active">Recompensa ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingReward(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddReward} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Recompensa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar recompensa */}
      <Dialog open={isEditingReward} onOpenChange={setIsEditingReward}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Recompensa</DialogTitle>
            <DialogDescription>Atualize as informações da recompensa</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-reward-name">Nome da Recompensa</Label>
              <Input
                id="edit-reward-name"
                value={newReward.name}
                onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
                placeholder="Ex: Desconto de R$ 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-reward-description">Descrição</Label>
              <Textarea
                id="edit-reward-description"
                value={newReward.description}
                onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                placeholder="Descreva a recompensa"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-points-required">Pontos Necessários</Label>
              <Input
                id="edit-points-required"
                type="number"
                min="1"
                value={newReward.pointsRequired}
                onChange={(e) => setNewReward({ ...newReward, pointsRequired: Number.parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-reward-active"
                checked={newReward.isActive}
                onCheckedChange={(checked) => setNewReward({ ...newReward, isActive: checked })}
              />
              <Label htmlFor="edit-reward-active">Recompensa ativa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditingReward(false)
                setEditingRewardId(null)
                setNewReward({
                  name: "",
                  description: "",
                  pointsRequired: 0,
                  isActive: true,
                })
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditReward} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Atualizar Recompensa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para excluir nível */}
      <AlertDialog open={!!deletingLevelId} onOpenChange={(open) => !open && setDeletingLevelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Nível de Fidelidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este nível? Esta ação não pode ser desfeita e pode afetar os clientes que
              estão neste nível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLevel} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação para excluir recompensa */}
      <AlertDialog open={!!deletingRewardId} onOpenChange={(open) => !open && setDeletingRewardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Recompensa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta recompensa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReward} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
