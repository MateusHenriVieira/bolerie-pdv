"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { reservationService } from "@/lib/services"
import type { CartItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useBranch } from "@/lib/contexts/branch-context"

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  customer: { id: string; name: string } | null
  total: number
}

export function ReservationModal({ isOpen, onClose, items, customer, total }: ReservationModalProps) {
  const { toast } = useToast()
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState("12:00")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { currentBranch } = useBranch()

  const handleSubmit = async () => {
    if (!date || !customer || !currentBranch?.id) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Combinar data e hora
      const [hours, minutes] = time.split(":").map(Number)
      const reservationDate = new Date(date)
      reservationDate.setHours(hours, minutes)

      // Criar a reserva
      await reservationService.add({
        customerId: customer.id,
        customerName: customer.name,
        date: reservationDate,
        items,
        notes,
        status: "pendente",
        total,
        branchId: currentBranch.id,
      })

      toast({
        title: "Reserva criada",
        description: `Reserva para ${customer.name} criada com sucesso!`,
      })

      // Fechar o modal e limpar os campos
      onClose()
      setDate(new Date())
      setTime("12:00")
      setNotes("")
    } catch (error) {
      console.error("Erro ao criar reserva:", error)
      toast({
        title: "Erro ao criar reserva",
        description: "Ocorreu um erro ao criar a reserva. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Reserva</DialogTitle>
          <DialogDescription>
            Preencha os detalhes da reserva para {customer?.name || "o cliente selecionado"}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Data da Reserva</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="time">Horário</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre a reserva..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div>
            <p className="text-sm font-medium">Itens Reservados:</p>
            <ul className="mt-2 space-y-1 text-sm">
              {items.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.product.name} ({item.product.size})
                  </span>
                  <span>R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between font-medium">
              <span>Total:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar Reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
