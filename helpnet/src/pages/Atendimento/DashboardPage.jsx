import { AlertTriangle, BarChart3, CheckCircle2, Clock, Headset, Inbox, ThumbsDown } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui/Feedback";
import { Setor, StatusChamado } from "../../domain/enums";
import { calcularSla } from "../../domain/sla";
import { useChamados } from "../../hooks/useChamados";
import { corSemantica } from "../../lib/chartTheme";
import { useTheme } from "../../theme/ThemeContext";
import { chaveDoDia, linkDaFila } from "./filtros";
import {
  GraficoAberturasPorDia,
  GraficoPorSetor,
  GraficoPorStatus,
  TabelaDados,
} from "./DashboardCharts";

const DIAS_NA_SERIE = 7;
const SEM_DADO = "—";

function calcularMetricas(chamados) {
  const abertos = chamados.filter((c) => c.status === "ABERTO").length;
  const resolvidos = chamados.filter((c) => c.status === "RESOLVIDO" || c.status === "FECHADO").length;
  const atrasados = chamados.filter((c) => calcularSla(c).atrasado).length;

  // "Em andamento" é o status EM_ANDAMENTO na régua, não "tudo que não está aberto":
  // escalonado e pausado também estão na mão de alguém, mas em situações diferentes.
  // Por isso vêm separados, na nota do card, em vez de somados num número só.
  const emAndamento = chamados.filter((c) => c.status === "EM_ANDAMENTO").length;
  const escalonados = chamados.filter((c) => c.status === "ESCALONADO").length;
  const pausados = chamados.filter((c) => c.status === "PAUSADO").length;

  // `value` acompanha cada série para o clique saber qual recorte abrir — sem ele
  // sobraria casar pelo rótulo traduzido, que é frágil.
  const porStatus = Object.values(StatusChamado).map((s) => ({
    value: s.value,
    label: s.label,
    total: chamados.filter((c) => c.status === s.value).length,
    cor: corSemantica(s.color),
  }));

  const porSetor = [...Object.values(Setor), { value: null, labelCurto: "Sem setor" }]
    .map((s) => ({
      value: s.value,
      label: s.labelCurto,
      total: chamados.filter((c) => c.setor === s.value).length,
    }))
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);

  // Últimos 7 dias, incluindo os dias sem abertura (senão a linha mente sobre o ritmo).
  const hoje = new Date();
  const porDia = Array.from({ length: DIAS_NA_SERIE }, (_, i) => {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() - (DIAS_NA_SERIE - 1 - i));
    const chave = chaveDoDia(dia);
    return {
      chave,
      label: dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      total: chamados.filter((c) => chaveDoDia(c.dataAbertura) === chave).length,
    };
  });

  return { abertos, emAndamento, escalonados, pausados, resolvidos, atrasados, porStatus, porSetor, porDia };
}

// Escalonado e pausado só aparecem quando existem — a nota não pode virar uma linha
// de zeros competindo com o número que importa.
function notaDoAtendimento({ escalonados, pausados }) {
  const partes = [];
  if (escalonados > 0) partes.push(`${escalonados} escalonado${escalonados > 1 ? "s" : ""}`);
  if (pausados > 0) partes.push(`${pausados} pausado${pausados > 1 ? "s" : ""}`);

  return partes.length > 0 ? `Fora estes: ${partes.join(" · ")}` : "Chamados sendo tratados agora";
}

// Classes literais: o Tailwind varre o código-fonte, então `text-${cor}` não geraria CSS.
const COR_VALOR = {
  text: "text-text",
  success: "text-success",
  danger: "text-danger",
  faint: "text-text-faint",
};

/**
 * Indicador da operação. Com `para`, o card inteiro vira o link para a fila daquele
 * recorte — o número deixa de ser só informação e passa a ser o caminho até os
 * chamados que ele conta. Sem `para` (indicador sem fonte de dado), continua estático.
 */
function IndicadorCard({ icon: Icon, label, valor, cor = "text", nota, para }) {
  const conteudo = (
    <>
      <div className="mb-2 flex items-center gap-2 text-text-muted">
        <Icon size={16} />
        <p className="text-xs font-medium">{label}</p>
      </div>
      {/* Valor grande usa figuras proporcionais (sem tabular-nums). */}
      <p className={`text-3xl font-semibold ${COR_VALOR[cor] ?? COR_VALOR.text}`}>{valor}</p>
      {nota && <p className="mt-1 text-[11px] text-text-faint">{nota}</p>}
    </>
  );

  if (!para) return <Card className="p-4">{conteudo}</Card>;

  return (
    <Link to={para} className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <Card className="p-4 transition-colors hover:border-accent/50 hover:bg-surface-2">
        {conteudo}
        <p className="mt-2 text-[11px] font-medium text-accent">Ver chamados →</p>
      </Card>
    </Link>
  );
}

