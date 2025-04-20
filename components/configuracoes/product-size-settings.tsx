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
import { sizeService } from "@/lib/services/size-service"
import { useBranch } from "@/lib/contexts/branch-context"
import type { Size } from "@/lib/services/size-service"

export function ProductSizeSettings() {
  const { toast } = useToast()
  const [isAddSizeOpen, setIsAddSizeOpen] = useState(false)
  const [isEditSizeOpen, setIsEditSizeOpen] = useState(false)
  const [sizes, setSizes] = useState<Size[]>([])
  const [loading, setLoading] = useState(true)
  const [newSizeName, setNewSizeName] = useState("")
  const [newReferenceValue, setNewReferenceValue] = useState<number | string>("")
  const [editSize, setEditSize] = useState<Size | null>(null)
  const { currentBranch } = useBranch()

  useEffect(() => {
    const fetchSizes = async () => {
      if (!currentBranch?.id) {
        console.log("Nenhuma filial selecionada, não é possível buscar tamanhos")
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        console.log(`Buscando tamanhos para a filial: ${currentBranch.id}`)
        const fetchedSizes = await sizeService.getAll(currentBranch.id)
        console.log(`Encontrados ${fetchedSizes.length} tamanhos`)
        setSizes(fetchedSizes)
      } catch (error) {
        console.error("Erro ao buscar tamanhos:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os tamanhos.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSizes()
  }, [currentBranch, toast])

  const handleAddSize = async () => {
    if (!newSizeName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do tamanho é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (newReferenceValue === "" || isNaN(Number(newReferenceValue))) {
      toast({
        title: "Valor de referência obrigatório",
        description: "O valor de referência deve ser um número válido.",
        variant: "destructive",
      })
      return
    }

    if (!currentBranch?.id) {
      toast({
        title: "Filial não selecionada",
        description: "Selecione uma filial para adicionar um tamanho.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Adicionando tamanho "${newSizeName}" para a filial: ${currentBranch.id}`)
      // Criar objeto de tamanho
      const newSize: Size = {
        name: newSizeName,
        referenceValue: Number(newReferenceValue),
      }

      const sizeId = await sizeService.add(newSize, currentBranch.id)
      console.log(`Tamanho adicionado com ID: ${sizeId}`)

      // Adicionar o novo tamanho à lista
      setSizes([
        ...sizes,
        {
          id: sizeId || "",
          name: newSizeName,
          referenceValue: Number(newReferenceValue),
        },
      ])

      // Limpar os campos e fechar o modal
      setNewSizeName("")
      setNewReferenceValue("")
      setIsAddSizeOpen(false)

      toast({
        title: "Tamanho adicionado",
        description: `O tamanho ${newSizeName} foi adicionado com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao adicionar tamanho:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o tamanho. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEditSize = async () => {
    if (!editSize) return

    if (!editSize.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do tamanho é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (editSize.referenceValue === undefined || isNaN(Number(editSize.referenceValue))) {
      toast({
        title: "Valor de referência obrigatório",
        description: "O valor de referência deve ser um número válido.",
        variant: "destructive",
      })
      return
    }

    if (!currentBranch?.id) {
      toast({
        title: "Filial não selecionada",
        description: "Selecione uma filial para editar um tamanho.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`Atualizando tamanho ${editSize.id} para a filial: ${currentBranch.id}`)
      await sizeService.update(
        editSize.id!,
        {
          name: editSize.name,
          referenceValue: Number(editSize.referenceValue),
        },
        currentBranch.id,
      )
      console.log(`Tamanho ${editSize.id} atualizado com sucesso`)

      // Atualizar o tamanho na lista
      setSizes(
        sizes.map((size) =>
          size.id === editSize.id
            ? {
                ...size,
                name: editSize.name,
                referenceValue: Number(editSize.referenceValue),
              }
            : size,
        ),
      )

      // Limpar o campo e fechar o modal
      setEditSize(null)
      setIsEditSizeOpen(false)

      toast({
        title: "Tamanho atualizado",
        description: `O tamanho foi atualizado com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao atualizar tamanho:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o tamanho. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSize = async (sizeId: string) => {
    if (!currentBranch?.id) {
      toast({
        title: "Filial não selecionada",
        description: "Selecione uma filial para excluir um tamanho.",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Tem certeza que deseja excluir este tamanho?")) {
      return
    }

    try {
      console.log(`Excluindo tamanho ${sizeId} para a filial: ${currentBranch.id}`)
      await sizeService.delete(sizeId, currentBranch.id)
      console.log(`Tamanho ${sizeId} excluído com sucesso`)

      // Remover o tamanho da lista
      setSizes(sizes.filter((size) => size.id !== sizeId))

      toast({
        title: "Tamanho excluído",
        description: "O tamanho foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao excluir tamanho:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o tamanho. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tamanhos de Produtos</h3>
        <Dialog open={isAddSizeOpen} onOpenChange={setIsAddSizeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tamanho
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Tamanho</DialogTitle>
              <DialogDescription>Preencha o nome e o valor de referência do novo tamanho.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Tamanho</Label>
                <Input
                  id="name"
                  value={newSizeName}
                  onChange={(e) => setNewSizeName(e.target.value)}
                  placeholder="Ex: Pequeno, Médio, Grande"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Valor de Referência (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newReferenceValue}
                  onChange={(e) => setNewReferenceValue(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ex: 10.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddSizeOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddSize}>Adicionar Tamanho</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Tamanho</TableHead>
              <TableHead>Valor de Referência (R$)</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Carregando tamanhos...
                </TableCell>
              </TableRow>
            ) : sizes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  Nenhum tamanho encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sizes.map((size) => (
                <TableRow key={size.id}>
                  <TableCell className="font-medium">{size.name}</TableCell>
                  <TableCell>
                    R$ {size.referenceValue !== undefined ? Number(size.referenceValue).toFixed(2) : "0.00"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditSize(size)
                          setIsEditSizeOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSize(size.id!)}>
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

      <Dialog open={isEditSizeOpen} onOpenChange={setIsEditSizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tamanho</DialogTitle>
            <DialogDescription>Altere o nome e o valor de referência do tamanho.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome do Tamanho</Label>
              <Input
                id="edit-name"
                value={editSize?.name || ""}
                onChange={(e) => setEditSize(editSize ? { ...editSize, name: e.target.value } : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-value">Valor de Referência (R$)</Label>
              <Input
                id="edit-value"
                type="number"
                step="0.01"
                min="0"
                value={editSize?.referenceValue || ""}
                onChange={(e) =>
                  setEditSize(
                    editSize
                      ? { ...editSize, referenceValue: e.target.value === "" ? 0 : Number(e.target.value) }
                      : null,
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSizeOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSize}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
