import { ArrowLeft, Download, Inbox, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui/Feedback";
import { Categoria, NivelAtendente, Setor, StatusChamado, Urgencia } from "../../domain/enums";
import { calcularSla } from "../../domain/sla";
import { useChamados } from "../../hooks/useChamados";
import { useUsuarios } from "../../hooks/useUsuarios";
import { baixarCsv, carimboDeData } from "../../lib/csv";
import { ChamadoFilaItem } from "./ChamadoFilaItem";
import { FilaFiltros } from "./FilaFiltros";
import {
  aplicarFiltros,
  FILTROS_VAZIOS,
  filtrosDaUrl,
  paramsDosFiltros,
  pertenceAMinhaFila,
  temCriterioDeAfinidade,
  temFiltroAtivo,
  tituloDaFila,
} from "./filtros";

// RF13 / RNF05 — o backend não expõe os logs de escalonamento (o repository existe,
// mas não há controller), então o relatório exportável é a própria fila com os filtros
// aplicados na tela.
const COLUNAS_CSV = [
  { header: "Protocolo", valor: (c) => c.protocolo },
  { header: "Solicitante", valor: (c) => c.solicitanteNome },
  { header: "E-mail do solicitante", valor: (c) => c.emailSolicitante ?? "" },
  { header: "Responsável", valor: (c) => c.responsavelNome },
  { header: "Equipamento", valor: (c) => c.equipamentoNome ?? "" },
  { header: "Categoria", valor: (c) => Categoria[c.categoria]?.label ?? c.categoria },
  { header: "Setor", valor: (c) => Setor[c.setor]?.label ?? "" },
  { header: "Prioridade", valor: (c) => Urgencia[c.urgencia]?.label ?? c.urgencia },
  { header: "Status", valor: (c) => StatusChamado[c.status]?.label ?? c.status },
  { header: "Nível exigido", valor: (c) => NivelAtendente[c.nivelExigido]?.label ?? "" },
  { header: "Aberto em", valor: (c) => new Date(c.dataAbertura).toLocaleString("pt-BR") },
  { header: "Prazo SLA", valor: (c) => calcularSla(c).prazo.toLocaleString("pt-BR") },
  { header: "Situação SLA", valor: (c) => calcularSla(c).label },
  { header: "Descrição", valor: (c) => c.descricao },
];

function AbaFila({ ativa, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
        ativa ? "bg-accent text-white" : "text-text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

export function FilasAtendimentoPage() {
  const { chamados, loading, error, recarregar } = useChamados();
  const { meuPerfil, porId, loading: carregandoUsuarios } = useUsuarios();

  const [minhaFila, setMinhaFila] = useState(false);

  // O filtro mora na URL, não em `useState`: é o que permite o dashboard abrir esta
  // tela já recortada ("só os abertos") por um link simples, e o que mantém o botão
  // "voltar" do navegador desfazendo o recorte em vez de sair da tela.
  const [searchParams, setSearchParams] = useSearchParams();
  const filtros = useMemo(() => filtrosDaUrl(searchParams), [searchParams]);

  // `replace` para uma sessão de ajuste de chips não empilhar dez entradas no
  // histórico — voltar deve devolver ao dashboard, não ao chip anterior.
  const definirFiltros = useCallback(
    (novos) => setSearchParams(paramsDosFiltros(novos), { replace: true }),
    [setSearchParams],
  );

  const veioFiltrado = temFiltroAtivo(filtros);
  const titulo = tituloDaFila(filtros, (s) => StatusChamado[s]?.label ?? s);

  const semAfinidade = !carregandoUsuarios && !temCriterioDeAfinidade(meuPerfil);

  const visiveis = useMemo(() => {
    const base = minhaFila ? chamados.filter((c) => pertenceAMinhaFila(c, meuPerfil)) : chamados;
    return aplicarFiltros(base, filtros);
  }, [chamados, filtros, minhaFila, meuPerfil]);

  const atrasados = visiveis.filter((c) => calcularSla(c).atrasado).length;

  function exportar() {
    // O ChamadoResponseDTO não devolve o e-mail do solicitante, só o id — resolvemos
    // pela lista de usuários apenas na exportação, onde o contato faz falta.
    const linhas = visiveis.map((c) => ({ ...c, emailSolicitante: porId(c.solicitanteId)?.email }));
    baixarCsv(`fila-atendimento-${carimboDeData()}.csv`, COLUNAS_CSV, linhas);
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Quem chegou por um indicador do dashboard precisa do caminho de volta. */}
      {veioFiltrado && (
        <Link
          to="/atendimento/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} />
          Voltar para o dashboard
        </Link>
      )}

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">{titulo}</h1>
          <p className="text-sm text-text-muted">
            {visiveis.length} {visiveis.length === 1 ? "chamado" : "chamados"}
            {veioFiltrado && ` de ${minhaFila ? "sua fila" : chamados.length}`}
            {atrasados > 0 && (
              <span className="text-danger">
                {" · "}
                {atrasados} com SLA estourado
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={recarregar} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Atualizar
          </Button>
          <Button variant="secondary" onClick={exportar} disabled={visiveis.length === 0}>
            <Download size={16} />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* RF10 */}
      <div className="mb-4 flex max-w-sm gap-1 rounded-lg border border-border bg-surface-2 p-1">
        <AbaFila ativa={!minhaFila} onClick={() => setMinhaFila(false)}>
          Fila Geral
        </AbaFila>
        <AbaFila ativa={minhaFila} onClick={() => setMinhaFila(true)}>
          Minha Fila
        </AbaFila>
      </div>

      {minhaFila && !semAfinidade && (
        <p className="mb-4 -mt-2 text-xs text-text-faint">
          Chamados que competem a você
          {meuPerfil?.nivelAntendente && ` · ${NivelAtendente[meuPerfil.nivelAntendente]?.label}`}
          {meuPerfil?.setor && ` · ${Setor[meuPerfil.setor]?.label}`}
        </p>
      )}

      <FilaFiltros
        filtros={filtros}
        onChange={definirFiltros}
        onLimpar={() => definirFiltros(FILTROS_VAZIOS)}
      />

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {!loading && error && <ErrorBanner message={error} />}

      {!loading && !error && minhaFila && semAfinidade && (
        <EmptyState
          icon={Inbox}
          title="Seu perfil não tem nível nem setor definidos"
          description="A Minha Fila reúne os chamados do seu nível e do seu setor. Complete esses dados no cadastro para usar este recorte."
        />
      )}

      {!loading && !error && !(minhaFila && semAfinidade) && visiveis.length === 0 && (
        <EmptyState
          icon={Inbox}
          title={veioFiltrado ? "Nenhum chamado para esses filtros" : "Fila vazia"}
          description={
            veioFiltrado
              ? "Ajuste ou limpe os filtros para ver mais resultados."
              : "Novos chamados aparecem aqui assim que forem abertos."
          }
        />
      )}

      <div className="flex flex-col gap-2.5">
        {!loading &&
          !error &&
          visiveis.map((c) => (
            <ChamadoFilaItem key={c.id} chamado={c} />
          ))}
      </div>
    </div>
  );
}
