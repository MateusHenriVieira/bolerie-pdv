"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart } from "@/components/vendas/shopping-cart"
import { CustomerSearch } from "@/components/vendas/customer-search"
import { PaymentModal } from "@/components/vendas/payment-modal"
import { productService, type Product } from "@/lib/services/product-service"
import { categoryService } from "@/lib/services/category-service"
import { useBranch } from "@/lib/contexts/branch-context"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, ShoppingCartIcon as CartIcon } from "lucide-react"
import { AddReservationModal } from "@/components/reservas/add-reservation-modal"
import { reservationService } from "@/lib/services/reservation-service"
import type { Reservation } from "@/lib/services/reservation-service"

interface CartItem {
  product: Product & { selectedSize?: string }
  quantity: number
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
}

export default function VendasPage() {
  const [activeTab, setActiveTab] = useState("todos")
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([
    { id: "todos", name: "Todos" },
    { id: "bolo-com-cobertura", name: "Bolo com cobertura" },
    { id: "bolo-sem-cobertura", name: "Bolo sem cobertura" },
    { id: "cestas", name: "Cestas" },
  ])
  const { currentBranch, effectiveBranchId } = useBranch()
  const { toast } = useToast()
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      if (!effectiveBranchId) return

      try {
        console.log("Buscando categorias para a filial:", effectiveBranchId)
        // Buscar categorias do banco de dados
        const dbCategories = await categoryService.getAll(effectiveBranchId)
        console.log("Categorias encontradas:", dbCategories)

        // Se houver categorias no banco, usar elas
        if (dbCategories.length > 0) {
          const formattedCategories = dbCategories.map((cat) => {
            // Verificar se cat é um objeto ou uma string
            const categoryId =
              typeof cat === "object" && cat !== null
                ? cat.id || cat.name?.toLowerCase().replace(/\s+/g, "-")
                : String(cat).toLowerCase().replace(/\s+/g, "-")

            const categoryName = typeof cat === "object" && cat !== null ? cat.name : String(cat)

            return {
              id: categoryId,
              name: categoryName,
            }
          })

          // Adicionar a categoria "Todos" no início
          const allCategories = [{ id: "todos", name: "Todos" }, ...formattedCategories]

          console.log("Categorias formatadas:", allCategories)
          setCategories(allCategories)
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error)
      }
    }

    fetchCategories()
  }, [effectiveBranchId])

  // Carregar produtos
  useEffect(() => {
    const fetchProducts = async () => {
      if (!effectiveBranchId) return

      setIsLoading(true)
      try {
        console.log("Buscando produtos para a filial:", effectiveBranchId)
        // Buscar todos os produtos da filial
        const allProducts = await productService.getAllProductsForBranch(effectiveBranchId)
        console.log("Produtos encontrados:", allProducts.length)

        // Log de cada produto para debug
        allProducts.forEach((product) => {
          console.log(`Produto: ${product.name}, Categoria: ${product.category}`)
        })

        setProducts(allProducts)

        // Filtrar produtos pela categoria ativa
        filterProductsByCategory(allProducts, activeTab)
      } catch (error) {
        console.error("Erro ao carregar produtos:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os produtos. Tente novamente.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [effectiveBranchId, toast])

  // Filtrar produtos por categoria
  const filterProductsByCategory = (productList: Product[], category: string) => {
    console.log("Filtrando produtos por categoria:", category)
    console.log("Total de produtos para filtrar:", productList.length)

    // Se a categoria for "todos", mostrar todos os produtos
    if (category === "todos") {
      console.log("Categoria 'todos' selecionada, mostrando todos os produtos")
      setFilteredProducts(productList)
      return
    }

    // Verificar se a categoria está vazia
    if (!category) {
      console.log("Categoria vazia, mostrando todos os produtos")
      setFilteredProducts(productList)
      return
    }

    // Normalizar a categoria para comparação
    const normalizedCategory = category.toLowerCase().trim()

    const filtered = productList.filter((product) => {
      // Se o produto não tem categoria, ignorar
      if (!product.category) {
        console.log(`Produto ${product.name} não tem categoria`)
        return false
      }

      // Verificar se a categoria do produto é um objeto ou uma string
      let productCategory: string
      if (typeof product.category === "object" && product.category !== null) {
        productCategory = product.category.name || ""
      } else {
        productCategory = String(product.category)
      }

      // Normalizar a categoria do produto
      productCategory = productCategory.toLowerCase().trim()
      const productCategoryDashed = productCategory.replace(/\s+/g, "-")

      // Verificar se a categoria corresponde
      const matches =
        productCategory === normalizedCategory ||
        productCategoryDashed === normalizedCategory ||
        (typeof product.category === "object" && product.category !== null && product.category.id === category)

      if (matches) {
        console.log(`Produto ${product.name} corresponde à categoria ${normalizedCategory}`)
      }

      return matches
    })

    console.log(`Encontrados ${filtered.length} produtos na categoria ${category}`)
    setFilteredProducts(filtered)
  }

  // Atualizar produtos filtrados quando a aba ativa mudar
  useEffect(() => {
    if (products.length > 0) {
      filterProductsByCategory(products, activeTab)
    }
  }, [activeTab, products])

  // Filtrar produtos por termo de busca
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      filterProductsByCategory(products, activeTab)
      return
    }

    const searchTermLower = searchTerm.toLowerCase().trim()
    console.log("Buscando produtos com termo:", searchTermLower)

    const filtered = products.filter(
      (product) =>
        (product.name?.toLowerCase() || "").includes(searchTermLower) ||
        (product.description?.toLowerCase() || "").includes(searchTermLower),
    )

    console.log(`Encontrados ${filtered.length} produtos com o termo "${searchTermLower}"`)
    setFilteredProducts(filtered)
  }

  // Adicionar produto ao carrinho
  const addToCart = (product: Product) => {
    // Se o produto tem tamanhos, adicionar com o primeiro tamanho
    if (product.sizes && product.sizes.length > 0) {
      const productWithSize = {
        ...product,
        selectedSize: product.sizes[0].name,
        price: product.sizes[0].price,
      }

      setCartItems([...cartItems, { product: productWithSize, quantity: 1 }])
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }])
    }

    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho.`,
    })
  }

  // Remover item do carrinho
  const removeFromCart = (index: number) => {
    const newCartItems = [...cartItems]
    newCartItems.splice(index, 1)
    setCartItems(newCartItems)
  }

  // Atualizar quantidade de um item no carrinho
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return

    const newCartItems = [...cartItems]
    newCartItems[index].quantity = quantity
    setCartItems(newCartItems)
  }

  // Limpar carrinho
  const clearCart = () => {
    setCartItems([])
  }

  // Calcular total do carrinho
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price || 0) * item.quantity, 0)
  }

  // Finalizar venda
  const handleFinalizeSale = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar a venda.",
        variant: "destructive",
      })
      return
    }

    setIsPaymentModalOpen(true)
  }

  const handleOpenReservationModal = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de fazer uma reserva.",
        variant: "destructive",
      })
      return
    }

    if (!selectedCustomer) {
      toast({
        title: "Cliente não selecionado",
        description: "Selecione um cliente antes de fazer uma reserva.",
        variant: "destructive",
      })
      return
    }

    setIsReservationModalOpen(true)
  }

  const handleCreateReservation = async (reservation: Reservation) => {
    if (!effectiveBranchId) {
      toast({
        title: "Erro",
        description: "Filial não selecionada. Selecione uma filial antes de criar a reserva.",
        variant: "destructive",
      })
      return
    }

    try {
      // Garantir que todos os campos obrigatórios estejam presentes
      const completeReservation: Reservation = {
        ...reservation,
        branchId: effectiveBranchId,
        // Garantir que o status seja "pending" para aparecer na lista de pendentes
        status: "pending",
      }

      // Criar a reserva
      await reservationService.create(completeReservation)

      // Limpar o carrinho e o cliente selecionado após criar a reserva
      setCartItems([])
      setSelectedCustomer(null)

      toast({
        title: "Reserva criada",
        description: "A reserva foi criada com sucesso e já está disponível na tela de reservas.",
      })
    } catch (error) {
      console.error("Erro ao criar reserva:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a reserva. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
        <p className="text-muted-foreground">Registre vendas para a filial {currentBranch?.name || "selecionada"}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna da esquerda - Cliente e Catálogo */}
        <div className="md:col-span-2 space-y-6">
          {/* Seção de Cliente */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerSearch onSelectCustomer={setSelectedCustomer} selectedCustomer={selectedCustomer} />
            </CardContent>
          </Card>

          {/* Catálogo de Produtos */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Catálogo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b px-4 overflow-x-auto">
                  <TabsList className="h-12">
                    {categories.map((category) => (
                      <TabsTrigger key={category.id} value={category.id} className="data-[state=active]:bg-primary/10">
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Barra de busca */}
                <div className="p-4 border-b">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" onClick={handleSearch}>
                      Buscar
                    </Button>
                  </div>
                </div>

                {/* Conteúdo das abas */}
                <TabsContent value="todos" className="p-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <p>Carregando produtos...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Nenhum produto encontrado.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((product) => (
                        <Card key={product.id} className="overflow-hidden shadow-sm">
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">{product.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {product.description || "Sem descrição"}
                            </p>
                            {product.sizes && product.sizes.length > 0 ? (
                              <div className="space-y-1">
                                {product.sizes.map((size, index) => (
                                  <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm">{size.name}</span>
                                    <span className="font-medium">R$ {size.price.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="font-medium">R$ {(product.price || 0).toFixed(2)}</div>
                            )}
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Button
                              className="w-full"
                              onClick={() => addToCart(product)}
                              disabled={!product.price && (!product.sizes || product.sizes.length === 0)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {categories
                  .filter((cat) => cat.id !== "todos")
                  .map((category) => (
                    <TabsContent key={category.id} value={category.id} className="p-4">
                      {isLoading ? (
                        <div className="text-center py-8">
                          <p>Carregando produtos...</p>
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhum produto encontrado nesta categoria.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredProducts.map((product) => (
                            <Card key={product.id} className="overflow-hidden shadow-sm">
                              <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base">{product.name}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {product.description || "Sem descrição"}
                                </p>
                                {product.sizes && product.sizes.length > 0 ? (
                                  <div className="space-y-1">
                                    {product.sizes.map((size, index) => (
                                      <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm">{size.name}</span>
                                        <span className="font-medium">R$ {size.price.toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="font-medium">R$ {(product.price || 0).toFixed(2)}</div>
                                )}
                              </CardContent>
                              <CardFooter className="p-4 pt-0">
                                <Button
                                  className="w-full"
                                  onClick={() => addToCart(product)}
                                  disabled={!product.price && (!product.sizes || product.sizes.length === 0)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar
                                </Button>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Coluna da direita - Carrinho */}
        <div>
          <Card className="h-full flex flex-col shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <CartIcon className="h-5 w-5 mr-2" />
                Carrinho
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0">
              <ShoppingCart
                items={cartItems}
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
                onClear={clearCart}
              />
            </CardContent>
            <CardFooter className="border-t p-4">
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold">R$ {calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleOpenReservationModal}>
                    Reservar
                  </Button>
                  <Button className="flex-1" onClick={handleFinalizeSale} disabled={cartItems.length === 0}>
                    Finalizar Venda ({cartItems.length} {cartItems.length === 1 ? "item" : "itens"} - R${" "}
                    {calculateTotal().toFixed(2)})
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Modal de Reserva */}
      <AddReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        onAdd={handleCreateReservation}
        initialCustomer={selectedCustomer}
        initialItems={cartItems.map((item) => ({
          productId: item.product.id || "",
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price || 0,
        }))}
      />

      {/* Modal de Pagamento */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        items={cartItems.map((item) => ({
          id: item.product.id || "",
          name: item.product.name,
          price: item.product.price || 0,
          quantity: item.quantity,
          size: item.product.selectedSize,
        }))}
        customer={selectedCustomer}
        total={calculateTotal()}
        onComplete={() => {
          setCartItems([])
          setSelectedCustomer(null)
          setIsPaymentModalOpen(false)
        }}
      />
    </div>
  )
}
