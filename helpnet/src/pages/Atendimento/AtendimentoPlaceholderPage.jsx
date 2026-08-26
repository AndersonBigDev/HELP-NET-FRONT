import { LayoutGrid } from "lucide-react";
import { EmptyState } from "../../components/ui/Feedback";

// Placeholder — Módulo 2 substitui esta rota pela Fila de Atendimento
// (RF10/RF11), Detalhe do Chamado/Escalonamento (RF12/RF13) e Dashboard
// (RF14), reaproveitando o AppLayout e os tokens de cor já definidos.
export function AtendimentoPlaceholderPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <EmptyState
        icon={LayoutGrid}
        title="Área de atendimento em construção"
        description="Filas, escalonamento e dashboard entram aqui (Módulo 2)."
      />
    </div>
  );
}
