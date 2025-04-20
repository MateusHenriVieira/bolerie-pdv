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
import { employeeService, branchService } from "@/lib/services"
import type { Employee } from "@/lib/services/employee-service"
import type { Branch } from "@/lib/services/branch-service"

interface EmployeeTableProps {
  searchQuery: string
  onEdit: (employee: Employee) => void
}

export function EmployeeTable({ searchQuery, onEdit }: EmployeeTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedEmployees, fetchedBranches] = await Promise.all([
          employeeService.getAll(),
          branchService.getAll(),
        ])
        setEmployees(fetchedEmployees)
        setBranches(fetchedBranches)
        setLoading(false)
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        setLoading(false)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os funcionários. Tente novamente.",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [toast])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    try {
      await employeeService.delete(id)
      setEmployees(employees.filter((employee) => employee.id !== id))
      toast({
        title: "Funcionário excluído",
        description: "O funcionário foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir funcionário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o funcionário. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const getBranchName = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId)
    return branch ? branch.name : "Filial não encontrada"
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR").format(date)
  }

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortColumn) return 0

    let valueA, valueB

    switch (sortColumn) {
      case "name":
        valueA = a.name
        valueB = b.name
        break
      case "role":
        valueA = a.role
        valueB = b.role
        break
      case "salary":
        valueA = a.salary
        valueB = b.salary
        break
      case "hireDate":
        valueA = a.hireDate.getTime()
        valueB = b.hireDate.getTime()
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
              <TableHead>Função</TableHead>
              <TableHead>Filial</TableHead>
              <TableHead>Data Contratação</TableHead>
              <TableHead>Salário</TableHead>
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
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
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
            <TableHead className="cursor-pointer" onClick={() => handleSort("role")}>
              Função
              {sortColumn === "role" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </TableHead>
            <TableHead>Filial</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("hireDate")}>
              Data Contratação
              {sortColumn === "hireDate" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort("salary")}>
              Salário
              {sortColumn === "salary" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEmployees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Nenhum funcionário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            sortedEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell>{getBranchName(employee.branchId)}</TableCell>
                <TableCell>{formatDate(employee.hireDate)}</TableCell>
                <TableCell>R$ {employee.salary.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={employee.isActive ? "secondary" : "outline"}>
                    {employee.isActive ? "Ativo" : "Inativo"}
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
                      <DropdownMenuItem onClick={() => onEdit(employee)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteEmployee(employee.id)}>
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
