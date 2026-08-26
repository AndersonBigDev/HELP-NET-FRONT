import { ArrowLeft, ArrowUpCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataField } from "../../components/ui/DataField";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui/Feedback";
import { SlaTag } from "../../components/ui/SlaTag";
import { Categoria, NivelAtendente, Setor, StatusChamado, Urgencia } from "../../domain/enums";
import { useChamados } from "../../hooks/useChamados";
import { useUsuarios } from "../../hooks/useUsuarios";
import { ChamadoAnexos } from "../Chamados/ChamadoAnexos";
import { NovoChamadoModal } from "../Chamados/NovoChamadoModal";
import { EscalonarModal } from "./EscalonarModal";

// Tela de tratamento do chamado.
// Não existe `GET /chamados/{id}` no backend — lemos a lista (mesmo hook da fila) e
// localizamos o chamado pelo id da rota.
export function DetalheChamadoPage() {
  const { id } = useParams();
  const { chamados, loading, error, recarregar } = useChamados();
  const { porEmail } = useUsuarios();

  const [escalonarAberto, setEscalonarAberto] = useState(false);
  const [novoChamadoAberto, setNovoChamadoAberto] = useState(false);

  const chamado = chamados.find((c) => String(c.id) === String(id));
  const solicitante = chamado ? porEmail(chamado.emailSolicitante) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;

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

  return (
    <div className="mx-auto max-w-3xl">
      <VoltarParaFila />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-semibold text-text">{chamado.protocolo}</h1>
          <p className="text-sm text-text-muted">
            Aberto em {new Date(chamado.dataAbertura).toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* RF06: atendente abre chamado para si ou em nome de outro usuário. */}
          <Button variant="secondary" onClick={() => setNovoChamadoAberto(true)}>
            <UserPlus size={16} />
            Abrir chamado
          </Button>
          <Button onClick={() => setEscalonarAberto(true)}>
            <ArrowUpCircle size={16} />
            Escalonar
          </Button>
        </div>
      </div>

      {/* RF08 / RN05: card obrigatório com protocolo, dados do solicitante,
          responsável, tipo, prioridade, status e nível.
          Telefone não existe no model Usuario do backend — fica "—". */}
      <Card className="mb-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge color={StatusChamado[chamado.status]?.color}>{StatusChamado[chamado.status]?.label}</Badge>
          <Badge color={Urgencia[chamado.urgencia]?.color}>{Urgencia[chamado.urgencia]?.label}</Badge>
          <Badge color={NivelAtendente[chamado.nivelExigido]?.color}>
            {NivelAtendente[chamado.nivelExigido]?.label ?? "Sem nível"}
          </Badge>
          <SlaTag chamado={chamado} />
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <DataField label="Protocolo" value={chamado.protocolo} />
          <DataField label="Solicitante" value={solicitante?.nome} />
          <DataField label="Telefone" value={null} />
          <DataField label="E-mail" value={chamado.emailSolicitante} />
          <DataField label="Responsável" value={chamado.nomeResponsavel} />
          <DataField label="Tipo" value={Categoria[chamado.categoria]?.label ?? chamado.categoria} />
          <DataField label="Prioridade" value={Urgencia[chamado.urgencia]?.label} />
          <DataField label="Status" value={StatusChamado[chamado.status]?.label} />
          <DataField label="Nível exigido" value={NivelAtendente[chamado.nivelExigido]?.label} />
          <DataField label="Setor responsável" value={Setor[chamado.setor]?.label} />
          <DataField label="Equipamento" value={chamado.equipamento} />
          <DataField label="Cargo do solicitante" value={solicitante?.cargo} />
        </dl>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-text">Descrição</h2>
        <p className="text-sm whitespace-pre-line text-text-muted">{chamado.descricao}</p>
      </Card>

      <Card>
        <ChamadoAnexos chamadoId={chamado.id} />
      </Card>

      <EscalonarModal
        open={escalonarAberto}
        onClose={() => setEscalonarAberto(false)}
        chamado={chamado}
        onEscalonado={recarregar}
      />
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
