"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { InventoryTable } from "@/components/estoque/inventory-table"
import { IngredientTable } from "@/components/estoque/ingredient-table"
import { AddInventoryModal } from "@/components/estoque/add-inventory-modal"
import { AddIngredientModal } from "@/components/estoque/add-ingredient-modal"
import { InventoryReport } from "@/components/estoque/inventory-report"
import { Plus, Search } from "lucide-react"

export default function EstoquePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddInventoryModalOpen, setIsAddInventoryModalOpen] = useState(false)
  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("produtos")

  const handleAddInventory = (data: any) => {
    // Atualizar a lista de produtos (implementação futura)
  }

  const handleAddIngredient = (data: any) => {
    // Atualizar a lista de ingredientes (implementação futura)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Estoque</h1>

      <Tabs defaultValue="produtos" className="mb-8" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="ingredientes">Ingredientes</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          {activeTab !== "relatorios" && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={() =>
                  activeTab === "produtos" ? setIsAddInventoryModalOpen(true) : setIsAddIngredientModalOpen(true)
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {activeTab === "produtos" ? "Adicionar Produto" : "Adicionar Ingrediente"}
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="produtos" className="mt-0">
          <InventoryTable searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="ingredientes" className="mt-0">
          <IngredientTable searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="relatorios" className="mt-0">
          <InventoryReport />
        </TabsContent>
      </Tabs>

      <AddInventoryModal
        isOpen={isAddInventoryModalOpen}
        onClose={() => setIsAddInventoryModalOpen(false)}
        onAdd={handleAddInventory}
      />

      <AddIngredientModal
        isOpen={isAddIngredientModalOpen}
        onClose={() => setIsAddIngredientModalOpen(false)}
        onAdd={handleAddIngredient}
      />
    </div>
  )
}
