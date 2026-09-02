import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../theme/ThemeContext";
import { ACENTOS, MODOS } from "../../theme/temas";

const ICONE_DO_MODO = {
  sistema: Monitor,
  claro: Sun,
  escuro: Moon,
};

// Mesma casca das abas da fila (`AbaFila`) e do alternador do Novo Chamado,
// para o controle não parecer um corpo estranho na interface.
function Segmento({ ativo, onClick, titulo, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativo}
      title={titulo}
      onClick={onClick}
      className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
        ativo ? "bg-accent text-white" : "text-text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Controle de aparência, sempre em uma linha só.
 *
 * Os modos vão em ícone, sem o rótulo escrito: monitor, sol e lua são convenção
 * conhecida, e é o que permite modo e acento caberem lado a lado no rodapé da barra
 * lateral. O texto continua existindo para leitor de tela (`sr-only`) e no `title`.
 *
 * @param {boolean} compacto  Só o modo claro/escuro — para a tela de login, onde a
 *                            escolha de acento seria ruído.
 */
export function SeletorTema({ compacto = false }) {
  const { modo, acento, escolherModo, escolherAcento } = useTheme();

  const modos = (
    <div
      role="radiogroup"
      aria-label="Aparência"
      // Na linha do rodape o grupo de modos toma a sobra: sem `flex-1` ele encolhe ate
      // o conteudo e os tres icones ficam colados. As bolinhas nao encolhem (`shrink-0`),
      // entao quem cede espaco e sempre o segmentado.
      className={`flex gap-1 rounded-lg border border-border bg-surface-2 p-1 ${
        compacto ? "" : "min-w-0 flex-1"
      }`}
    >
      {MODOS.map((m) => {
        const Icone = ICONE_DO_MODO[m.value];
        return (
          <Segmento
            key={m.value}
            ativo={modo === m.value}
            onClick={() => escolherModo(m.value)}
            titulo={m.descricao}
          >
            <Icone size={14} />
            <span className="sr-only">{m.label}</span>
          </Segmento>
        );
      })}
    </div>
  );

  if (compacto) return modos;

  return (
    <div className="flex items-center gap-2">
      {modos}

      {/* Bolinhas menores que o alternador de modo de proposito: o acento se escolhe uma
          vez, claro/escuro se alterna o tempo todo. Quem usa mais leva mais area. */}
      <div role="radiogroup" aria-label="Cor de destaque" className="flex shrink-0 gap-1.5">
        {ACENTOS.map((a) => {
          const ativo = acento === a.value;
          return (
            <button
              key={a.value}
              type="button"
              role="radio"
              aria-checked={ativo}
              aria-label={a.label}
              title={a.label}
              onClick={() => escolherAcento(a.value)}
              /* `data-accent` próprio: a bolinha herda a matiz daquele tema e se
                 pinta com a classe `.amostra-acento`, então ela mostra sempre a
                 cor exata que o clique vai aplicar. */
              data-accent={a.value}
              className={`amostra-acento flex size-4 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-110 ${
                ativo ? "ring-2 ring-text" : ""
              }`}
            >
              {ativo && <Check size={10} strokeWidth={3} className="text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
