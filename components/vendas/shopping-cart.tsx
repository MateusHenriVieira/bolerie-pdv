"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, ShoppingCartIcon as CartIcon, Plus, Minus } from "lucide-react"
import type { Product } from "@/lib/services/product-service"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"

interface CartItem {
  product: Product & { selectedSize?: string }
  quantity: number
}

interface ShoppingCartProps {
  items: CartItem[]
  onRemove: (index: number) => void
  onUpdateQuantity: (index: number, quantity: number) => void
  onClear: () => void
}

export function ShoppingCart({ items, onRemove, onUpdateQuantity, onClear }: ShoppingCartProps) {
  const isEmpty = items.length === 0
  const totalItems = items.length
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <CartIcon className="mr-2 h-5 w-5" />
          <span className="font-medium">Carrinho</span>
          {totalItems > 0 && (
            <Badge variant="secondary" className="ml-2">
              {totalItems} {totalItems === 1 ? "item" : "itens"}
            </Badge>
          )}
        </div>
        {!isEmpty && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Limpar carrinho</span>
          </Button>
        )}
      </div>

      {/* Resumo do carrinho */}
      {!isEmpty && (
        <div className="p-3 bg-muted/30 border-b">
          <div className="flex justify-between text-sm">
            <span>Produtos:</span>
            <span>
              {totalItems} {totalItems === 1 ? "item" : "itens"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Unidades:</span>
            <span>
              {totalUnits} {totalUnits === 1 ? "unidade" : "unidades"}
            </span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>Valor total:</span>
            <span>R$ {totalValue.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex-grow overflow-auto p-4">
        {isEmpty ? (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <CartIcon className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Seu carrinho está vazio</p>
            <p className="text-xs text-muted-foreground">Adicione produtos do catálogo</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-26rem)] pr-4">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={`${item.product.id}-${item.product.selectedSize || "default"}-${index}`}
                  className="space-y-2"
                >
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium leading-none">{item.product.name}</h4>
                      {item.product.selectedSize && (
                        <p className="text-sm text-muted-foreground">Tamanho: {item.product.selectedSize}</p>
                      )}
                      <p className="text-sm font-medium">R$ {item.product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                          <span className="sr-only">Diminuir</span>
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = Number.parseInt(e.target.value)
                            if (!isNaN(value) && value > 0) {
                              onUpdateQuantity(index, value)
                            }
                          }}
                          className="h-8 w-14 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="sr-only">Aumentar</span>
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => onRemove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <Separator className="mt-2" />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {!isEmpty && (
        <div className="p-4 border-t">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Subtotal:</span>
                  <span>R$ {totalValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Itens:</span>
                  <span>
                    {totalItems} ({totalUnits} {totalUnits === 1 ? "unidade" : "unidades"})
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold">R$ {totalValue.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
