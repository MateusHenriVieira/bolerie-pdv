"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Plus, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { categoryService } from "@/lib/services/category-service"
import { useBranch } from "@/lib/contexts/branch-context"

export function ProductCategorySettings() {
  const { toast } = useToast()
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editCategory, setEditCategory] = useState<any>(null)
  const { currentBranch } = useBranch()

  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentBranch?.id) {
        console.log("Nenhuma filial selecionada, não é possível buscar categorias")
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        console.log(`Buscando categorias para a filial: ${currentBranch.id}`)
        const fetchedCategories = await categoryService.getAll(currentBranch.id)
        console.log(`Encontradas ${fetchedCategories.length} categorias`)
        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Erro ao buscar categorias:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as categorias.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [currentBranch, toast])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (!currentBranch?.id) {
      toast({
        title: "Filial não selecionada",
        description: "Selecione uma filial para adicionar uma categoria.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Adicionando categoria "${newCategoryName}" para a filial: ${currentBranch.id}`)
      // Criar objeto de categoria
      const newCategory = {
        name: newCategoryName,
      }

      const categoryId = await categoryService.add(newCategory, currentBranch.id)
      console.log(`Categoria adicionada com ID: ${categoryId}`)

      // Adicionar a nova categoria à lista
      setCategories([
        ...categories,
        {
          id: categoryId,
          name: newCategoryName,
        },
      ])

      // Limpar o campo e fechar o modal
      setNewCategoryName("")
      setIsAddCategoryOpen(false)

      toast({
        title: "Categoria adicionada",
        description: `A categoria ${newCategoryName} foi adicionada com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a categoria. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = async () => {
    if (!editCategory?.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (!currentBranch?.id) {
      toast({
        title: "Filial não selecionada",
        description: "Selecione uma filial para editar uma categoria.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Atualizando categoria ${editCategory.id} para a filial: ${currentBranch.id}`)
      await categoryService.update(editCategory.id, { name: editCategory.name }, currentBranch.id)
      console.log(`Categoria ${editCategory.id} atualizada com sucesso`)

      // Atualizar a categoria na lista
      setCategories(categories.map((cat) => (cat.id === editCategory.id ? { ...cat, name: editCategory.name } : cat)))

      // Limpar o campo e fechar o modal
      setEditCategory(null)
      setIsEditCategoryOpen(false)

      toast({
        title: "Categoria atualizada",
        description: `A categoria foi atualizada com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!currentBranch?.id) {
      toast({
        title: "Filial não selecionada",
        description: "Selecione uma filial para excluir uma categoria.",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Tem certeza que deseja excluir esta categoria?")) {
      return
    }

    try {
      console.log(`Excluindo categoria ${categoryId} para a filial: ${currentBranch.id}`)
      await categoryService.delete(categoryId, currentBranch.id)
      console.log(`Categoria ${categoryId} excluída com sucesso`)

      // Remover a categoria da lista
      setCategories(categories.filter((cat) => cat.id !== categoryId))

      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir categoria:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a categoria. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Categorias de Produtos</h3>
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Categoria</DialogTitle>
              <DialogDescription>Preencha o nome da nova categoria de produtos.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Categoria</Label>
                <Input
                  id="name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Bolos, Tortas, Doces"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCategory}>Adicionar Categoria</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Categoria</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4">
                  Carregando categorias...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4">
                  Nenhuma categoria encontrada.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditCategory(category)
                          setIsEditCategoryOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>Altere o nome da categoria de produtos.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome da Categoria</Label>
              <Input
                id="edit-name"
                value={editCategory?.name || ""}
                onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCategory}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
