import { ChevronRight, Headset } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { SlaTag } from "../../components/ui/SlaTag";
import { Categoria, NivelAtendente, Setor, StatusChamado, Urgencia } from "../../domain/enums";
import { calcularSla } from "../../domain/sla";

export function ChamadoFilaItem({ chamado }) {
  // RNF03: atrasado ganha borda vermelha, não só o badge.
  const atrasado = calcularSla(chamado).atrasado;

  return (
    <Link
      to={`/atendimento/chamados/${chamado.id}`}
      className={`flex items-center justify-between gap-4 rounded-xl border bg-surface px-5 py-4 transition-colors hover:bg-surface-2 ${
        atrasado ? "border-danger/40" : "border-border"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-text-muted">{chamado.protocolo}</span>
          <Badge color={StatusChamado[chamado.status]?.color}>{StatusChamado[chamado.status]?.label}</Badge>
          <Badge color={Urgencia[chamado.urgencia]?.color}>{Urgencia[chamado.urgencia]?.label}</Badge>
          <Badge color={NivelAtendente[chamado.nivelExigido]?.color}>
            {NivelAtendente[chamado.nivelExigido]?.label ?? "Sem nível"}
          </Badge>
          <SlaTag chamado={chamado} />
        </div>

        <p className="mt-1.5 truncate text-sm font-medium text-text">
          {Categoria[chamado.categoria]?.label ?? chamado.categoria}
        </p>
        <p className="mt-0.5 truncate text-xs text-text-muted">
          {chamado.solicitanteNome}
          {chamado.setor && ` · ${Setor[chamado.setor]?.label ?? chamado.setor}`}
          {` · ${new Date(chamado.dataAbertura).toLocaleString("pt-BR")}`}
        </p>

        {/* Quem está com o chamado é a primeira coisa que a fila precisa dizer: sem
            isso, dois atendentes pegam o mesmo item. `responsavelNome` vem
            "Não atribuído" do backend quando não há ninguém, então quem decide é o id. */}
        <p className="mt-1 flex items-center gap-1.5 text-xs">
          {chamado.responsavelId ? (
            <>
              <Headset size={12} className="shrink-0 text-text-faint" />
              <span className="truncate text-text-muted">
                {chamado.status === "PAUSADO" ? "Pausado por" : "Em atendimento com"}{" "}
                <span className="text-text">{chamado.responsavelNome}</span>
              </span>
            </>
          ) : (
            <span className="text-text-faint">Sem responsável — disponível para assumir</span>
          )}
        </p>
      </div>

      <ChevronRight size={18} className="shrink-0 text-text-faint" />
    </Link>
  );
}
