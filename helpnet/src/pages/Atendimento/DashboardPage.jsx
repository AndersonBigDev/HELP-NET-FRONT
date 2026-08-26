import { AlertTriangle, BarChart3, CheckCircle2, Clock, Inbox, ThumbsDown } from "lucide-react";
import { useMemo } from "react";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui/Feedback";
import { Setor, StatusChamado } from "../../domain/enums";
import { calcularSla } from "../../domain/sla";
import { useChamados } from "../../hooks/useChamados";
import { corSemantica } from "../../lib/chartTheme";
import {
  GraficoAberturasPorDia,
  GraficoPorSetor,
  GraficoPorStatus,
  TabelaDados,
} from "./DashboardCharts";

const DIAS_NA_SERIE = 7;
const SEM_DADO = "—";

function chaveDoDia(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

function calcularMetricas(chamados) {
  const abertos = chamados.filter((c) => c.status === "ABERTO").length;
  const resolvidos = chamados.filter((c) => c.status === "RESOLVIDO" || c.status === "FECHADO").length;
  const atrasados = chamados.filter((c) => calcularSla(c).atrasado).length;

  const porStatus = Object.values(StatusChamado).map((s) => ({
    label: s.label,
    total: chamados.filter((c) => c.status === s.value).length,
    cor: corSemantica(s.color),
  }));

  const porSetor = [...Object.values(Setor), { value: null, labelCurto: "Sem setor" }]
    .map((s) => ({ label: s.labelCurto, total: chamados.filter((c) => c.setor === s.value).length }))
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);

  // Últimos 7 dias, incluindo os dias sem abertura (senão a linha mente sobre o ritmo).
  const hoje = new Date();
  const porDia = Array.from({ length: DIAS_NA_SERIE }, (_, i) => {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() - (DIAS_NA_SERIE - 1 - i));
    const chave = chaveDoDia(dia);
    return {
      label: dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      total: chamados.filter((c) => chaveDoDia(c.dataAbertura) === chave).length,
    };
  });

  return { abertos, resolvidos, atrasados, porStatus, porSetor, porDia };
}

// Classes literais: o Tailwind varre o código-fonte, então `text-${cor}` não geraria CSS.
const COR_VALOR = {
  text: "text-text",
  success: "text-success",
  danger: "text-danger",
  faint: "text-text-faint",
};

function IndicadorCard({ icon: Icon, label, valor, cor = "text", nota }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-text-muted">
        <Icon size={16} />
        <p className="text-xs font-medium">{label}</p>
      </div>
      {/* Valor grande usa figuras proporcionais (sem tabular-nums). */}
      <p className={`text-3xl font-semibold ${COR_VALOR[cor] ?? COR_VALOR.text}`}>{valor}</p>
      {nota && <p className="mt-1 text-[11px] text-text-faint">{nota}</p>}
    </Card>
  );
}

// RF14 / RN08 / RNF02 — indicadores e gráficos da operação.
export function DashboardPage() {
  const { chamados, loading, error } = useChamados();
  const m = useMemo(() => calcularMetricas(chamados), [chamados]);

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
        <p className="text-sm text-text-muted">Indicadores da operação de atendimento</p>
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
            <IndicadorCard icon={Inbox} label="Chamados abertos" valor={m.abertos} />
            <IndicadorCard icon={CheckCircle2} label="Volume resolvido" valor={m.resolvidos} cor="success" />
            <IndicadorCard
              icon={AlertTriangle}
              label="Volume atrasado"
              valor={m.atrasados}
              cor={m.atrasados > 0 ? "danger" : "text"}
              nota="SLA calculado pela urgência"
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
              <GraficoPorStatus dados={m.porStatus} />
              <TabelaDados dados={m.porStatus} colunaRotulo="Status" />
            </Card>

            <Card>
              <h2 className="mb-1 text-sm font-semibold text-text">Chamados por setor</h2>
              <p className="mb-3 text-xs text-text-faint">Volume roteado a cada setor responsável</p>
              <GraficoPorSetor dados={m.porSetor} />
              <TabelaDados dados={m.porSetor} colunaRotulo="Setor" />
            </Card>
          </div>

          <Card>
            <h2 className="mb-1 text-sm font-semibold text-text">Aberturas nos últimos 7 dias</h2>
            <p className="mb-3 text-xs text-text-faint">Chamados abertos por dia</p>
            <GraficoAberturasPorDia dados={m.porDia} />
            <TabelaDados dados={m.porDia} colunaRotulo="Dia" colunaValor="Aberturas" />
          </Card>
        </>
      )}
    </div>
  );
}
