import { ArrowLeft, CalendarClock, HardDrive, RefreshCw, TriangleAlert, User, UserPlus } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataField } from "../../components/ui/DataField";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui/Feedback";
import { SlaTag } from "../../components/ui/SlaTag";
import { Categoria, NivelAtendente, Setor, StatusChamado, Urgencia } from "../../domain/enums";
import { calcularSla } from "../../domain/sla";
import { useChamado } from "../../hooks/useChamado";
import { useUsuarios } from "../../hooks/useUsuarios";
import { ChamadoAnexos } from "../Chamados/ChamadoAnexos";
import { ChamadoMensagens } from "../Chamados/ChamadoMensagens";
import { HistoricoChamado } from "../Chamados/HistoricoChamado";
import { NovoChamadoModal } from "../Chamados/NovoChamadoModal";
import { AcoesChamado } from "./AcoesChamado";
import { PainelAtendimento } from "./PainelAtendimento";

// Tela de tratamento do chamado.
//
// A ordem responde às perguntas do atendente na ordem em que ele as faz: o que dá
// para fazer agora (barra de interações), com quem está e como está (painel), o
// cadastro do chamado (cards), o que já foi feito (trilha) e o que o solicitante
// disse (conversa).

function CardResumo({ titulo, icone: Icone, cor, children }) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-4 border-l-4 ${cor}`}>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wider text-text-faint uppercase">
        <Icone size={13} />
        {titulo}
      </p>
      <dl className="flex flex-col gap-1.5 text-sm">{children}</dl>
    </div>
  );
}

export function DetalheChamadoPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { chamado, loading, error, recarregar, aplicar } = useChamado(id);
  const { porId } = useUsuarios();

  const [novoChamadoAberto, setNovoChamadoAberto] = useState(false);

  // A interação devolve o chamado já atualizado quando mexeu nele; a trilha, que vive
  // no servidor, é sempre relida — uma interação pode ter gerado mais de um evento.
  const [versaoTrilha, setVersaoTrilha] = useState(0);

  const aoInteragir = useCallback(
    (atualizado) => {
      if (atualizado) aplicar(atualizado);
      setVersaoTrilha((v) => v + 1);
    },
    [aplicar],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (error && !chamado) {
    return (
      <div className="mx-auto max-w-3xl">
        <VoltarParaFila />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!chamado) {
    return (
      <div className="mx-auto max-w-3xl">
        <VoltarParaFila />
        <EmptyState
          title="Chamado não encontrado"
          description="Ele pode ter sido removido ou o link está incorreto."
        />
      </div>
    );
  }

  const solicitante = porId(chamado.solicitanteId);
  const fechado = chamado.status === "FECHADO";
  const sla = calcularSla(chamado);

  return (
    <div className="mx-auto max-w-6xl">
      <VoltarParaFila />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold text-text">{chamado.protocolo}</h1>
          <Badge color={StatusChamado[chamado.status]?.color}>
            {StatusChamado[chamado.status]?.label}
          </Badge>
          <Badge color={Urgencia[chamado.urgencia]?.color}>{Urgencia[chamado.urgencia]?.label}</Badge>
          <Badge color={NivelAtendente[chamado.nivelExigido]?.color}>
            {NivelAtendente[chamado.nivelExigido]?.label ?? "Sem nível"}
          </Badge>
          <SlaTag chamado={chamado} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={recarregar}>
            <RefreshCw size={16} />
            Atualizar
          </Button>
          {/* RF06: atendente abre chamado para si ou em nome de outro usuário. */}
          <Button variant="secondary" onClick={() => setNovoChamadoAberto(true)}>
            <UserPlus size={16} />
            Abrir chamado
          </Button>
        </div>
      </div>

      {/* Tudo o que muda o chamado sai daqui — e vira registro no histórico. */}
      <AcoesChamado chamado={chamado} usuarioId={user?.id} onInteracao={aoInteragir} />

      <ErrorBanner message={error} />

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* RN05: solicitante, tipo, prioridade, nível e equipamento à vista, sem
              abrir nada. Telefone não existe no model Usuario do backend — fica "—". */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <CardResumo titulo="Solicitante" icone={User} cor="border-l-info">
              <DataField label="Nome" value={chamado.solicitanteNome} />
              <DataField label="E-mail" value={chamado.solicitanteEmail} />
              <DataField label="Telefone" value={null} />
              <DataField label="Cargo" value={solicitante?.cargo} />
            </CardResumo>

            <CardResumo titulo="Equipamento & SLA" icone={HardDrive} cor="border-l-warning">
              <DataField label="Equipamento" value={chamado.equipamentoNome} />
              <DataField
                label="Tipo"
                value={Categoria[chamado.categoria]?.label ?? chamado.categoria}
              />
              <DataField label="Prioridade acordada" value={Urgencia[chamado.urgencia]?.label} />
              <DataField label="Setor responsável" value={Setor[chamado.setor]?.label} />
            </CardResumo>

            <CardResumo titulo="Datas chave" icone={CalendarClock} cor="border-l-success">
              <DataField
                label="Abertura"
                value={new Date(chamado.dataAbertura).toLocaleString("pt-BR")}
              />
              <DataField label="Prazo do SLA" value={sla.prazo.toLocaleString("pt-BR")} />
              <DataField
                label="Encerramento"
                value={
                  chamado.dataFechamento
                    ? new Date(chamado.dataFechamento).toLocaleString("pt-BR")
                    : null
                }
              />
              <DataField label="Nível exigido" value={NivelAtendente[chamado.nivelExigido]?.label} />
            </CardResumo>
          </div>

          <Card>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text">
              <TriangleAlert size={15} className="text-danger" />
              Descrição do problema
            </h2>
            <p className="text-sm whitespace-pre-line text-text-muted">{chamado.descricao}</p>

            {chamado.descricaoResolucao && (
              <div className="mt-4 border-t border-border-soft pt-3">
                <h2 className="mb-1 text-sm font-semibold text-text">Resolução aplicada</h2>
                <p className="text-sm whitespace-pre-line text-text-muted">
                  {chamado.descricaoResolucao}
                </p>
              </div>
            )}

            {chamado.justificativaReabertura && (
              <div className="mt-4 border-t border-border-soft pt-3">
                <h2 className="mb-1 text-sm font-semibold text-text">Última reabertura</h2>
                <p className="text-sm whitespace-pre-line text-text-muted">
                  {chamado.justificativaReabertura}
                </p>
              </div>
            )}
          </Card>

          <Card>
            <HistoricoChamado
              chamadoId={chamado.id}
              recarregarEm={versaoTrilha}
              avisoLeitura={
                fechado
                  ? "Chamado fechado — o histórico está encerrado e não recebe novos registros."
                  : "Novos registros entram por “Nova Interação”, no topo da tela."
              }
            />
          </Card>

          {/* RF08: conversa com o solicitante. Chamado fechado vira somente leitura. */}
          <Card>
            <ChamadoMensagens chamadoId={chamado.id} somenteLeitura={fechado} />
          </Card>

          <Card>
            <ChamadoAnexos chamadoId={chamado.id} />
          </Card>
        </div>

        <div className="lg:sticky lg:top-8">
          <PainelAtendimento chamado={chamado} usuarioId={user?.id} />
        </div>
      </div>

      <NovoChamadoModal
        open={novoChamadoAberto}
        onClose={() => setNovoChamadoAberto(false)}
        onCreated={recarregar}
      />
    </div>
  );
}

function VoltarParaFila() {
  return (
    <Link
      to="/atendimento"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
    >
      <ArrowLeft size={16} />
      Voltar para a fila
    </Link>
  );
}