// RF14 / RN08 / RNF02 — indicadores e gráficos da operação.
export function DashboardPage() {
  const { chamados, loading, error } = useChamados();
  const navigate = useNavigate();
  // As cores das séries saem de `corSemantica`, que lê a variável CSS viva. Como
  // essa leitura não passa pelo React, `versaoTema` entra nas dependências: sem
  // ela o gráfico ficaria com a paleta anterior até os dados recarregarem.
  const { versaoTema } = useTheme();
  const m = useMemo(
    () => calcularMetricas(chamados),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chamados, versaoTema],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-text">Dashboard Analítico</h1>
        <p className="text-sm text-text-muted">
          Indicadores da operação de atendimento · clique em qualquer número, barra ou
          linha da tabela para abrir a fila só com aqueles chamados
        </p>
      </div>

      {chamados.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sem chamados para analisar"
          description="Os indicadores aparecem assim que houver chamados registrados."
        />
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <IndicadorCard
              icon={Inbox}
              label="Chamados abertos"
              valor={m.abertos}
              para={linkDaFila({ status: ["ABERTO"] })}
            />
            <IndicadorCard
              icon={Headset}
              label="Em andamento"
              valor={m.emAndamento}
              nota={notaDoAtendimento(m)}
              para={linkDaFila({ status: ["EM_ANDAMENTO"] })}
            />
            <IndicadorCard
              icon={CheckCircle2}
              label="Volume resolvido"
              valor={m.resolvidos}
              cor="success"
              para={linkDaFila({ status: ["RESOLVIDO", "FECHADO"] })}
            />
            <IndicadorCard
              icon={AlertTriangle}
              label="Volume atrasado"
              valor={m.atrasados}
              cor={m.atrasados > 0 ? "danger" : "text"}
              nota="SLA calculado pela urgência"
              para={linkDaFila({ atrasados: true })}
            />
            {/* RN08: sem fonte de dado no backend — não existe campo de avaliação, e o
                ChamadoResponseDTO não devolve dataFechamento. Mostramos "—" em vez de
                número inventado, mesma convenção do telefone do solicitante. */}
            <IndicadorCard
              icon={ThumbsDown}
              label="Avaliação negativa"
              valor={SEM_DADO}
              cor="faint"
              nota="Aguardando campo de avaliação no backend"
            />
            <IndicadorCard
              icon={Clock}
              label="Total atendido no dia"
              valor={SEM_DADO}
              cor="faint"
              nota="Aguardando dataFechamento no backend"
            />
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-1 text-sm font-semibold text-text">Chamados por status</h2>
              <p className="mb-3 text-xs text-text-faint">Distribuição atual da base</p>
              <GraficoPorStatus
                dados={m.porStatus}
                onSelecionar={(d) => navigate(linkDaFila({ status: [d.value] }))}
              />
              <TabelaDados
                dados={m.porStatus}
                colunaRotulo="Status"
                linkDe={(d) => linkDaFila({ status: [d.value] })}
              />
            </Card>

            <Card>
              <h2 className="mb-1 text-sm font-semibold text-text">Chamados por setor</h2>
              <p className="mb-3 text-xs text-text-faint">Volume roteado a cada setor responsável</p>
              {/* "Sem setor" (value null) não vira link: não há filtro para a ausência
                  de setor, e um link que não recorta nada enganaria mais que ajudaria. */}
              <GraficoPorSetor
                dados={m.porSetor}
                onSelecionar={(d) => d.value && navigate(linkDaFila({ setores: [d.value] }))}
              />
              <TabelaDados
                dados={m.porSetor}
                colunaRotulo="Setor"
                linkDe={(d) => (d.value ? linkDaFila({ setores: [d.value] }) : "/atendimento")}
              />
            </Card>
          </div>

          <Card>
            <h2 className="mb-1 text-sm font-semibold text-text">Aberturas nos últimos 7 dias</h2>
            <p className="mb-3 text-xs text-text-faint">Chamados abertos por dia</p>
            <GraficoAberturasPorDia
              dados={m.porDia}
              onSelecionar={(d) => navigate(linkDaFila({ dia: d.chave }))}
            />
            <TabelaDados
              dados={m.porDia}
              colunaRotulo="Dia"
              colunaValor="Aberturas"
              linkDe={(d) => linkDaFila({ dia: d.chave })}
            />
          </Card>
        </>
      )}
    </div>
  );
}
