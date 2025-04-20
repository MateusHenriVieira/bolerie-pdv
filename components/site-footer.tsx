import Link from "next/link"
import { CakeIcon } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <div className="flex items-center gap-2">
          <CakeIcon className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Bolerie Luxe Sucré. Todos os direitos reservados.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/termos" className="hover:text-primary">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="hover:text-primary">
            Política de Privacidade
          </Link>
          <Link href="/suporte" className="hover:text-primary">
            Suporte
          </Link>
        </div>
      </div>
    </footer>
  )
}
