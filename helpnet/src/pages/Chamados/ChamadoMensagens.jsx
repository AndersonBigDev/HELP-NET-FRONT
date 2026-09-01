import { MessagesSquare, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { mensagensApi } from "../../api/mensagensApi";
import { ErrorBanner, Spinner } from "../../components/ui/Feedback";
import { Perfil } from "../../domain/enums";

// =============================================================================
// MINI CHAT DO CHAMADO (RF08) — UI
//
// >>> BACKEND: o contrato HTTP que esta tela consome está documentado em
// >>> src/api/mensagensApi.js. Comece por lá.
// =============================================================================
//
// Atendente pergunta, solicitante detalha o problema, os dois no mesmo fio.
// O servidor decide quem entra: solicitante dono do chamado, atendente com nível
// suficiente ou ADMIN.
//
// Chamado FECHADO encerra a thread (o POST volta 400); RESOLVIDO continua aberto de
// propósito, porque é nesse momento que o solicitante contesta a solução.

const LIMITE_CARACTERES = 2000;

// Enquanto o backend não expõe /chamados/{id}/mensagens, a rota volta 404. Isso não é
// falha do usuário nem do chamado, então merece um aviso próprio em vez do erro cru.
// Quando o endpoint existir, este caminho simplesmente deixa de ser alcançado.
const AVISO_SEM_BACKEND =
  "A conversa ainda não está disponível: o servidor não expõe este recurso. " +
  "Aguardando a implementação de /chamados/{id}/mensagens no backend.";

function horaDe(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// `autoria` vem pronto do backend (true quando o leitor é o autor), então a bolha
// não precisa comparar e-mail nem id do lado do cliente.
function Bolha({ mensagem }) {
  const minha = mensagem.autoria;

  return (
    <li className={`flex ${minha ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] min-w-0 ${minha ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className="flex items-center gap-1.5 px-1 text-xs text-text-faint">
          <span className="font-medium text-text-muted">
            {minha ? "Você" : mensagem.autorNome}
          </span>
          {!minha && mensagem.autorPerfil !== "USUARIO" && (
            <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
              {Perfil[mensagem.autorPerfil]?.label ?? mensagem.autorPerfil}
            </span>
          )}
          <span>· {horaDe(mensagem.dataEnvio)}</span>
        </div>
        <div
          className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line break-words ${
            minha
              ? "rounded-br-sm bg-accent text-white"
              : "rounded-bl-sm border border-border-soft bg-surface-2 text-text"
          }`}
        >
          {mensagem.conteudo}
        </div>
      </div>
    </li>
  );
}

export function ChamadoMensagens({ chamadoId, somenteLeitura = false }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [semBackend, setSemBackend] = useState(false);
  const fimDaListaRef = useRef(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMensagens(await mensagensApi.listar(chamadoId));
      setSemBackend(false);
    } catch (err) {
      if (err.status === 404) {
        setSemBackend(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [chamadoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Rola para a última mensagem quando a thread cresce — comportamento esperado de
  // chat. `block: "nearest"` para não arrastar a página inteira junto.
  useEffect(() => {
    if (mensagens.length > 0) {
      fimDaListaRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [mensagens]);

  async function handleSubmit(e) {
    e.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;

    setError(null);
    setEnviando(true);
    try {
      const nova = await mensagensApi.enviar(chamadoId, conteudo);
      setMensagens((atuais) => [...atuais, nova]);
      setTexto("");
    } catch (err) {
      setError(err.status === 404 ? AVISO_SEM_BACKEND : err.message);
    } finally {
      setEnviando(false);
    }
  }

  // Enter envia, Shift+Enter quebra linha.
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  const restantes = LIMITE_CARACTERES - texto.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text">
          <MessagesSquare size={15} />
          Conversa
        </h3>
        {mensagens.length > 0 && (
          <span className="text-xs text-text-faint">
            {mensagens.length} {mensagens.length === 1 ? "mensagem" : "mensagens"}
          </span>
        )}
      </div>

      <ErrorBanner message={error} />

      {semBackend && (
        <p className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">
          {AVISO_SEM_BACKEND}
        </p>
      )}

      {loading ? (
        <Spinner size={16} />
      ) : semBackend ? null : mensagens.length === 0 ? (
        <p className="text-xs text-text-faint">
          Nenhuma mensagem ainda. Use este espaço para trocar detalhes sobre o chamado.
        </p>
      ) : (
        <ul className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
          {mensagens.map((m) => (
            <Bolha key={m.id} mensagem={m} />
          ))}
          <li ref={fimDaListaRef} aria-hidden="true" />
        </ul>
      )}

      {somenteLeitura ? (
        <p className="rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-xs text-text-faint">
          Chamado fechado — a conversa está encerrada.
        </p>
      ) : semBackend ? null : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={texto}
              maxLength={LIMITE_CARACTERES}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva uma mensagem..."
              aria-label="Nova mensagem"
              className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent disabled:opacity-50"
              disabled={enviando}
            />
            <button
              type="submit"
              disabled={enviando || texto.trim().length === 0}
              aria-label="Enviar mensagem"
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? <Spinner size={15} className="text-white" /> : <Send size={16} />}
            </button>
          </div>
          <p className="px-1 text-[11px] text-text-faint">
            Enter envia · Shift+Enter quebra linha
            {restantes < 200 && ` · ${restantes} caracteres restantes`}
          </p>
        </form>
      )}
    </div>
  );
}
