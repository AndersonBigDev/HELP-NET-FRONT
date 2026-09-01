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
 * Controle de aparência.
 *
 * @param {boolean} compacto  Só o modo claro/escuro, em ícones — para a tela de
 *                            login, onde a escolha de acento seria ruído.
 */
export function SeletorTema({ compacto = false }) {
  const { modo, acento, escolherModo, escolherAcento } = useTheme();

  const modos = (
    <div
      role="radiogroup"
      aria-label="Aparência"
      className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1"
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
            {!compacto && m.label}
            {compacto && <span className="sr-only">{m.label}</span>}
          </Segmento>
        );
      })}
    </div>
  );

  if (compacto) return modos;

  return (
    <div className="flex flex-col gap-2">
      <p className="px-2 text-[11px] font-semibold tracking-wider text-text-faint uppercase">
        Aparência
      </p>

      {modos}

      <div role="radiogroup" aria-label="Cor de destaque" className="flex justify-between px-1">
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
              className={`amostra-acento flex size-6 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-110 ${
                ativo ? "ring-2 ring-text" : ""
              }`}
            >
              {ativo && <Check size={13} strokeWidth={3} className="text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
