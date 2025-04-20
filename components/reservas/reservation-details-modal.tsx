"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Reservation } from "@/lib/services/reservation-service"

interface ReservationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: Reservation
}

// Modifique a função formatSafeDate para lidar com timestamps do Firestore
const formatSafeDate = (date: Date | string | number | any, formatStr: string): string => {
  if (!date) return "Data não disponível"

  try {
    let dateObj;
    
    // Verificar se é um timestamp do Firestore
    if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
      const milliseconds = date.seconds * 1000 + (date.nanoseconds || 0) / 1000000;
      dateObj = new Date(milliseconds);
    } else if (typeof date === "object") {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) {
      console.error("Data inválida em formatSafeDate:", date);
      return "Data não disponível";
    }

    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Data não disponível";
  }
}

export function ReservationDetailsModal({ isOpen, onClose, reservation }: ReservationDetailsModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendente
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Concluída
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelada
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "dinheiro":
        return "Dinheiro"
      case "cartao":
        return "Cartão"
      case "pix":
        return "PIX"
      case "transferencia":
        return "Transferência"
      default:
        return method
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Reserva</DialogTitle>
          <DialogDescription>Informações completas sobre a reserva.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{reservation.customerName}</h3>
              <p className="text-sm text-muted-foreground">{reservation.customerPhone}</p>
              {reservation.customerEmail && (
                <p className="text-sm text-muted-foreground">{reservation.customerEmail}</p>
              )}
            </div>
            <div>{getStatusBadge(reservation.status)}</div>
          </div>

          {reservation.customerAddress && (
            <div>
              <p className="text-sm font-medium">Endereço</p>
              <p className="text-sm whitespace-pre-line">{reservation.customerAddress}</p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Data do Pedido</p>
              <p className="text-sm">{formatSafeDate(reservation.date, "PPP 'às' HH:mm")}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Data de Entrega</p>
              <p className="text-sm">{formatSafeDate(reservation.deliveryDate, "PPP 'às' HH:mm")}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-2">Produtos</p>
            <div className="space-y-2">
              {reservation.items && reservation.items.length > 0 ? (
                reservation.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-muted-foreground"> x{item.quantity}</span>
                    </div>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{reservation.productName}</span>
                    <span className="text-muted-foreground"> x{reservation.quantity}</span>
                  </div>
                  <span>{formatCurrency(reservation.price * reservation.quantity)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Forma de Pagamento</p>
              <p className="text-sm">
                {reservation.paymentMethod ? formatPaymentMethod(reservation.paymentMethod) : "Não especificado"}
              </p>
            </div>

            {reservation.hasAdvancePayment && (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Adiantamento</p>
                  <p className="text-sm">{formatCurrency(reservation.advanceAmount || 0)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Forma de Pagamento do Adiantamento</p>
                  <p className="text-sm">
                    {reservation.advancePaymentMethod
                      ? formatPaymentMethod(reservation.advancePaymentMethod)
                      : "Não especificado"}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Valor Restante</p>
                  <p className="text-sm">{formatCurrency(reservation.remainingAmount || 0)}</p>
                </div>
              </>
            )}

            <div className="flex justify-between items-center font-bold">
              <p>Total</p>
              <p>{formatCurrency(reservation.total)}</p>
            </div>
          </div>

          {reservation.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium">Observações</p>
                <p className="text-sm whitespace-pre-line">{reservation.notes}</p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
