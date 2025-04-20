import { productService } from "./product-service"
import { categoryService } from "./category-service"
import { reservationService } from "./reservation-service"
import { saleService } from "./sale-service"
import { toast } from "sonner"

class MigrationService {
  async migrateAllDataToBranchSubcollections(): Promise<void> {
    try {
      toast.info("Iniciando migração de dados para subcoleções das filiais...")

      // Migrar produtos
      await productService.migrateProductsToBranchSubcollections()
      toast.success("Produtos migrados com sucesso")

      // Migrar categorias
      await categoryService.migrateCategoriesToBranchSubcollections()
      toast.success("Categorias migradas com sucesso")

      // Migrar reservas
      await reservationService.migrateReservationsToBranchSubcollections()
      toast.success("Reservas migradas com sucesso")

      // Migrar vendas
      await saleService.migrateSalesToBranchSubcollections()
      toast.success("Vendas migradas com sucesso")

      toast.success("Migração de dados concluída com sucesso!")
    } catch (error) {
      console.error("Erro durante a migração de dados:", error)
      toast.error("Erro durante a migração de dados. Verifique o console para mais detalhes.")
      throw error
    }
  }
}

export const migrationService = new MigrationService()
