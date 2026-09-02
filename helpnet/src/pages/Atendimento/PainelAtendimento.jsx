import { CircleDashed, CheckCircle2, Headset, PauseCircle, UserPlus } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { SlaTag } from "../../components/ui/SlaTag";
import { NivelAtendente, StatusChamado, statusEncerrado } from "../../domain/enums";
import { formatarDuracao } from "../../domain/sla";

// Quem está com o chamado e em que pé ele está.
//
// É só leitura: as ações moram na barra de interações, para existir um único lugar de
// onde partem mudanças no chamado. A pergunta que este painel responde é "isto está
// andando?" — com a distinção que o status sozinho não dá: um chamado EM_ANDAMENTO
// sem responsável e um PAUSADO há três dias são situações diferentes.

const ESTADOS = {
  aguardando: {
    icone: CircleDashed,
    titulo: "Aguardando atendente",
    detalhe: "Ninguém assumiu este chamado ainda.",
    cor: "text-text-faint",
  },
  atendendo: { icone: Headset, titulo: "Em atendimento", cor: "text-info" },
  pausado: { icone: PauseCircle, titulo: "Atendimento pausado", cor: "text-warning" },
  encerrado: { icone: CheckCircle2, titulo: "Atendimento encerrado", cor: "text-success" },
};

function estadoDoChamado(chamado) {
  if (statusEncerrado(chamado.status)) return "encerrado";
  if (chamado.status === "PAUSADO") return "pausado";
  if (chamado.responsavelId) return "atendendo";
  return "aguardando";
}

function iniciaisDe(nome) {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

function desde(iso) {
  return formatarDuracao(Math.max(0, Date.now() - new Date(iso).getTime()));
}

// `responsavelNome` vem "Não atribuído" do backend quando não há responsável, então
// quem decide o que mostrar é o id.
function QuemAtende({ chamado, souEu }) {
  if (!chamado.responsavelId) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-surface-3 text-text-faint">
          <UserPlus size={16} />
        </span>
        <p className="text-sm text-text-muted">Sem responsável</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
        {iniciaisDe(chamado.responsavelNome)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text">
          {chamado.responsavelNome}
          {souEu && <span className="ml-1.5 text-xs font-normal text-text-faint">(você)</span>}
        </p>
        <p className="truncate text-xs text-text-faint">
          {NivelAtendente[chamado.responsavelNivel]?.label ?? "Sem nível"}
          {chamado.responsavelEmail && ` · ${chamado.responsavelEmail}`}
        </p>
      </div>
    </div>
  );
}

export function PainelAtendimento({ chamado, usuarioId }) {
  const estado = ESTADOS[estadoDoChamado(chamado)];
  const Icone = estado.icone;
  const souEu = chamado.responsavelId != null && chamado.responsavelId === usuarioId;
  const tempoPausado = chamado.tempoPausadoSegundos ?? 0;

  const detalhe =
    chamado.status === "PAUSADO" && chamado.pausadoEm
      ? `Parado há ${desde(chamado.pausadoEm)}.`
      : estado.detalhe;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <div className={`flex items-center gap-2 ${estado.cor}`}>
          <Icone size={18} />
          <h2 className="text-sm font-semibold">{estado.titulo}</h2>
        </div>
        {detalhe && <p className="mt-1 text-xs text-text-muted">{detalhe}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge color={StatusChamado[chamado.status]?.color}>
          {StatusChamado[chamado.status]?.label}
        </Badge>
        <SlaTag chamado={chamado} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium tracking-wider text-text-faint uppercase">
          Suporte responsável
        </p>
        <QuemAtende chamado={chamado} souEu={souEu} />
        {tempoPausado > 0 && (
          <p className="mt-1.5 text-xs text-text-faint">
            Tempo total pausado: {formatarDuracao(tempoPausado * 1000)} — já devolvido ao prazo de SLA.
          </p>
        )}
      </div>
    </Card>
  );
}
