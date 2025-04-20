"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { printService } from "@/lib/services/print-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function PrinterSettings() {
  const { toast } = useToast()

  // Dados simulados
  const [printers, setPrinters] = useState([
    { name: "Impressora Principal", type: "Térmica", ip: "192.168.1.100", isDefault: true },
    { name: "Impressora Cozinha", type: "Térmica", ip: "192.168.1.101", isDefault: false },
  ])

  const [newPrinter, setNewPrinter] = useState({
    name: "",
    type: "Térmica",
    ip: "",
  })

  const [receiptTemplate, setReceiptTemplate] = useState(
    `DOCE SABOR CONFEITARIA
Rua das Flores, 123 - Centro
Tel: (11) 99999-9999

{data}
{hora}

CUPOM NÃO FISCAL

{itens}

Subtotal: {subtotal}
Desconto: {desconto}
TOTAL: {total}

Forma de pagamento: {pagamento}

Obrigado pela preferência!
Volte sempre!`,
  )

  const [printerConfig, setPrinterConfig] = useState({
    storeName: "DOCE SABOR CONFEITARIA",
    storeAddress: "Rua das Flores, 123 - Centro",
    storePhone: "(11) 99999-9999",
    printerType: "thermal", // thermal, pos, a4
    footer: "Obrigado pela preferência!\nVolte sempre!",
  })

  // Atualizar configuração do serviço de impressão quando as configurações mudarem
  useEffect(() => {
    printService.configure(printerConfig)
  }, [printerConfig])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewPrinter((prev) => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (value: string) => {
    setNewPrinter((prev) => ({ ...prev, type: value }))
  }

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPrinterConfig((prev) => ({ ...prev, [name]: value }))
  }

  const handlePrinterTypeChange = (value: string) => {
    setPrinterConfig((prev) => ({ ...prev, printerType: value }))
  }

  const handleAddPrinter = () => {
    if (!newPrinter.name || !newPrinter.ip) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setPrinters([
      ...printers,
      {
        ...newPrinter,
        isDefault: printers.length === 0,
      },
    ])

    setNewPrinter({
      name: "",
      type: "Térmica",
      ip: "",
    })

    toast({
      title: "Impressora adicionada",
      description: `A impressora ${newPrinter.name} foi adicionada com sucesso.`,
    })
  }

  const handleRemovePrinter = (index: number) => {
    const updatedPrinters = [...printers]
    const isRemovingDefault = updatedPrinters[index].isDefault

    updatedPrinters.splice(index, 1)

    // Se removeu a impressora padrão, define a primeira como padrão
    if (isRemovingDefault && updatedPrinters.length > 0) {
      updatedPrinters[0].isDefault = true
    }

    setPrinters(updatedPrinters)

    toast({
      title: "Impressora removida",
      description: "A impressora foi removida com sucesso.",
    })
  }

  const handleSetDefault = (index: number) => {
    const updatedPrinters = printers.map((printer, i) => ({
      ...printer,
      isDefault: i === index,
    }))

    setPrinters(updatedPrinters)

    toast({
      title: "Impressora padrão definida",
      description: `A impressora ${printers[index].name} foi definida como padrão.`,
    })
  }

  const handleSaveTemplate = () => {
    toast({
      title: "Modelo salvo",
      description: "O modelo de recibo foi salvo com sucesso.",
    })
  }

  const handleSaveConfig = () => {
    // Atualizar configuração do serviço de impressão
    printService.configure(printerConfig)

    toast({
      title: "Configurações salvas",
      description: "As configurações de impressão foram salvas com sucesso.",
    })
  }

  const handleTestPrint = (type?: string) => {
    // Testar impressão com o tipo especificado ou o tipo configurado
    printService.testPrint(type)

    toast({
      title: "Teste enviado",
      description: `Um recibo de teste foi gerado para impressora ${type || printerConfig.printerType}.`,
    })
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="printers">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="printers">Impressoras</TabsTrigger>
          <TabsTrigger value="receipt">Modelo de Recibo</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="printers" className="space-y-4 mt-4">
          <div className="flex items-end gap-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="printer-name">Nome da Impressora</Label>
              <Input
                id="printer-name"
                name="name"
                value={newPrinter.name}
                onChange={handleInputChange}
                placeholder="Ex: Impressora Caixa"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="printer-type">Tipo</Label>
              <Select value={newPrinter.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Térmica">Térmica</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                  <SelectItem value="Jato de Tinta">Jato de Tinta</SelectItem>
                  <SelectItem value="Laser">Laser</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="printer-ip">IP / Endereço</Label>
              <Input
                id="printer-ip"
                name="ip"
                value={newPrinter.ip}
                onChange={handleInputChange}
                placeholder="Ex: 192.168.1.100"
              />
            </div>
            <Button onClick={handleAddPrinter} className="self-end">
              Adicionar
            </Button>
          </div>

          {printers.length > 0 && (
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Tipo</th>
                    <th className="text-left p-2">IP / Endereço</th>
                    <th className="text-left p-2">Padrão</th>
                    <th className="text-right p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {printers.map((printer, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="p-2">{printer.name}</td>
                      <td className="p-2">{printer.type}</td>
                      <td className="p-2">{printer.ip}</td>
                      <td className="p-2">
                        {printer.isDefault ? (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Sim
                          </span>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => handleSetDefault(index)}>
                            Definir como padrão
                          </Button>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        <Button variant="destructive" size="sm" onClick={() => handleRemovePrinter(index)}>
                          Remover
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="receipt" className="space-y-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="receipt-template">Modelo</Label>
            <Textarea
              id="receipt-template"
              value={receiptTemplate}
              onChange={(e) => setReceiptTemplate(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              Use as variáveis {"{data}"}, {"{hora}"}, {"{itens}"}, {"{subtotal}"}, {"{desconto}"}, {"{total}"},{" "}
              {"{pagamento}"} para inserir os valores dinâmicos.
            </p>
          </div>
          <div className="flex justify-between">
            <Button onClick={handleSaveTemplate}>Salvar Modelo</Button>
            <Button variant="outline" onClick={() => handleTestPrint()}>
              Imprimir Teste
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="printerType">Tipo de Impressora</Label>
              <Select value={printerConfig.printerType} onValueChange={handlePrinterTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de impressora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">Impressora Térmica</SelectItem>
                  <SelectItem value="pos">POS Printer</SelectItem>
                  <SelectItem value="a4">Impressora A4</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Selecione o tipo de impressora para ajustar o formato do comprovante.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="storeName">Nome da Loja</Label>
              <Input id="storeName" name="storeName" value={printerConfig.storeName} onChange={handleConfigChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="storeAddress">Endereço</Label>
              <Input
                id="storeAddress"
                name="storeAddress"
                value={printerConfig.storeAddress}
                onChange={handleConfigChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="storePhone">Telefone</Label>
              <Input id="storePhone" name="storePhone" value={printerConfig.storePhone} onChange={handleConfigChange} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="footer">Rodapé</Label>
              <Textarea id="footer" name="footer" value={printerConfig.footer} onChange={handleConfigChange} rows={3} />
              <p className="text-sm text-muted-foreground">Use \n para quebras de linha.</p>
            </div>

            <div className="flex justify-between">
              <Button onClick={handleSaveConfig}>Salvar Configurações</Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => handleTestPrint("thermal")}>
                  Testar Térmica
                </Button>
                <Button variant="outline" onClick={() => handleTestPrint("pos")}>
                  Testar POS
                </Button>
                <Button variant="outline" onClick={() => handleTestPrint("a4")}>
                  Testar A4
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
