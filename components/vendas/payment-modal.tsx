"use client"

import { useState, useMemo } from "react"
import { Check, CreditCard, DollarSign, QrCode, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useBranch } from "@/lib/contexts/branch-context"
import { saleService } from "@/lib/services/sale-service"
import { printService } from "@/lib/services/print-service"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (paymentMethod?: string) => void
  total: number
  items: {
    id: string
    name: string
    price: number
    quantity: number
    size?: string
    costPrice?: number
  }[]
  customer: { id: string; name: string } | null
}

export function PaymentModal({ isOpen, onClose, onComplete, total, items, customer }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("credit")
  const [receivedAmount, setReceivedAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [printReceipt, setPrintReceipt] = useState(true)
  const { currentBranch } = useBranch()
  const { toast } = useToast()

  // Calcular o custo total e o lucro estimado
  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.costPrice || 0) * item.quantity, 0)
  }, [items])

  const estimatedProfit = useMemo(() => {
    return total - totalCost
  }, [total, totalCost])

  const profitMargin = useMemo(() => {
    return total > 0 ? (estimatedProfit / total) * 100 : 0
  }, [estimatedProfit, total])

  const totalUnits = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  const handlePayment = async () => {
    if (!currentBranch?.id) {
      toast({
        title: "Erro",
        description: "Selecione uma filial antes de finalizar a venda",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Preparar os itens para o carrinho com verificações de segurança
      const cart = items.map((item) => ({
        product: {
          id: item.id || "",
          name: item.name || "Produto sem nome",
          price: item.price || 0,
          costPrice: item.costPrice || 0,
          selectedSize: item.size || null,
        },
        quantity: item.quantity || 0,
      }))

      // Registrar a venda
      await saleService.add(
        cart,
        total || 0,
        paymentMethod || "não especificado",
        customer?.id || null,
        currentBranch.id,
      )

      // Imprimir comprovante se a opção estiver marcada
      if (printReceipt) {
        await printService.printReceipt({
          customer,
          items,
          total,
          paymentMethod,
          date: new Date(),
          branchId: currentBranch.id, // Passando o ID da filial para o serviço de impressão
        })
      }

      toast({
        title: "Venda finalizada",
        description: "A venda foi registrada com sucesso!",
      })
      onComplete(paymentMethod)
    } catch (error) {
      console.error("Erro ao finalizar venda:", error)
      toast({
        title: "Erro",
        description: `Erro ao finalizar venda: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setPaymentMethod("credit")
      setReceivedAmount("")
    }
  }

  const getChange = () => {
    const received = Number.parseFloat(receivedAmount) || 0
    return Math.max(0, received - total).toFixed(2)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isProcessing) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
          <DialogDescription>
            Total: R$ {total.toFixed(2)} - {items.length} {items.length === 1 ? "item" : "itens"} ({totalUnits}{" "}
            {totalUnits === 1 ? "unidade" : "unidades"})
          </DialogDescription>
        </DialogHeader>

        {customer && (
          <div className="bg-muted p-3 rounded-md mb-4">
            <p className="text-sm font-medium">Cliente: {customer.name}</p>
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="bg-muted/50 p-3 rounded-md mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm">Custo total:</span>
              <span className="text-sm font-medium">R$ {totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Lucro estimado:</span>
              <span className="text-sm font-medium text-green-600">R$ {estimatedProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Margem de lucro:</span>
              <span className="text-sm font-medium">{profitMargin.toFixed(2)}%</span>
            </div>
          </div>

          <Separator />

          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-4">
            <Label
              htmlFor="credit"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="credit" id="credit" className="sr-only" />
              <CreditCard className="mb-3 h-6 w-6" />
              Cartão
            </Label>
            <Label
              htmlFor="pix"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="pix" id="pix" className="sr-only" />
              <QrCode className="mb-3 h-6 w-6" />
              Pix
            </Label>
            <Label
              htmlFor="cash"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="cash" id="cash" className="sr-only" />
              <DollarSign className="mb-3 h-6 w-6" />
              Dinheiro
            </Label>
          </RadioGroup>

          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <Label htmlFor="received">Valor Recebido</Label>
              <Input
                id="received"
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="0.00"
              />
              {Number.parseFloat(receivedAmount) > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Troco: </span>
                  <span>R$ {getChange()}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="print-receipt"
              checked={printReceipt}
              onCheckedChange={(checked) => setPrintReceipt(checked as boolean)}
            />
            <Label htmlFor="print-receipt" className="flex items-center cursor-pointer">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir comprovante
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing || (paymentMethod === "cash" && Number.parseFloat(receivedAmount) < total)}
          >
            {isProcessing ? (
              <>
                <Check className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              `Finalizar Pagamento (${items.length} ${items.length === 1 ? "item" : "itens"})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
