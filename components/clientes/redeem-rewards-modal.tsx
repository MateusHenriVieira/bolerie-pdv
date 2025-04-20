"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Gift, Award, AlertCircle } from "lucide-react"
import { customerService } from "@/lib/services/customer-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { useToast } from "@/hooks/use-toast"
import type { Customer, LoyaltyReward, LoyaltyLevel } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface RedeemRewardsModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer
  onRedeemSuccess: () => void
}

export function RedeemRewardsModal({ isOpen, onClose, customer, onRedeemSuccess }: RedeemRewardsModalProps) {
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([])
  const [customerLevel, setCustomerLevel] = useState<LoyaltyLevel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const { effectiveBranchId } = useBranch()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && effectiveBranchId) {
      loadRewardsAndLevel()
    }
  }, [isOpen, effectiveBranchId])

  const loadRewardsAndLevel = async () => {
    if (!effectiveBranchId) return

    setIsLoading(true)
    try {
      // Carregar todas as recompensas disponíveis
      const rewards = await customerService.getLoyaltyRewards(effectiveBranchId)
      setAvailableRewards(rewards)

      // Carregar o nível do cliente
      if (customer.loyaltyLevel) {
        const levels = await customerService.getLoyaltyLevels(effectiveBranchId)
        const level = levels.find((l) => l.id === customer.loyaltyLevel)
        if (level) {
          setCustomerLevel(level)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar recompensas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as recompensas disponíveis",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeemReward = async (reward: LoyaltyReward) => {
    if (!effectiveBranchId || !customer) return

    setIsRedeeming(true)
    try {
      const success = await customerService.redeemReward(customer.id, reward.id, effectiveBranchId)

      if (success) {
        toast({
          title: "Resgate realizado com sucesso!",
          description: `${reward.name} foi resgatado. Pontos restantes: ${customer.loyaltyPoints - reward.pointsRequired}`,
        })
        onRedeemSuccess()
        onClose()
      } else {
        toast({
          title: "Erro no resgate",
          description: "Não foi possível resgatar esta recompensa. Verifique se o cliente tem pontos suficientes.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao resgatar recompensa:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o resgate",
        variant: "destructive",
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  const canRedeemReward = (pointsRequired: number) => {
    return (customer?.loyaltyPoints || 0) >= pointsRequired
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Gift className="mr-2 h-5 w-5" />
            Resgatar Prêmios
          </DialogTitle>
          <DialogDescription>
            Cliente: {customer?.name} | Pontos disponíveis: {customer?.loyaltyPoints || 0}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">Carregando recompensas disponíveis...</div>
        ) : (
          <>
            {customerLevel && (
              <div className="mb-4">
                <Alert>
                  <Award className="h-4 w-4" />
                  <AlertTitle>Nível de Fidelidade: {customerLevel.name}</AlertTitle>
                  <AlertDescription>
                    {customerLevel.discountPercentage > 0 && (
                      <p>Desconto de {customerLevel.discountPercentage}% em todas as compras</p>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <ScrollArea className="h-[400px] pr-4">
              {availableRewards.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">Não há recompensas disponíveis no momento.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRewards.map((reward) => {
                    const canRedeem = canRedeemReward(reward.pointsRequired)
                    return (
                      <Card key={reward.id} className={!canRedeem ? "opacity-60" : ""}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{reward.name}</CardTitle>
                            <Badge variant={canRedeem ? "default" : "outline"}>{reward.pointsRequired} pontos</Badge>
                          </div>
                          <CardDescription>{reward.description}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                          {!canRedeem && (
                            <div className="text-xs text-muted-foreground flex items-center mb-2">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pontos insuficientes
                            </div>
                          )}
                          <Button
                            size="sm"
                            className="w-full"
                            disabled={!canRedeem || isRedeeming}
                            onClick={() => handleRedeemReward(reward)}
                          >
                            {isRedeeming ? "Processando..." : "Resgatar"}
                          </Button>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
