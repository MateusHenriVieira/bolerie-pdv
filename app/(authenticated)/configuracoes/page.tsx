"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building, UserCog, Package, Printer, Users, Award } from "lucide-react"
import { useBranch } from "@/lib/contexts/branch-context"

export default function ConfiguracoesPage() {
  const { currentBranch } = useBranch()

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as configurações do sistema
          {currentBranch && ` para a filial: ${currentBranch.name}`}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/configuracoes/filiais">
          <Card className="h-full cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Filiais</CardTitle>
              <Building className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerencie as filiais da sua empresa, adicione novas ou edite as existentes.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/configuracoes/funcionarios">
          <Card className="h-full cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Funcionários</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerencie os funcionários, defina permissões e associe-os às filiais.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/configuracoes/produtos">
          <Card className="h-full cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Produtos</CardTitle>
              <Package className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure categorias e tamanhos de produtos disponíveis na filial.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/configuracoes/impressora">
          <Card className="h-full cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Impressora</CardTitle>
              <Printer className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure as opções de impressão de comprovantes e relatórios.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/configuracoes/fidelidade">
          <Card className="h-full cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Programa de Fidelidade</CardTitle>
              <Award className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configure o programa de fidelidade para seus clientes.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/configuracoes/usuarios">
          <Card className="h-full cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Usuários</CardTitle>
              <UserCog className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Gerencie os usuários do sistema e suas permissões.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
