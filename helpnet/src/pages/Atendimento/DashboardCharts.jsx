import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { corToken } from "../../lib/chartTheme";

// Specs fixos: eixos/grade recessivos (hairline sólida), barras finas com a ponta
// arredondada e a base quadrada, linha de 2px. Texto sempre em token de texto —
// nunca na cor da série.
const EIXO = { fontSize: 12, fill: corToken("text-muted") };
const ESPESSURA_BARRA = 24;

function TooltipCustomizado({ active, payload, label, sufixo = "chamados" }) {
  if (!active || !payload?.length) return null;
  const valor = payload[0].value;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-text">{label}</p>
      <p className="text-text-muted">
        {valor} {valor === 1 ? sufixo.replace(/s$/, "") : sufixo}
      </p>
    </div>
  );
}

// Colunas por status. A identidade de cada coluna vem do rótulo do eixo; a cor é
// encoding redundante, a mesma dos badges de status na fila.
export function GraficoPorStatus({ dados }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={corToken("border")} strokeWidth={1} vertical={false} />
        <XAxis dataKey="label" tick={EIXO} tickLine={false} axisLine={{ stroke: corToken("border") }} interval={0} />
        <YAxis tick={EIXO} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip content={<TooltipCustomizado />} cursor={{ fill: corToken("surface-2") }} />
        <Bar dataKey="total" maxBarSize={ESPESSURA_BARRA} radius={[4, 4, 0, 0]}>
          {dados.map((d) => (
            <Cell key={d.label} fill={d.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Série única de magnitude por setor: um hue só, identidade no eixo, sem legenda.
export function GraficoPorSetor({ dados }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={corToken("border")} strokeWidth={1} horizontal={false} />
        <XAxis type="number" tick={EIXO} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={EIXO} tickLine={false} axisLine={false} width={110} />
        <Tooltip content={<TooltipCustomizado />} cursor={{ fill: corToken("surface-2") }} />
        <Bar dataKey="total" fill={corToken("accent")} maxBarSize={ESPESSURA_BARRA} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Série única no tempo: linha de 2px, marcador >= 8px com anel de 2px na cor da
// superfície para não sumir onde cruza a linha.
export function GraficoAberturasPorDia({ dados }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={dados} margin={{ top: 8, right: 16, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={corToken("border")} strokeWidth={1} vertical={false} />
        <XAxis dataKey="label" tick={EIXO} tickLine={false} axisLine={{ stroke: corToken("border") }} />
        <YAxis tick={EIXO} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip content={<TooltipCustomizado sufixo="aberturas" />} cursor={{ stroke: corToken("border") }} />
        <Line
          type="monotone"
          dataKey="total"
          stroke={corToken("accent")}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={{ r: 4, fill: corToken("accent"), stroke: corToken("surface"), strokeWidth: 2 }}
          activeDot={{ r: 6, fill: corToken("accent"), stroke: corToken("surface"), strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Cada gráfico acompanha a mesma informação em tabela — o dado nunca fica só na cor.
export function TabelaDados({ dados, colunaRotulo, colunaValor = "Chamados" }) {
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs text-text-faint hover:text-text-muted">
        Ver como tabela
      </summary>
      <table className="mt-2 w-full text-xs">
        <thead>
          <tr className="border-b border-border-soft text-left text-text-faint">
            <th className="py-1 font-medium">{colunaRotulo}</th>
            <th className="py-1 text-right font-medium">{colunaValor}</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.label} className="border-b border-border-soft/50">
              <td className="py-1 text-text-muted">{d.label}</td>
              <td className="py-1 text-right text-text tabular-nums">{d.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
