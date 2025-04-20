"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductCategorySettings } from "@/components/configuracoes/product-category-settings"
import { ProductSizeSettings } from "@/components/configuracoes/product-size-settings"
import { useBranch } from "@/lib/contexts/branch-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function ProdutosPage() {
  const { currentBranch, loading } = useBranch()

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!currentBranch) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Nenhuma filial selecionada. Por favor, selecione uma filial para gerenciar produtos.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações de Produtos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie categorias e tamanhos de produtos para a filial: {currentBranch.name}
        </p>
      </div>

      <Tabs defaultValue="categorias" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="tamanhos">Tamanhos</TabsTrigger>
        </TabsList>
        <TabsContent value="categorias">
          <Card>
            <CardHeader>
              <CardTitle>Categorias de Produtos</CardTitle>
              <CardDescription>
                Gerencie as categorias de produtos disponíveis na filial {currentBranch.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductCategorySettings />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tamanhos">
          <Card>
            <CardHeader>
              <CardTitle>Tamanhos de Produtos</CardTitle>
              <CardDescription>
                Gerencie os tamanhos de produtos e seus valores de referência para a filial {currentBranch.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductSizeSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
