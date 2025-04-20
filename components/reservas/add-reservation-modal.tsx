"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { useBranch } from "@/lib/contexts/branch-context"
import { customerService, productService } from "@/lib/services"
import { useToast } from "@/hooks/use-toast"
import type { Reservation } from "@/lib/services/reservation-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface AddReservationModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (reservation: Reservation) => void
  initialCustomer?: {
    id: string
    name: string
    email?: string
    phone?: string
    address?: string
  } | null
  initialItems?: {
    productId: string
    productName: string
    quantity: number
    price: number
  }[]
}

export function AddReservationModal({
  isOpen,
  onClose,
  onAdd,
  initialCustomer = null,
  initialItems = [],
}: AddReservationModalProps) {
  const { currentBranch } = useBranch()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string; address?: string }[]>([])
  const [products, setProducts] = useState<{ id: string; name: string; price: number }[]>([])
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [customerQuery, setCustomerQuery] = useState("")

  // Dados da reserva
  const [customerId, setCustomerId] = useState(initialCustomer?.id || "")
  const [customerName, setCustomerName] = useState(initialCustomer?.name || "")
  const [customerPhone, setCustomerPhone] = useState(initialCustomer?.phone || "")
  const [customerEmail, setCustomerEmail] = useState(initialCustomer?.email || "")
  const [customerAddress, setCustomerAddress] = useState(initialCustomer?.address || "") // Novo campo de endereço
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState("12:00")
  const [deliveryTime, setDeliveryTime] = useState("12:00")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; price: number }[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : [{ productId: "", productName: "", quantity: 1, price: 0 }],
  )

  // Novos campos
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro")
  const [hasAdvancePayment, setHasAdvancePayment] = useState<boolean>(false)
  const [advanceAmount, setAdvanceAmount] = useState<number>(0)
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState<string>("dinheiro")

  // Carregar produtos ao abrir o modal
  useEffect(() => {
    if (isOpen && currentBranch?.id) {
      loadProducts()
    }
  }, [isOpen, currentBranch?.id])

  useEffect(() => {
    if (isOpen) {
      if (initialCustomer) {
        setCustomerId(initialCustomer.id || "")
        setCustomerName(initialCustomer.name || "")
        setCustomerPhone(initialCustomer.phone || "")
        setCustomerEmail(initialCustomer.email || "")
        setCustomerAddress(initialCustomer.address || "")
      }

      if (initialItems && initialItems.length > 0) {
        setItems(initialItems)
      }
    }
  }, [isOpen, initialCustomer, initialItems])

  const loadProducts = async () => {
    if (!currentBranch?.id) return

    setIsLoadingProducts(true)
    try {
      const result = await productService.getAll(currentBranch.id)
      setProducts(
        result.map((product) => ({
          id: product.id || "",
          name: product.name,
          price: product.price,
        })),
      )
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const searchCustomers = async (query: string) => {
    if (!currentBranch?.id || query.length < 3) return

    setIsSearchingCustomer(true)
    try {
      const results = await customerService.search(currentBranch.id, query)
      setCustomers(
        results.map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone || "",
          address: customer.address || "",
        })),
      )
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar os clientes. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSearchingCustomer(false)
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    const selectedCustomer = customers.find((c) => c.id === customerId)
    if (selectedCustomer) {
      setCustomerId(selectedCustomer.id)
      setCustomerName(selectedCustomer.name)
      setCustomerPhone(selectedCustomer.phone)
      setCustomerAddress(selectedCustomer.address || "")
    }
  }

  const handleAddItem = () => {
    setItems([...items, { productId: "", productName: "", quantity: 1, price: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems.length ? newItems : [{ productId: "", productName: "", quantity: 1, price: 0 }])
  }

  const handleItemChange = (index: number, field: keyof (typeof items)[0], value: string | number) => {
    const newItems = [...items]

    if (field === "productId" && typeof value === "string") {
      const selectedProduct = products.find((p) => p.id === value)
      if (selectedProduct) {
        newItems[index] = {
          ...newItems[index],
          productId: value,
          productName: selectedProduct.name,
          price: selectedProduct.price,
        }
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: field === "quantity" || field === "price" ? Number(value) : value,
      }
    }

    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.quantity * item.price, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    if (!date || !deliveryDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione datas válidas para o pedido e entrega.",
        variant: "destructive",
      })
      return
    }

    if (!customerName || !customerPhone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome e telefone do cliente.",
        variant: "destructive",
      })
      return
    }

    if (!customerAddress) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o endereço do cliente.",
        variant: "destructive",
      })
      return
    }

    if (items.some((item) => !item.productId)) {
      toast({
        title: "Erro",
        description: "Por favor, selecione produtos válidos para todos os itens.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Criar datas com segurança
      const reservationDate = new Date(date)
      const [hours, minutes] = time.split(":").map(Number)

      if (!isNaN(hours) && !isNaN(minutes)) {
        reservationDate.setHours(hours, minutes, 0, 0)
      }

      const reservationDeliveryDate = new Date(deliveryDate)
      const [deliveryHours, deliveryMinutes] = deliveryTime.split(":").map(Number)

      if (!isNaN(deliveryHours) && !isNaN(deliveryMinutes)) {
        reservationDeliveryDate.setHours(deliveryHours, deliveryMinutes, 0, 0)
      }

      const total = calculateTotal()
      const remainingAmount = hasAdvancePayment ? total - advanceAmount : total

      const newReservation: Reservation = {
        branchId: currentBranch?.id || "",
        customerId: customerId,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        customerAddress: customerAddress, // Novo campo de endereço
        date: reservationDate,
        deliveryDate: reservationDeliveryDate,
        notes: notes,
        status: "pending",
        total: total,
        productId: items[0]?.productId || "",
        productName: items[0]?.productName || "",
        quantity: items.reduce((total, item) => total + item.quantity, 0),
        price: items[0]?.price || 0,
        // Novos campos
        paymentMethod: paymentMethod,
        hasAdvancePayment: hasAdvancePayment,
        advanceAmount: hasAdvancePayment ? advanceAmount : 0,
        advancePaymentMethod: hasAdvancePayment ? advancePaymentMethod : "",
        remainingAmount: remainingAmount,
        items: items,
      }

      onAdd(newReservation)
      resetForm()
      onClose()
    } catch (error) {
      console.error("Erro ao adicionar reserva:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a reserva. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setCustomerId("")
    setCustomerName("")
    setCustomerPhone("")
    setCustomerEmail("")
    setCustomerAddress("")
    setDate(new Date())
    setDeliveryDate(new Date())
    setTime("12:00")
    setDeliveryTime("12:00")
    setNotes("")
    setItems([{ productId: "", productName: "", quantity: 1, price: 0 }])
    setCustomerQuery("")
    setCustomers([])
    setPaymentMethod("dinheiro")
    setHasAdvancePayment(false)
    setAdvanceAmount(0)
    setAdvancePaymentMethod("dinheiro")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Reserva</DialogTitle>
          <DialogDescription>Preencha os dados para criar uma nova reserva.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente</Label>
              <div className="flex gap-2">
                <Input
                  id="customer"
                  placeholder="Buscar cliente por nome ou telefone..."
                  value={customerQuery}
                  onChange={(e) => {
                    setCustomerQuery(e.target.value)
                    searchCustomers(e.target.value)
                  }}
                  className="flex-1"
                />
                {customers.length > 0 && (
                  <Select onValueChange={handleCustomerSelect}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nome do Cliente*</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Telefone*</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="email@exemplo.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Endereço*</Label>
              <Textarea
                id="customerAddress"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade, CEP"
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Pedido*</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
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
              <div className="space-y-2">
                <Label htmlFor="time">Horário do Pedido*</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Entrega*</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deliveryDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate ? format(deliveryDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={setDeliveryDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Horário de Entrega*</Label>
                <Input
                  id="deliveryTime"
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Produtos*</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-1 h-3 w-3" /> Adicionar Produto
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-[3fr,1fr,2fr,auto] gap-2 items-end">
                    <div>
                      <Label htmlFor={`item-${index}-product`} className="text-xs">
                        Produto*
                      </Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => handleItemChange(index, "productId", value)}
                      >
                        <SelectTrigger id={`item-${index}-product`}>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - R$ {product.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`item-${index}-quantity`} className="text-xs">
                        Qtd*
                      </Label>
                      <Input
                        id={`item-${index}-quantity`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`item-${index}-price`} className="text-xs">
                        Preço*
                      </Label>
                      <Input
                        id={`item-${index}-price`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, "price", e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 h-9 w-9"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento*</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dinheiro" id="payment-cash" />
                  <Label htmlFor="payment-cash" className="cursor-pointer">
                    Dinheiro
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cartao" id="payment-card" />
                  <Label htmlFor="payment-card" className="cursor-pointer">
                    Cartão
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="payment-pix" />
                  <Label htmlFor="payment-pix" className="cursor-pointer">
                    PIX
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transferencia" id="payment-transfer" />
                  <Label htmlFor="payment-transfer" className="cursor-pointer">
                    Transferência
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-advance"
                  checked={hasAdvancePayment}
                  onCheckedChange={(checked) => setHasAdvancePayment(checked === true)}
                />
                <Label htmlFor="has-advance" className="cursor-pointer">
                  Houve adiantamento?
                </Label>
              </div>

              {hasAdvancePayment && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="advance-amount">Valor do Adiantamento*</Label>
                    <Input
                      id="advance-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={calculateTotal()}
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                      required={hasAdvancePayment}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Forma de Pagamento do Adiantamento*</Label>
                    <Select value={advancePaymentMethod} onValueChange={setAdvancePaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais sobre a reserva"
                rows={3}
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <div className="space-y-1">
                <p className="text-lg font-medium">Total</p>
                {hasAdvancePayment && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Adiantamento:{" "}
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(advanceAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Restante:{" "}
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                        calculateTotal() - advanceAmount,
                      )}
                    </p>
                  </>
                )}
              </div>
              <p className="text-lg font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(calculateTotal())}
              </p>
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
