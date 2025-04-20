"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddCustomerModal } from "@/components/vendas/add-customer-modal"
import { customerService } from "@/lib/services/customer-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { useToast } from "@/hooks/use-toast"

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
}

interface CustomerSearchProps {
  onSelectCustomer: (customer: Customer | null) => void
  selectedCustomer: Customer | null
}

export function CustomerSearch({ onSelectCustomer, selectedCustomer }: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { effectiveBranchId } = useBranch()
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!searchTerm.trim() || !effectiveBranchId) return

    setIsSearching(true)
    try {
      const results = await customerService.search(searchTerm, effectiveBranchId)
      setSearchResults(results)
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar os clientes. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddCustomer = (customer: any) => {
    // Fechar o modal
    setIsAddModalOpen(false)

    // Selecionar o cliente recém-adicionado
    if (customer && customer.id) {
      onSelectCustomer(customer)

      // Limpar resultados da busca
      setSearchResults([])
      setSearchTerm("")

      toast({
        title: "Cliente selecionado",
        description: `${customer.name} foi selecionado para esta venda.`,
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer-search">Cliente</Label>
        <div className="flex space-x-2">
          <Input
            id="customer-search"
            placeholder="Buscar por nome ou telefone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Buscando..." : "Buscar"}
          </Button>
          <Button type="button" onClick={() => setIsAddModalOpen(true)}>
            Novo
          </Button>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
          <ul className="space-y-1">
            {searchResults.map((customer) => (
              <li key={customer.id}>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => {
                    onSelectCustomer(customer)
                    setSearchResults([])
                    setSearchTerm("")
                  }}
                >
                  <span className="font-medium">{customer.name}</span>
                  {customer.phone && <span className="ml-2 text-muted-foreground">{customer.phone}</span>}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedCustomer && (
        <div className="bg-muted p-3 rounded-md">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{selectedCustomer.name}</p>
              {selectedCustomer.phone && <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onSelectCustomer(null)} className="h-8 px-2">
              Remover
            </Button>
          </div>
        </div>
      )}

      <AddCustomerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddCustomer} />
    </div>
  )
}
