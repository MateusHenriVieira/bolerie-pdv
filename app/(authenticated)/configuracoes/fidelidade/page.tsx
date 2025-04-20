import { LoyaltyProgramSettings } from "@/components/configuracoes/loyalty-program-settings"

export default function FidelidadePage() {
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Programa de Fidelidade</h1>
      <LoyaltyProgramSettings />
    </div>
  )
}
