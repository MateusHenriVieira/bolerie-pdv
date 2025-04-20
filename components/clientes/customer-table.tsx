"use client"
import { Button } from "@/components/ui/button"
import type { Customer } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash, Eye } from "lucide-react"

interface CustomerTableProps {
  customers: Customer[]
  isLoading: boolean
  onViewDetails: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomerTable({ customers, isLoading, onViewDetails, onEdit, onDelete }: CustomerTableProps) {
  return (
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(customer)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(customer)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(customer)} className="text-red-600 focus:text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
