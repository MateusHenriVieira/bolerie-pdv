"use client"

import { useState, useEffect } from "react"
import { Edit, MoreHorizontal, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { branchService } from "@/lib/services"
import type { Branch } from "@/lib/services/branch-service"

interface BranchTableProps {
  searchQuery: string
  onEdit: (branch: Branch) => void
}

export function BranchTable({ searchQuery, onEdit }: BranchTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const fetchedBranches = await branchService.getAll()
        setBranches(fetchedBranches)
        setLoading(false)
      } catch (error) {
        console.error("Erro ao buscar filiais:", error)
        setLoading(false)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as filiais. Tente novamente.",
          variant: "destructive",
        })
      }
    }

    fetchBranches()
  }, [toast])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleDeleteBranch = async (id: string) => {
    try {
      await branchService.delete(id)
      setBranches(branches.filter((branch) => branch.id !== id))
      toast({
        title: "Filial excluída",
        description: "A filial foi excluída com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir filial:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a filial. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const filteredBranches = branches.filter((branch) => {
    // Garantir que searchQuery não seja undefined
    const query = searchQuery?.toLowerCase() || ""

    // Verificar cada propriedade com segurança
    const nameMatch = (branch.name?.toLowerCase() || "").includes(query)
    const addressMatch = (branch.address?.toLowerCase() || "").includes(query)
    const managerMatch = (branch.manager?.toLowerCase() || "").includes(query)

    return nameMatch || addressMatch || managerMatch
  })

  const sortedBranches = [...filteredBranches].sort((a, b) => {
    if (!sortColumn) return 0

    let valueA, valueB

    switch (sortColumn) {
      case "name":
        valueA = a.name
        valueB = b.name
        break
      case "address":
        valueA = a.address
        valueB = b.address
        break
      case "manager":
        valueA = a.manager
        valueB = b.manager
        break
      default:
        return 0
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Gerente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
              Nome
              {sortColumn === "name" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("address")}>
              Endereço
              {sortColumn === "address" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("manager")}>
              Gerente
              {sortColumn === "manager" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBranches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhuma filial encontrada.
              </TableCell>
            </TableRow>
          ) : (
            sortedBranches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell className="font-medium">{branch.name}</TableCell>
                <TableCell>{branch.address}</TableCell>
                <TableCell>{branch.phone}</TableCell>
                <TableCell>{branch.manager}</TableCell>
                <TableCell>
                  <Badge variant={branch.isActive ? "secondary" : "outline"}>
                    {branch.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(branch)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteBranch(branch.id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
