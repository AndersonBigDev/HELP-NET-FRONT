import { FilterX } from "lucide-react";
import { Categoria, NivelAtendente, Setor, StatusChamado, Urgencia } from "../../domain/enums";
import { alternarValor, contarFiltrosAtivos, temFiltroAtivo } from "./filtros";

function Chip({ ativo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
        ativo
          ? "border-accent bg-accent-soft text-accent"
          : "border-border bg-surface-2 text-text-muted hover:border-border hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function GrupoChips({ titulo, dicionario, selecionados, onToggle }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wider text-text-faint uppercase">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">
        {Object.values(dicionario).map((item) => (
          <Chip
            key={item.value}
            ativo={selecionados.includes(item.value)}
            onClick={() => onToggle(item.value)}
          >
            {item.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

// RF11: Status, Tags, Nível e Prioridade — combináveis entre si.
// "Tags" não existe como campo no backend; as etiquetas mais próximas no modelo são
// Categoria (tipo do chamado) e Setor responsável, então é isso que expomos aqui.
export function FilaFiltros({ filtros, onChange, onLimpar }) {
  function toggle(dimensao) {
    return (valor) => onChange({ ...filtros, [dimensao]: alternarValor(filtros[dimensao], valor) });
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">
          Filtros
          {temFiltroAtivo(filtros) && (
            <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              {contarFiltrosAtivos(filtros)}
            </span>
          )}
        </h2>
        {temFiltroAtivo(filtros) && (
          <button
            type="button"
            onClick={onLimpar}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text cursor-pointer"
          >
            <FilterX size={14} />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Recortes derivados (não são campo do chamado): SLA estourado e dia de
          abertura. Aparecem como chips para o filtro que veio do dashboard ficar
          visível e removível, em vez de um estado invisível na URL. */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <p className="mr-1 text-xs font-semibold tracking-wider text-text-faint uppercase">Recorte</p>
        <Chip
          ativo={filtros.atrasados}
          onClick={() => onChange({ ...filtros, atrasados: !filtros.atrasados })}
        >
          SLA estourado
        </Chip>
        {filtros.dia && (
          <Chip ativo onClick={() => onChange({ ...filtros, dia: null })}>
            Abertos em {filtros.dia}
          </Chip>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GrupoChips titulo="Status" dicionario={StatusChamado} selecionados={filtros.status} onToggle={toggle("status")} />
        <GrupoChips titulo="Prioridade" dicionario={Urgencia} selecionados={filtros.urgencias} onToggle={toggle("urgencias")} />
        <GrupoChips titulo="Nível" dicionario={NivelAtendente} selecionados={filtros.niveis} onToggle={toggle("niveis")} />
        <GrupoChips titulo="Tags · Setor" dicionario={Setor} selecionados={filtros.setores} onToggle={toggle("setores")} />
        <div className="sm:col-span-2">
          <GrupoChips titulo="Tags · Categoria" dicionario={Categoria} selecionados={filtros.categorias} onToggle={toggle("categorias")} />
        </div>
      </div>
    </div>
  );
}
