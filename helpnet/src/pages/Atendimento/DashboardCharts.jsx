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
import { Link } from "react-router-dom";
import { corToken } from "../../lib/chartTheme";

// Specs fixos: eixos/grade recessivos (hairline sólida), barras finas com a ponta
// arredondada e a base quadrada, linha de 2px. Texto sempre em token de texto —
// nunca na cor da série.
// Função e não constante de módulo: `corToken` lê a variável CSS viva, então um
// valor congelado no import continuaria com a cor do tema anterior depois da troca.
const eixo = () => ({ fontSize: 12, fill: corToken("text-muted") });
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
//
// `onSelecionar` recebe o dado da coluna clicada — é o que transforma o gráfico em
// navegação para a fila recortada. Opcional: sem ele o gráfico continua só leitura.
// A tabela abaixo de cada gráfico oferece o mesmo caminho por link, para quem navega
// por teclado ou leitor de tela não depender do clique na barra.
export function GraficoPorStatus({ dados, onSelecionar }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={corToken("border")} strokeWidth={1} vertical={false} />
        <XAxis dataKey="label" tick={eixo()} tickLine={false} axisLine={{ stroke: corToken("border") }} interval={0} />
        <YAxis tick={eixo()} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <Tooltip content={<TooltipCustomizado />} cursor={{ fill: corToken("surface-2") }} />
        <Bar
          dataKey="total"
          maxBarSize={ESPESSURA_BARRA}
          radius={[4, 4, 0, 0]}
          onClick={(d) => onSelecionar?.(d?.payload ?? d)}
          className={onSelecionar ? "cursor-pointer" : undefined}
        >
          {dados.map((d) => (
            <Cell key={d.label} fill={d.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Série única de magnitude por setor: um hue só, identidade no eixo, sem legenda.
export function GraficoPorSetor({ dados, onSelecionar }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
        <CartesianGrid stroke={corToken("border")} strokeWidth={1} horizontal={false} />
        <XAxis type="number" tick={eixo()} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={eixo()} tickLine={false} axisLine={false} width={110} />
        <Tooltip content={<TooltipCustomizado />} cursor={{ fill: corToken("surface-2") }} />
        <Bar
          dataKey="total"
          fill={corToken("accent")}
          maxBarSize={ESPESSURA_BARRA}
          radius={[0, 4, 4, 0]}
          onClick={(d) => onSelecionar?.(d?.payload ?? d)}
          className={onSelecionar ? "cursor-pointer" : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Série única no tempo: linha de 2px, marcador >= 8px com anel de 2px na cor da
// superfície para não sumir onde cruza a linha.
export function GraficoAberturasPorDia({ dados, onSelecionar }) {
  // Numa linha não há área clicável por ponto como na barra, então o clique vem do
  // próprio gráfico: o recharts informa o rótulo ativo e daí achamos o dia.
  function aoClicar(estado) {
    if (!onSelecionar) return;
    const item = dados.find((d) => d.label === estado?.activeLabel);
    if (item) onSelecionar(item);
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart
        data={dados}
        margin={{ top: 8, right: 16, bottom: 0, left: -20 }}
        onClick={aoClicar}
        className={onSelecionar ? "cursor-pointer" : undefined}
      >
        <CartesianGrid stroke={corToken("border")} strokeWidth={1} vertical={false} />
        <XAxis dataKey="label" tick={eixo()} tickLine={false} axisLine={{ stroke: corToken("border") }} />
        <YAxis tick={eixo()} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
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
// Quando `linkDe` é passado, cada linha também é o caminho para a fila recortada.
export function TabelaDados({ dados, colunaRotulo, colunaValor = "Chamados", linkDe }) {
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
              <td className="py-1 text-text-muted">
                {linkDe ? (
                  <Link to={linkDe(d)} className="hover:text-accent hover:underline">
                    {d.label}
                  </Link>
                ) : (
                  d.label
                )}
              </td>
              <td className="py-1 text-right text-text tabular-nums">{d.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
