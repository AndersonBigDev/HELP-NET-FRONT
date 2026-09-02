import {
  CheckCircle2,
  Headset,
  MessageSquarePlus,
  PauseCircle,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { interacoesDisponiveis } from "../../domain/interacoes";
import { NovaInteracaoModal } from "./NovaInteracaoModal";

// Barra de ações do chamado.
//
// "Nova Interação" abre a lista completa; os atalhos ao lado abrem o mesmo formulário
// já com a opção marcada, para o caminho comum ser um clique a menos. Não existe ação
// aqui que não exista na lista — a barra é um atalho, nunca uma porta paralela.

const ICONES = {
  ASSUMIR: Headset,
  RETOMAR: PlayCircle,
  PAUSAR: PauseCircle,
  RESOLVER: CheckCircle2,
  REABRIR: RotateCcw,
};

// Ordem de prioridade dos atalhos. O que sobra continua alcançável pela lista.
const DESTAQUES = ["ASSUMIR", "RETOMAR", "PAUSAR", "RESOLVER", "REABRIR"];
const MAXIMO_ATALHOS = 3;

/**
 * @param {object} props
 * @param {object} props.chamado
 * @param {number} [props.usuarioId]
 * @param {(chamado: object|null) => void} props.onInteracao  chamado atualizado, ou null
 *        quando a interação só gerou histórico
 */
export function AcoesChamado({ chamado, usuarioId, onInteracao }) {
  const [aberto, setAberto] = useState(false);
  const [interacaoInicial, setInteracaoInicial] = useState(null);

  const disponiveis = interacoesDisponiveis(chamado, usuarioId);

  const atalhos = DESTAQUES.map((valor) => disponiveis.find((o) => o.value === valor))
    .filter(Boolean)
    .slice(0, MAXIMO_ATALHOS);

  function abrir(opcao = null) {
    setInteracaoInicial(opcao);
    setAberto(true);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
      <Button onClick={() => abrir()}>
        <MessageSquarePlus size={16} />
        Nova Interação
      </Button>

      {atalhos.map((opcao) => {
        const Icone = ICONES[opcao.value];
        return (
          <Button key={opcao.value} variant="secondary" onClick={() => abrir(opcao)}>
            {Icone && <Icone size={16} />}
            {opcao.label}
          </Button>
        );
      })}

      <span className="ml-auto text-xs text-text-faint">
        Toda interação fica registrada no histórico.
      </span>

      <NovaInteracaoModal
        open={aberto}
        onClose={() => setAberto(false)}
        chamado={chamado}
        usuarioId={usuarioId}
        interacaoInicial={interacaoInicial}
        onConcluida={onInteracao}
      />
    </div>
  );
}
