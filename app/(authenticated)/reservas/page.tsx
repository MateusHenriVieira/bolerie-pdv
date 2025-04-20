"use client"

import { useState, useEffect, useCallback } from "react"
import { format, isToday, isTomorrow, addDays, isAfter, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Plus, Search, Calendar, Clock, Eye, Edit, CheckCircle, XCircle, Trash, Printer } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import { AddReservationModal } from "@/components/reservas/add-reservation-modal"
import { ReservationDetailsModal } from "@/components/reservas/reservation-details-modal"
import { ReservationEditModal } from "@/components/reservas/reservation-edit-modal"
import { useBranch } from "@/lib/contexts/branch-context"
import { reservationService } from "@/lib/services/reservation-service"
import { useToast } from "@/hooks/use-toast"
import type { Reservation } from "@/lib/services/reservation-service"
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
import { Header } from "@/components/header"
import { printService } from "@/lib/services/print-service"

export default function ReservasPage() {
  const { currentBranch } = useBranch()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("todas")

  // Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

  // Carregar reservas
  const loadReservations = useCallback(async () => {
    if (!currentBranch?.id) return

    setIsLoading(true)
    try {
      const result = await reservationService.getAll(currentBranch.id)
      setReservations(result)
      setFilteredReservations(result)
    } catch (error) {
      console.error("Erro ao carregar reservas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as reservas. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentBranch?.id, toast])

  useEffect(() => {
    if (currentBranch?.id) {
      loadReservations()
    }
  }, [currentBranch?.id, loadReservations])

  // Filtrar reservas
  useEffect(() => {
    if (!reservations.length) return

    let filtered = [...reservations]

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((reservation) => reservation.status === statusFilter)
    }

    // Filtrar por data
    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      filterDate.setHours(0, 0, 0, 0)

      const nextDay = new Date(filterDate)
      nextDay.setDate(nextDay.getDate() + 1)

      filtered = filtered.filter((reservation) => {
        try {
          if (!reservation.deliveryDate) return false
          const reservationDate = new Date(reservation.deliveryDate)
          if (isNaN(reservationDate.getTime())) return false
          return reservationDate >= filterDate && reservationDate < nextDay
        } catch (error) {
          return false
        }
      })
    }

    // Filtrar por abas
    if (activeTab === "hoje") {
      filtered = filtered.filter((reservation) => {
        try {
          if (!reservation.deliveryDate) return false
          const reservationDate = new Date(reservation.deliveryDate)
          if (isNaN(reservationDate.getTime())) return false
          return isToday(reservationDate)
        } catch (error) {
          return false
        }
      })
    } else if (activeTab === "amanha") {
      filtered = filtered.filter((reservation) => {
        try {
          if (!reservation.deliveryDate) return false
          const reservationDate = new Date(reservation.deliveryDate)
          if (isNaN(reservationDate.getTime())) return false
          return isTomorrow(reservationDate)
        } catch (error) {
          return false
        }
      })
    } else if (activeTab === "proximas") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const nextWeek = addDays(today, 7)

      filtered = filtered.filter((reservation) => {
        try {
          if (!reservation.deliveryDate) return false
          const reservationDate = new Date(reservation.deliveryDate)
          if (isNaN(reservationDate.getTime())) return false
          return isAfter(reservationDate, today) && isBefore(reservationDate, nextWeek)
        } catch (error) {
          return false
        }
      })
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (reservation) =>
          reservation.customerName?.toLowerCase().includes(query) ||
          reservation.customerPhone?.toLowerCase().includes(query) ||
          reservation.customerEmail?.toLowerCase().includes(query) ||
          reservation.productName?.toLowerCase().includes(query),
      )
    }

    setFilteredReservations(filtered)
  }, [reservations, searchQuery, statusFilter, dateFilter, activeTab])

  // Manipuladores de eventos
  const handleAddReservation = async (reservation: Reservation) => {
    try {
      const newReservation = await reservationService.add(currentBranch?.id || "", reservation)
      toast({
        title: "Reserva adicionada",
        description: "A reserva foi adicionada com sucesso.",
      })

      // Imprimir comprovante da reserva
      printReservationReceipt(newReservation || reservation)

      loadReservations()
    } catch (error) {
      console.error("Erro ao adicionar reserva:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a reserva. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditReservation = async (reservation: Reservation) => {
    try {
      await reservationService.update(currentBranch?.id || "", reservation.id, reservation)
      toast({
        title: "Reserva atualizada",
        description: "A reserva foi atualizada com sucesso.",
      })
      loadReservations()
      setIsEditModalOpen(false)
    } catch (error) {
      console.error("Erro ao atualizar reserva:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a reserva. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteReservation = async () => {
    if (!selectedReservation) return

    try {
      await reservationService.delete(currentBranch?.id || "", selectedReservation.id)
      toast({
        title: "Reserva excluída",
        description: "A reserva foi excluída com sucesso.",
      })
      loadReservations()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Erro ao excluir reserva:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a reserva. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (reservationId: string, status: "pending" | "completed" | "cancelled") => {
    try {
      await reservationService.changeStatus(currentBranch?.id || "", reservationId, status)
      toast({
        title: "Status atualizado",
        description: "O status da reserva foi atualizado com sucesso.",
      })
      loadReservations()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da reserva. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Função para imprimir comprovante de reserva
  const printReservationReceipt = async (reservation: Reservation) => {
    try {
      // Carregar configurações da filial atual
      if (currentBranch?.id) {
        await printService.loadBranchSettings(currentBranch.id)
      }

      // Preparar os itens para impressão
      const items =
        reservation.items && reservation.items.length > 0
          ? reservation.items.map((item) => ({
              name: item.productName,
              price: item.price,
              quantity: item.quantity,
              size: item.size,
            }))
          : [
              {
                name: reservation.productName || "Produto",
                price: reservation.price || 0,
                quantity: reservation.quantity || 1,
                size: undefined,
              },
            ]

      // Preparar dados do cliente
      const customer = {
        id: reservation.customerId || "",
        name: reservation.customerName || "Cliente",
      }

      // Formatar data de entrega
      const deliveryDate = new Date(reservation.deliveryDate)
      const formattedDeliveryDate = !isNaN(deliveryDate.getTime())
        ? format(deliveryDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
        : "Data não definida"

      // Imprimir comprovante
      await printService.printReservationReceipt({
        customer,
        customerAddress: reservation.customerAddress, // Incluir o endereço do cliente
        items,
        total: reservation.total,
        paymentMethod: reservation.paymentMethod || "Não especificado",
        date: new Date(),
        branchId: currentBranch?.id,
        deliveryDate: formattedDeliveryDate,
        hasAdvancePayment: reservation.hasAdvancePayment || false,
        advanceAmount: reservation.advanceAmount || 0,
        advancePaymentMethod: reservation.advancePaymentMethod,
        remainingAmount: reservation.remainingAmount || 0,
        notes: reservation.notes,
      })

      toast({
        title: "Comprovante impresso",
        description: "O comprovante da reserva foi enviado para impressão.",
      })
    } catch (error) {
      console.error("Erro ao imprimir comprovante:", error)
      toast({
        title: "Erro na impressão",
        description: "Não foi possível imprimir o comprovante. Verifique a impressora.",
        variant: "destructive",
      })
    }
  }

  // Funções auxiliares
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

  // Modifique a função getRelativeDate para lidar corretamente com timestamps do Firestore
  const getRelativeDate = (date: any) => {
    try {
      if (!date) return "Data não definida"

      // Verificar se é um timestamp do Firestore (objeto com seconds e nanoseconds)
      if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
        // Converter timestamp do Firestore para Date
        const milliseconds = date.seconds * 1000 + date.nanoseconds / 1000000;
        date = new Date(milliseconds);
      } else if (typeof date === "string") {
        // Se for uma string, converter para objeto Date
        date = new Date(date);
      }

      // Verificar se a data é válida
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.error("Data inválida após conversão:", date);
        return "Data não definida";
      }

      if (isToday(date)) {
        return "Hoje";
      } else if (isTomorrow(date)) {
        return "Amanhã";
      } else {
        return format(date, "dd/MM/yyyy", { locale: ptBR });
      }
    } catch (error) {
      console.error("Erro ao formatar data:", error, date);
      return "Data não definida";
    }
  }

  // Também modifique a função formatDate para lidar com timestamps do Firestore
  const formatDate = (date: any) => {
    try {
      if (!date) return "Data não definida"
      
      // Verificar se é um timestamp do Firestore
      if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
        // Converter timestamp do Firestore para Date
        const milliseconds = date.seconds * 1000 + date.nanoseconds / 1000000;
        date = new Date(milliseconds);
      } else if (typeof date === "string") {
        date = new Date(date);
      }
      
      if (!(date instanceof Date) || isNaN(date.getTime())) return "Data inválida"
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Data inválida"
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
            <p className="text-muted-foreground">Gerencie as reservas de produtos da sua loja.</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Reserva
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar reservas..."
                      className="pl-8 w-full md:w-[300px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="completed">Concluídas</SelectItem>
                      <SelectItem value="cancelled">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-[240px] justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: ptBR }) : "Filtrar por data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <CalendarComponent
                        mode="single"
                        selected={dateFilter}
                        onSelect={setDateFilter}
                        initialFocus
                        locale={ptBR}
                      />
                      {dateFilter && (
                        <div className="p-3 border-t border-border">
                          <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)} className="w-full">
                            Limpar filtro
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>

            <Tabs defaultValue="todas" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-4">
                <TabsList className="w-full md:w-auto">
                  <TabsTrigger value="todas">Todas</TabsTrigger>
                  <TabsTrigger value="hoje">Hoje</TabsTrigger>
                  <TabsTrigger value="amanha">Amanhã</TabsTrigger>
                  <TabsTrigger value="proximas">Próximos 7 dias</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="todas" className="m-0">
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex flex-col gap-2 p-4 border rounded-md">
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                          <Skeleton className="h-4 w-1/4" />
                          <div className="flex justify-between mt-2">
                            <Skeleton className="h-4 w-1/5" />
                            <Skeleton className="h-4 w-1/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredReservations.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">Nenhuma reserva encontrada</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Não foram encontradas reservas com os filtros aplicados.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery("")
                          setStatusFilter("all")
                          setDateFilter(undefined)
                          setActiveTab("todas")
                        }}
                      >
                        Limpar filtros
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredReservations.map((reservation) => (
                        <div key={reservation.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <h3 className="font-medium">{reservation.customerName}</h3>
                                {getStatusBadge(reservation.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {reservation.customerPhone}
                                {reservation.customerEmail && ` • ${reservation.customerEmail}`}
                              </p>
                            </div>

                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  Entrega: {getRelativeDate(reservation.deliveryDate)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{formatCurrency(reservation.total)}</p>
                            </div>

                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsDetailsModalOpen(true)
                                }}
                              >
                                <span className="sr-only">Ver detalhes</span>
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsEditModalOpen(true)
                                }}
                              >
                                <span className="sr-only">Editar</span>
                                <Edit className="h-4 w-4" />
                              </Button>

                              {reservation.status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-green-600"
                                  onClick={() => handleStatusChange(reservation.id, "completed")}
                                >
                                  <span className="sr-only">Marcar como concluída</span>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}

                              {reservation.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600"
                                  onClick={() => handleStatusChange(reservation.id, "cancelled")}
                                >
                                  <span className="sr-only">Marcar como cancelada</span>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => printReservationReceipt(reservation)}
                              >
                                <span className="sr-only">Imprimir</span>
                                <Printer className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <span className="sr-only">Excluir</span>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-2 text-sm">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {reservation.items && reservation.items.length > 0 ? (
                                reservation.items.map((item, index) => (
                                  <span key={index}>
                                    {item.productName} x{item.quantity}
                                  </span>
                                ))
                              ) : (
                                <span>
                                  {reservation.productName} x{reservation.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </TabsContent>

              <TabsContent value="hoje" className="m-0">
                <CardContent className="p-0">
                  {/* Conteúdo idêntico ao da aba "todas", mas já filtrado pelo useEffect */}
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex flex-col gap-2 p-4 border rounded-md">
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                          <Skeleton className="h-4 w-1/4" />
                          <div className="flex justify-between mt-2">
                            <Skeleton className="h-4 w-1/5" />
                            <Skeleton className="h-4 w-1/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredReservations.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">Nenhuma reserva para hoje</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Não há reservas programadas para entrega hoje.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredReservations.map((reservation) => (
                        <div key={reservation.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <h3 className="font-medium">{reservation.customerName}</h3>
                                {getStatusBadge(reservation.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {reservation.customerPhone}
                                {reservation.customerEmail && ` • ${reservation.customerEmail}`}
                              </p>
                            </div>

                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  Entrega: {(() => {
                                    try {
                                      if (!reservation.deliveryDate) return "Horário não definido"
                                      
                                      // Verificar se é um timestamp do Firestore
                                      let dateObj;
                                      if (reservation.deliveryDate && typeof reservation.deliveryDate === 'object' && 'seconds' in reservation.deliveryDate) {
                                        const milliseconds = reservation.deliveryDate.seconds * 1000 + 
                                                            (reservation.deliveryDate.nanoseconds || 0) / 1000000;
                                        dateObj = new Date(milliseconds);
                                      } else {
                                        dateObj = new Date(reservation.deliveryDate);
                                      }
                                      
                                      if (isNaN(dateObj.getTime())) {
                                        console.error("Data inválida na entrega:", reservation.deliveryDate);
                                        return "Horário não definido";
                                      }
                                      return format(dateObj, "HH:mm", { locale: ptBR });
                                    } catch (error) {
                                      console.error("Erro ao formatar horário:", error);
                                      return "Horário não definido";
                                    }
                                  })()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{formatCurrency(reservation.total)}</p>
                            </div>

                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsDetailsModalOpen(true)
                                }}
                              >
                                <span className="sr-only">Ver detalhes</span>
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsEditModalOpen(true)
                                }}
                              >
                                <span className="sr-only">Editar</span>
                                <Edit className="h-4 w-4" />
                              </Button>

                              {reservation.status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-green-600"
                                  onClick={() => handleStatusChange(reservation.id, "completed")}
                                >
                                  <span className="sr-only">Marcar como concluída</span>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}

                              {reservation.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600"
                                  onClick={() => handleStatusChange(reservation.id, "cancelled")}
                                >
                                  <span className="sr-only">Marcar como cancelada</span>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => printReservationReceipt(reservation)}
                              >
                                <span className="sr-only">Imprimir</span>
                                <Printer className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <span className="sr-only">Excluir</span>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-2 text-sm">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {reservation.items && reservation.items.length > 0 ? (
                                reservation.items.map((item, index) => (
                                  <span key={index}>
                                    {item.productName} x{item.quantity}
                                  </span>
                                ))
                              ) : (
                                <span>
                                  {reservation.productName} x{reservation.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </TabsContent>

              {/* As outras abas (amanhã e próximos 7 dias) seguem o mesmo padrão */}
              <TabsContent value="amanha" className="m-0">
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex flex-col gap-2 p-4 border rounded-md">
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                          <Skeleton className="h-4 w-1/4" />
                          <div className="flex justify-between mt-2">
                            <Skeleton className="h-4 w-1/5" />
                            <Skeleton className="h-4 w-1/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredReservations.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">Nenhuma reserva para amanhã</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Não há reservas programadas para entrega amanhã.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredReservations.map((reservation) => (
                        <div key={reservation.id} className="p-4 hover:bg-muted/50 transition-colors">
                          {/* Conteúdo idêntico ao da aba "hoje" */}
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <h3 className="font-medium">{reservation.customerName}</h3>
                                {getStatusBadge(reservation.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {reservation.customerPhone}
                                {reservation.customerEmail && ` • ${reservation.customerEmail}`}
                              </p>
                            </div>

                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  Entrega: {(() => {
                                    try {
                                      if (!reservation.deliveryDate) return "Horário não definido"
                                      
                                      // Verificar se é um timestamp do Firestore
                                      let dateObj;
                                      if (reservation.deliveryDate && typeof reservation.deliveryDate === 'object' && 'seconds' in reservation.deliveryDate) {
                                        const milliseconds = reservation.deliveryDate.seconds * 1000 + 
                                                            (reservation.deliveryDate.nanoseconds || 0) / 1000000;
                                        dateObj = new Date(milliseconds);
                                      } else {
                                        dateObj = new Date(reservation.deliveryDate);
                                      }
                                      
                                      if (isNaN(dateObj.getTime())) {
                                        console.error("Data inválida na entrega:", reservation.deliveryDate);
                                        return "Horário não definido";
                                      }
                                      return format(dateObj, "HH:mm", { locale: ptBR });
                                    } catch (error) {
                                      console.error("Erro ao formatar horário:", error);
                                      return "Horário não definido";
                                    }
                                  })()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{formatCurrency(reservation.total)}</p>
                            </div>

                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsDetailsModalOpen(true)
                                }}
                              >
                                <span className="sr-only">Ver detalhes</span>
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsEditModalOpen(true)
                                }}
                              >
                                <span className="sr-only">Editar</span>
                                <Edit className="h-4 w-4" />
                              </Button>

                              {reservation.status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-green-600"
                                  onClick={() => handleStatusChange(reservation.id, "completed")}
                                >
                                  <span className="sr-only">Marcar como concluída</span>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}

                              {reservation.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600"
                                  onClick={() => handleStatusChange(reservation.id, "cancelled")}
                                >
                                  <span className="sr-only">Marcar como cancelada</span>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => printReservationReceipt(reservation)}
                              >
                                <span className="sr-only">Imprimir</span>
                                <Printer className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <span className="sr-only">Excluir</span>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-2 text-sm">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {reservation.items && reservation.items.length > 0 ? (
                                reservation.items.map((item, index) => (
                                  <span key={index}>
                                    {item.productName} x{item.quantity}
                                  </span>
                                ))
                              ) : (
                                <span>
                                  {reservation.productName} x{reservation.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </TabsContent>

              {/* As outras abas (amanhã e próximos 7 dias) seguem o mesmo padrão */}
              <TabsContent value="amanha" className="m-0">
                <CardContent className="p-0">
                  {/* Conteúdo similar ao da aba "hoje" */}
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex flex-col gap-2 p-4 border rounded-md">
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                          <Skeleton className="h-4 w-1/4" />
                          <div className="flex justify-between mt-2">
                            <Skeleton className="h-4 w-1/5" />
                            <Skeleton className="h-4 w-1/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredReservations.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">Nenhuma reserva para amanhã</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Não há reservas programadas para entrega amanhã.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredReservations.map((reservation) => (
                        <div key={reservation.id} className="p-4 hover:bg-muted/50 transition-colors">
                          {/* Conteúdo idêntico ao da aba "hoje" */}
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <h3 className="font-medium">{reservation.customerName}</h3>
                                {getStatusBadge(reservation.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {reservation.customerPhone}
                                {reservation.customerEmail && ` • ${reservation.customerEmail}`}
                              </p>
                            </div>

                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  Entrega: {(() => {
                                    try {
                                      if (!reservation.deliveryDate) return "Horário não definido"
                                      
                                      // Verificar se é um timestamp do Firestore
                                      let dateObj;
                                      if (reservation.deliveryDate && typeof reservation.deliveryDate === 'object' && 'seconds' in reservation.deliveryDate) {
                                        const milliseconds = reservation.deliveryDate.seconds * 1000 + 
                                                            (reservation.deliveryDate.nanoseconds || 0) / 1000000;
                                        dateObj = new Date(milliseconds);
                                      } else {
                                        dateObj = new Date(reservation.deliveryDate);
                                      }
                                      
                                      if (isNaN(dateObj.getTime())) {
                                        return "Horário não definido"
                                      }
                                      return format(dateObj, "HH:mm", { locale: ptBR })
                                    } catch (error) {
                                      console.error("Erro ao formatar horário:", error)
                                      return "Horário não definido"
                                    }
                                  })()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{formatCurrency(reservation.total)}</p>
                            </div>

                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsDetailsModalOpen(true)
                                }}
                              >
                                <span className="sr-only">Ver detalhes</span>
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsEditModalOpen(true)
                                }}
                              >
                                <span className="sr-only">Editar</span>
                                <Edit className="h-4 w-4" />
                              </Button>

                              {reservation.status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-green-600"
                                  onClick={() => handleStatusChange(reservation.id, "completed")}
                                >
                                  <span className="sr-only">Marcar como concluída</span>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}

                              {reservation.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600"
                                  onClick={() => handleStatusChange(reservation.id, "cancelled")}
                                >
                                  <span className="sr-only">Marcar como cancelada</span>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => printReservationReceipt(reservation)}
                              >
                                <span className="sr-only">Imprimir</span>
                                <Printer className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <span className="sr-only">Excluir</span>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-2 text-sm">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {reservation.items && reservation.items.length > 0 ? (
                                reservation.items.map((item, index) => (
                                  <span key={index}>
                                    {item.productName} x{item.quantity}
                                  </span>
                                ))
                              ) : (
                                <span>
                                  {reservation.productName} x{reservation.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </TabsContent>

              <TabsContent value="proximas" className="m-0">
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex flex-col gap-2 p-4 border rounded-md">
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                          <Skeleton className="h-4 w-1/4" />
                          <div className="flex justify-between mt-2">
                            <Skeleton className="h-4 w-1/5" />
                            <Skeleton className="h-4 w-1/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredReservations.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">Nenhuma reserva para os próximos dias</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Não há reservas programadas para os próximos 7 dias.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredReservations.map((reservation) => (
                        <div key={reservation.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <h3 className="font-medium">{reservation.customerName}</h3>
                                {getStatusBadge(reservation.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {reservation.customerPhone}
                                {reservation.customerEmail && ` • ${reservation.customerEmail}`}
                              </p>
                            </div>

                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  Entrega: {getRelativeDate(reservation.deliveryDate)} às {(() => {
                                    try {
                                      if (!reservation.deliveryDate) return "Horário não definido"
                                      
                                      // Verificar se é um timestamp do Firestore
                                      let dateObj;
                                      if (reservation.deliveryDate && typeof reservation.deliveryDate === 'object' && 'seconds' in reservation.deliveryDate) {
                                        const milliseconds = reservation.deliveryDate.seconds * 1000 + 
                                                            (reservation.deliveryDate.nanoseconds || 0) / 1000000;
                                        dateObj = new Date(milliseconds);
                                      } else {
                                        dateObj = new Date(reservation.deliveryDate);
                                      }
                                      
                                      if (isNaN(dateObj.getTime())) {
                                        return "Horário não definido"
                                      }
                                      return format(dateObj, "HH:mm", { locale: ptBR })
                                    } catch (error) {
                                      console.error("Erro ao formatar horário:", error)
                                      return "Horário não definido"
                                    }
                                  })()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{formatCurrency(reservation.total)}</p>
                            </div>

                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsDetailsModalOpen(true)
                                }}
                              >
                                <span className="sr-only">Ver detalhes</span>
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsEditModalOpen(true)
                                }}
                              >
                                <span className="sr-only">Editar</span>
                                <Edit className="h-4 w-4" />
                              </Button>

                              {reservation.status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-green-600"
                                  onClick={() => handleStatusChange(reservation.id, "completed")}
                                >
                                  <span className="sr-only">Marcar como concluída</span>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}

                              {reservation.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600"
                                  onClick={() => handleStatusChange(reservation.id, "cancelled")}
                                >
                                  <span className="sr-only">Marcar como cancelada</span>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => printReservationReceipt(reservation)}
                              >
                                <span className="sr-only">Imprimir</span>
                                <Printer className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => {
                                  setSelectedReservation(reservation)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <span className="sr-only">Excluir</span>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mt-2 text-sm">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {reservation.items && reservation.items.length > 0 ? (
                                reservation.items.map((item, index) => (
                                  <span key={index}>
                                    {item.productName} x{item.quantity}
                                  </span>
                                ))
                              ) : (
                                <span>
                                  {reservation.productName} x{reservation.quantity}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </main>

      {/* Modais */}
      <AddReservationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddReservation}
      />

      {selectedReservation && (
        <>
          <ReservationDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            reservation={selectedReservation}
          />

          <ReservationEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            reservation={selectedReservation}
            onSave={handleEditReservation}
          />

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Reserva</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteReservation} className="bg-red-600 hover:bg-red-700">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
