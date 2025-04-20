"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Customer, CustomerOrder, LoyaltyRedemption } from "@/lib/types"
import { customerService } from "@/lib/services/customer-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Edit, Gift, ShoppingBag, User } from "lucide-react"
import { RedeemRewardsModal } from "./redeem-rewards-modal"

interface CustomerDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer
  onUpdate: () => void
}

export function CustomerDetailsModal({ isOpen, onClose, customer, onUpdate }: CustomerDetailsModalProps) {
  const [orderHistory, setOrderHistory] = useState<CustomerOrder[]>([])
  const [redemptionHistory, setRedemptionHistory] = useState<LoyaltyRedemption[]>([])
  const [loyaltyLevel, setLoyaltyLevel] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { effectiveBranchId } = useBranch()
  const { toast } = useToast()
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen && customer && effectiveBranchId) {
      loadCustomerDetails()
    }
  }, [isOpen, customer, effectiveBranchId])

  const loadCustomerDetails = async () => {
    if (!customer || !effectiveBranchId) return

    setIsLoading(true)
    try {
      // Carregar histórico de pedidos
      const orders = await customerService.getOrderHistory(customer.id, effectiveBranchId)
      setOrderHistory(orders)

      // Carregar histórico de resgates
      const redemptions = await customerService.getRedemptionHistory(customer.id, effectiveBranchId)
      setRedemptionHistory(redemptions)

      // Carregar nível de fidelidade
      if (customer.loyaltyLevel) {
        setLoyaltyLevel(customer.loyaltyLevel)
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do cliente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do cliente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Detalhes do Cliente
          </DialogTitle>
          <DialogDescription>Informações detalhadas sobre {customer?.name}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">Carregando detalhes do cliente...</div>
        ) : (
          <Tabs defaultValue="info">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="loyalty">Fidelidade</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Nome</h4>
                  <p className="text-base">{customer?.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p className="text-base">{customer?.email || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Telefone</h4>
                  <p className="text-base">{customer?.phone || "-"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Endereço</h4>
                  <p className="text-base">{customer?.address || "-"}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Observações</h4>
                <p className="text-base">{customer?.notes || "Nenhuma observação registrada."}</p>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Histórico de Pedidos</h3>
                <Badge variant="outline">{orderHistory.length} pedidos</Badge>
              </div>

              {orderHistory.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  Este cliente ainda não realizou nenhum pedido.
                </div>
              ) : (
                <div className="space-y-4">
                  {orderHistory.map((order, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            <ShoppingBag className="mr-2 inline-block h-4 w-4" />
                            Pedido #{index + 1}
                          </CardTitle>
                          <Badge>
                            {order.status === "completed"
                              ? "Concluído"
                              : order.status === "pending"
                                ? "Pendente"
                                : "Cancelado"}
                          </Badge>
                        </div>
                        <CardDescription>{formatDate(order.date as Date)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {order.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex justify-between text-sm">
                              <span>
                                {item.quantity}x {item.name} {item.size ? `(${item.size})` : ""}
                              </span>
                              <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">Pagamento: {order.paymentMethod}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="loyalty" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pontos de Fidelidade</CardTitle>
                    <CardDescription>Pontos acumulados pelo cliente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{customer?.loyaltyPoints || 0}</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {loyaltyLevel ? `Nível: ${loyaltyLevel}` : "Nível: Bronze"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resgates</CardTitle>
                    <CardDescription>Histórico de recompensas resgatadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {redemptionHistory.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum resgate realizado</p>
                    ) : (
                      <div className="space-y-2">
                        {redemptionHistory.slice(0, 3).map((redemption, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="flex items-center">
                              <Gift className="mr-2 h-4 w-4" />
                              {redemption.rewardName}
                            </span>
                            <span className="text-muted-foreground">{formatDate(redemption.redeemedAt as Date)}</span>
                          </div>
                        ))}
                        {redemptionHistory.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{redemptionHistory.length - 3} outros resgates
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsRedeemModalOpen(true)}
            disabled={!customer?.loyaltyPoints || customer.loyaltyPoints <= 0}
          >
            <Gift className="h-4 w-4" />
            Resgatar Prêmios
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button className="gap-2">
            <Edit className="h-4 w-4" />
            Editar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
      {customer && (
        <RedeemRewardsModal
          isOpen={isRedeemModalOpen}
          onClose={() => setIsRedeemModalOpen(false)}
          customer={customer}
          onRedeemSuccess={() => {
            loadCustomerDetails()
            onUpdate()
          }}
        />
      )}
    </Dialog>
  )
}
