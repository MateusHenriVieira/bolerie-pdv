"use client"

import { useState } from "react"
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
import { customerService } from "@/lib/services/customer-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { useToast } from "@/hooks/use-toast"
import type { Customer } from "@/lib/types"

interface DeleteCustomerDialogProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer
  onDelete: () => void
}

export function DeleteCustomerDialog({ isOpen, onClose, customer, onDelete }: DeleteCustomerDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { effectiveBranchId } = useBranch()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!effectiveBranchId) {
      toast({
        title: "Erro",
        description: "Nenhuma filial selecionada. Não é possível excluir o cliente.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      await customerService.delete(customer.id, effectiveBranchId)

      toast({
        title: "Cliente excluído",
        description: `${customer.name} foi excluído com sucesso.`,
      })

      onDelete()
      onClose()
    } catch (error) {
      console.error("Erro ao excluir cliente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o cliente <strong>{customer.name}</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
            {isDeleting ? "Excluindo..." : "Excluir Cliente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
