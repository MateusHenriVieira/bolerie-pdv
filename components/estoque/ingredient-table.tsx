"use client"

import { useState, useEffect } from "react"
import { Edit, MoreHorizontal, Trash, ArrowDownCircle } from "lucide-react"
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
import { ingredientService } from "@/lib/services"
import type { Ingredient } from "@/lib/types"
import { IngredientOutputModal } from "./ingredient-output-modal"
import { useBranch } from "@/lib/contexts/branch-context"

interface IngredientTableProps {
  searchQuery: string
}

export function IngredientTable({ searchQuery }: IngredientTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const { toast } = useToast()
  const { currentBranch } = useBranch()

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        if (!currentBranch?.id) {
          setIngredients([])
          setLoading(false)
          return
        }

        const fetchedIngredients = await ingredientService.getAll(currentBranch.id)
        setIngredients(fetchedIngredients)
        setLoading(false)
      } catch (error) {
        console.error("Erro ao buscar ingredientes:", error)
        setLoading(false)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os ingredientes. Tente novamente.",
          variant: "destructive",
        })
      }
    }

    fetchIngredients()
  }, [toast, currentBranch])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleDeleteIngredient = async (id: string) => {
    if (!currentBranch?.id) {
      toast({
        title: "Erro",
        description: "Nenhuma filial selecionada.",
        variant: "destructive",
      })
      return
    }

    try {
      await ingredientService.delete(id, currentBranch.id)
      setIngredients(ingredients.filter((ingredient) => ingredient.id !== id))
      toast({
        title: "Ingrediente excluído",
        description: "O ingrediente foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir ingrediente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o ingrediente. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleOpenOutputModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setIsOutputModalOpen(true)
  }

  const handleOutputIngredient = async (data: any) => {
    // Atualizar a lista de ingredientes após registrar a saída
    if (currentBranch?.id) {
      const updatedIngredients = await ingredientService.getAll(currentBranch.id)
      setIngredients(updatedIngredients)
    }
  }

  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedIngredients = [...filteredIngredients].sort((a, b) => {
    if (!sortColumn) return 0

    let valueA, valueB

    switch (sortColumn) {
      case "name":
        valueA = a.name
        valueB = b.name
        break
      case "quantity":
        valueA = a.quantity
        valueB = b.quantity
        break
      case "cost":
        valueA = a.cost
        valueB = b.cost
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
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Custo Unitário</TableHead>
              <TableHead className="text-right">Status</TableHead>
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
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-5 w-16 ml-auto" />
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
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                Nome
                {sortColumn === "name" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort("quantity")}>
                Quantidade
                {sortColumn === "quantity" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort("cost")}>
                Custo Unitário
                {sortColumn === "cost" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
              </TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIngredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {currentBranch?.id
                    ? "Nenhum ingrediente encontrado."
                    : "Selecione uma filial para visualizar os ingredientes."}
                </TableCell>
              </TableRow>
            ) : (
              sortedIngredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell className="text-right">
                    {ingredient.quantity} {ingredient.unit}
                  </TableCell>
                  <TableCell className="text-right">R$ {ingredient.cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        ingredient.quantity < ingredient.minQuantity
                          ? "destructive"
                          : ingredient.quantity < ingredient.minQuantity * 1.5
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {ingredient.quantity < ingredient.minQuantity
                        ? "Crítico"
                        : ingredient.quantity < ingredient.minQuantity * 1.5
                          ? "Baixo"
                          : "Normal"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenOutputModal(ingredient)}
                        title="Registrar saída"
                      >
                        <ArrowDownCircle className="h-4 w-4" />
                      </Button>
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
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteIngredient(ingredient.id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <IngredientOutputModal
        isOpen={isOutputModalOpen}
        onClose={() => setIsOutputModalOpen(false)}
        onOutput={handleOutputIngredient}
        ingredient={selectedIngredient}
      />
    </>
  )
}
