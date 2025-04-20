"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddCustomerModal } from "@/components/clientes/add-customer-modal"
import { CustomerDetailsModal } from "@/components/clientes/customer-details-modal"
import { customerService } from "@/lib/services/customer-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { useToast } from "@/hooks/use-toast"
import type { Customer } from "@/lib/types"
import { Search } from "lucide-react"

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const { currentBranch, effectiveBranchId } = useBranch()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (effectiveBranchId) {
      loadCustomers()
    }
  }, [effectiveBranchId])

  const loadCustomers = async () => {
    if (!effectiveBranchId) return

    setIsLoading(true)
    try {
      const data = await customerService.getAll(effectiveBranchId)
      setCustomers(data)
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!effectiveBranchId) return

    setIsLoading(true)
    try {
      const data = await customerService.search(searchQuery, effectiveBranchId)
      setCustomers(data)
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar os clientes. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev])
    setIsAddModalOpen(false)
    toast({
      title: "Cliente adicionado",
      description: `${newCustomer.name} foi adicionado com sucesso.`,
    })
  }

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDetailsModalOpen(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
        <p className="text-muted-foreground">
          Gerencie seus clientes, visualize histórico de compras e programe fidelidade.
        </p>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList>
          <TabsTrigger value="todos">Todos os Clientes</TabsTrigger>
          <TabsTrigger value="fidelidade">Programa de Fidelidade</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Clientes Cadastrados</h2>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <p className="text-sm mb-2">Buscar clientes</p>
                  <div className="relative">
                    <Input
                      placeholder="Digite o nome ou telefone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch}>Buscar</Button>
                </div>
                <div className="flex items-end ml-auto">
                  <Button onClick={() => setIsAddModalOpen(true)} className="bg-pink-600 hover:bg-pink-700">
                    Adicionar Cliente
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Nome</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Telefone</th>
                      <th className="text-left py-3 px-4">Pontos</th>
                      <th className="text-left py-3 px-4">Pedidos</th>
                      <th className="text-right py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          Carregando clientes...
                        </td>
                      </tr>
                    ) : customers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8">
                          Nenhum cliente encontrado.
                        </td>
                      </tr>
                    ) : (
                      customers.map((customer) => (
                        <tr key={customer.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{customer.name}</td>
                          <td className="py-3 px-4">{customer.email || "-"}</td>
                          <td className="py-3 px-4">{customer.phone || "-"}</td>
                          <td className="py-3 px-4">{customer.loyaltyPoints || 0}</td>
                          <td className="py-3 px-4">{customer.totalOrders || 0}</td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(customer)}>
                              Detalhes
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fidelidade">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Programa de Fidelidade</h2>
            <p className="text-muted-foreground">Configure e gerencie o programa de fidelidade para seus clientes.</p>
            <div className="mt-4">
              <Button onClick={() => router.push("/configuracoes/fidelidade")}>
                Configurar Programa de Fidelidade
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reservas">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Reservas de Clientes</h2>
            <p className="text-muted-foreground">Visualize e gerencie as reservas feitas pelos clientes.</p>
            <div className="mt-4">
              <Button onClick={() => router.push("/reservas")}>Ver Todas as Reservas</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddCustomer} />

      {selectedCustomer && (
        <CustomerDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          customer={selectedCustomer}
          onUpdate={() => loadCustomers()}
        />
      )}
    </div>
  )
}
