import {
  ArrowRight,
  ArrowUpCircle,
  CheckCircle2,
  History,
  NotebookPen,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Star,
  Ticket,
  UserCheck,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge } from "../../components/ui/Badge";
import { ErrorBanner, Spinner } from "../../components/ui/Feedback";
import {
  NivelAtendente,
  Perfil,
  StatusChamado,
  TipoEventoChamado,
} from "../../domain/enums";
import { useHistoricoChamado } from "../../hooks/useHistoricoChamado";

// =============================================================================
// TRILHA DE HISTÓRICO DO ATENDIMENTO
//
// Contrato HTTP em src/api/historicoApi.js.
// =============================================================================
//
// Responde "o que já foi feito neste chamado, por quem e quando". Duas fontes
// alimentam a mesma linha do tempo:
//
//   1. o servidor, sozinho, a cada ação (abertura, atribuição, pausa, retomada,
//      escalonamento, resolução, reabertura, avaliação);
//   2. o atendente, pelo relato que escreve em cada interação.
//
// A escrita não mora aqui: toda entrada nasce de uma interação (AcoesChamado /
// NovaInteracaoModal), para não existirem dois caminhos de registro — um que muda o
// estado do chamado e outro que não. Esta tela é a leitura da trilha.
//
// É deliberadamente separada da conversa do chamado (ChamadoMensagens): lá o
// atendente fala COM o solicitante, aqui ele registra o atendimento. O solicitante
// enxerga a trilha, mas em modo leitura.

const ICONE_POR_TIPO = {
  ABERTURA: Ticket,
  ATRIBUICAO: UserCheck,
  STATUS: ArrowRight,
  PAUSA: PauseCircle,
  RETOMADA: PlayCircle,
  ESCALONAMENTO: ArrowUpCircle,
  RESOLUCAO: CheckCircle2,
  REABERTURA: RotateCcw,
  ANOTACAO: NotebookPen,
  AVALIACAO: Star,
};

// Classes literais: o Tailwind varre o código-fonte, então `bg-${cor}-soft` não geraria CSS.
const CORES_MARCADOR = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-3 text-text-muted",
};

function dataHoraDe(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rotuloStatus(status) {
  return StatusChamado[status]?.label ?? status;
}

/**
 * Carimba cada evento com o status vigente do chamado naquele ponto da linha do tempo.
 *
 * O backend só grava `statusNovo` quando houve transição — uma interação que não muda
 * o status vem com o campo nulo. Como a trilha chega em ordem cronológica, o status
 * vigente é simplesmente o último informado até ali, e assim toda linha exibe um
 * estado, sem o leitor ter que olhar para trás para descobrir em que pé o chamado
 * estava quando aquilo foi escrito.
 */
function comStatusVigente(eventos) {
  let vigente = null;
  return eventos.map((evento) => {
    vigente = evento.statusNovo ?? vigente;
    return { ...evento, statusVigente: vigente };
  });
}

// Mostra a transição como ela é — "Em Andamento → Pausado". Sem isso, ler a trilha
// exige adivinhar de onde o chamado veio a cada linha.
function Transicao({ de, para, rotulo }) {
  if (!para || de === para) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-faint">
      {de && (
        <>
          <span>{rotulo(de)}</span>
          <ArrowRight size={11} />
        </>
      )}
      <span className="font-medium text-text-muted">{rotulo(para)}</span>
    </span>
  );
}

function EventoDaTrilha({ evento, ultimo }) {
  const tipo = TipoEventoChamado[evento.tipo];
  const Icone = ICONE_POR_TIPO[evento.tipo] ?? History;
  const cor = CORES_MARCADOR[tipo?.color] ?? CORES_MARCADOR.neutral;

  return (
    <li className="relative flex gap-3">
      {/* Fio que costura os eventos. O último não puxa linha para baixo. */}
      {!ultimo && (
        <span aria-hidden="true" className="absolute top-8 bottom-0 left-[15px] w-px bg-border-soft" />
      )}

      <span className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${cor}`}>
        <Icone size={16} />
      </span>

      <div className={`min-w-0 flex-1 ${ultimo ? "" : "pb-5"}`}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-text">
            {evento.tipoDescricao || tipo?.label || evento.tipo}
          </span>
          <Transicao de={evento.statusAnterior} para={evento.statusNovo} rotulo={rotuloStatus} />
          <Transicao
            de={evento.nivelAnterior}
            para={evento.nivelNovo}
            rotulo={(n) => NivelAtendente[n]?.label ?? n}
          />

          {/* Em que estado o chamado ficou depois desta linha. */}
          {evento.statusVigente && (
            <Badge color={StatusChamado[evento.statusVigente]?.color} className="ml-auto">
              {rotuloStatus(evento.statusVigente)}
            </Badge>
          )}
        </div>

        <p className="mt-0.5 text-xs text-text-faint">
          <span className="text-text-muted">{evento.autorNome}</span>
          {evento.autorPerfil !== "USUARIO" && ` · ${Perfil[evento.autorPerfil]?.label ?? evento.autorPerfil}`}
          {evento.autorNivel && ` ${NivelAtendente[evento.autorNivel]?.label ?? evento.autorNivel}`}
          {` · ${dataHoraDe(evento.dataEvento)}`}
        </p>

        {evento.descricao && (
          <p className="mt-1.5 rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-sm whitespace-pre-line text-text">
            {evento.descricao}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * @param {object} props
 * @param {number} props.chamadoId
 * @param {string} [props.avisoLeitura]   nota exibida abaixo da trilha
 * @param {number} [props.recarregarEm]   muda de valor para forçar releitura da trilha
 */
export function HistoricoChamado({ chamadoId, avisoLeitura, recarregarEm }) {
  const { eventos, loading, error, recarregar } = useHistoricoChamado(chamadoId);

  // Cada interação registrada gera evento no servidor, então a
  // tela avisa por `recarregarEm` que a trilha ficou velha. O ref guarda o último valor
  // já sincronizado: sem ele, o efeito dispararia uma segunda busca logo na montagem,
  // por cima da que o próprio hook acabou de fazer.
  const ultimaSincronia = useRef(recarregarEm);
  useEffect(() => {
    if (ultimaSincronia.current === recarregarEm) return;
    ultimaSincronia.current = recarregarEm;
    recarregar();
  }, [recarregarEm, recarregar]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <History size={15} />
          Histórico do atendimento
        </h3>
        {eventos.length > 0 && (
          <Badge>{eventos.length} {eventos.length === 1 ? "registro" : "registros"}</Badge>
        )}
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Spinner size={16} />
      ) : eventos.length === 0 ? (
        <p className="text-xs text-text-faint">
          Nenhum registro ainda. Cada ação no chamado entra aqui automaticamente.
        </p>
      ) : (
        <ol className="flex max-h-[26rem] flex-col overflow-y-auto pr-1">
          {comStatusVigente(eventos).map((evento, i) => (
            <EventoDaTrilha key={evento.id} evento={evento} ultimo={i === eventos.length - 1} />
          ))}
        </ol>
      )}

      {avisoLeitura && (
        <p className="rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-xs text-text-faint">
          {avisoLeitura}
        </p>
      )}
    </div>
  );
}
