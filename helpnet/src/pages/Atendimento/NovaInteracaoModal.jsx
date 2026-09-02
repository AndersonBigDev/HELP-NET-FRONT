import { ArrowRight, ArrowUpCircle, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { chamadosApi } from "../../api/chamadosApi";
import { historicoApi } from "../../api/historicoApi";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select, TextArea } from "../../components/ui/Field";
import { ErrorBanner } from "../../components/ui/Feedback";
import { Modal } from "../../components/ui/Modal";
import { niveisAcimaDe, StatusChamado } from "../../domain/enums";
import { exigeResolucao, interacoesDisponiveis } from "../../domain/interacoes";

// Uma interação = uma ação no chamado + o registro dela no histórico.
//
// O atendente escolhe na lista o que está fazendo, escreve o relato e confirma. O
// modal traduz a escolha para o endpoint certo (mapa em src/domain/interacoes.js) e
// devolve à tela o chamado atualizado, quando a ação mexeu no chamado.
//
// A lista é a mesma em todos os pontos de entrada: o botão "Nova Interação" abre sem
// nada marcado, e os atalhos da barra de ações abrem já com a opção selecionada.

function OpcaoInteracao({ opcao, selecionada, onSelecionar }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
        selecionada
          ? "border-accent bg-accent-soft text-text"
          : "border-border bg-surface-2 text-text-muted hover:text-text"
      }`}
    >
      <input
        type="radio"
        name="interacao"
        value={opcao.value}
        checked={selecionada}
        onChange={() => onSelecionar(opcao)}
        className="mt-0.5 accent-accent"
      />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-text">{opcao.label}</span>
          {opcao.statusResultante && (
            <Badge color={StatusChamado[opcao.statusResultante]?.color}>
              {StatusChamado[opcao.statusResultante]?.label}
            </Badge>
          )}
        </span>
        <span className="mt-0.5 block text-xs text-text-faint">{opcao.ajuda}</span>
      </span>
    </label>
  );
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object} props.chamado
 * @param {number} [props.usuarioId]
 * @param {object} [props.interacaoInicial]      opção pré-selecionada pelos atalhos
 * @param {(chamado: object|null) => void} props.onConcluida  chamado atualizado, ou null
 *        quando a ação só gerou histórico
 */
export function NovaInteracaoModal({ open, onClose, chamado, usuarioId, interacaoInicial, onConcluida }) {
  const [interacao, setInteracao] = useState(null);
  const [relato, setRelato] = useState("");
  const [resolucao, setResolucao] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [novoNivel, setNovoNivel] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInteracao(interacaoInicial ?? null);
    setRelato("");
    setResolucao("");
    setJustificativa("");
    setNovoNivel("");
    setError(null);
  }, [open, interacaoInicial]);

  if (!chamado) return null;

  const opcoes = interacoesDisponiveis(chamado, usuarioId);
  const niveis = niveisAcimaDe(chamado.nivelExigido);

  const preenchido = (texto) => texto.trim().length > 0;
  const precisaResolucao = interacao ? exigeResolucao(interacao, chamado) : false;

  const podeConfirmar =
    interacao != null &&
    (interacao.relato !== "obrigatorio" || preenchido(relato)) &&
    (!precisaResolucao || preenchido(resolucao)) &&
    (!interacao.exigeJustificativa || preenchido(justificativa)) &&
    (!interacao.exigeNivel || novoNivel !== "");

  // Cada ramo devolve o chamado atualizado (quando o endpoint devolve um) ou null,
  // para a tela saber se precisa reaplicar o chamado ou só recarregar a trilha.
  async function executar() {
    const texto = relato.trim();

    switch (interacao.value) {
      case "REGISTRAR":
        await historicoApi.registrar(chamado.id, texto);
        return null;

      case "ASSUMIR":
        return chamadosApi.assumir(chamado.id);

      case "ESCALONAR":
        return chamadosApi.escalonar(chamado.id, { novoNivel, justificativa: texto });

      default:
        return chamadosApi.alterarStatus(chamado.id, {
          status: interacao.statusResultante,
          observacao: texto || null,
          descricaoResolucao: precisaResolucao ? resolucao.trim() : null,
          justificativaReabertura: interacao.exigeJustificativa ? justificativa.trim() : null,
        });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!podeConfirmar || loading) return;

    setError(null);
    setLoading(true);
    try {
      const atualizado = await executar();

      // "Iniciar atendimento" com relato são duas coisas para o servidor: o PATCH de
      // assumir e a anotação. Na tela continua sendo uma interação só.
      if (interacao.value === "ASSUMIR" && preenchido(relato)) {
        await historicoApi.registrar(chamado.id, relato.trim());
      }

      onConcluida?.(atualizado);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova interação">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-text-muted">Estado atual:</span>
          <Badge color={StatusChamado[chamado.status]?.color}>
            {StatusChamado[chamado.status]?.label}
          </Badge>
          {interacao?.statusResultante && interacao.statusResultante !== chamado.status && (
            <>
              <ArrowRight size={14} className="text-text-faint" />
              <Badge color={StatusChamado[interacao.statusResultante]?.color}>
                {StatusChamado[interacao.statusResultante]?.label}
              </Badge>
            </>
          )}
        </div>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-text-muted">
            O que você vai fazer? <span className="text-danger">*</span>
          </legend>
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
            {opcoes.map((opcao) => (
              <OpcaoInteracao
                key={opcao.value}
                opcao={opcao}
                selecionada={interacao?.value === opcao.value}
                onSelecionar={setInteracao}
              />
            ))}
          </div>
        </fieldset>

        {interacao && (
          <>
            {interacao.exigeNivel && (
              <Select
                id="novoNivel"
                label="Escalonar para"
                required
                placeholder="Selecione o nível"
                options={niveis.map((n) => ({ value: n.value, label: n.label }))}
                value={novoNivel}
                onChange={(e) => setNovoNivel(e.target.value)}
              />
            )}

            {precisaResolucao && (
              <TextArea
                id="resolucao"
                label="Descrição da resolução"
                required
                rows={3}
                placeholder="Qual foi a solução aplicada?"
                value={resolucao}
                onChange={(e) => setResolucao(e.target.value)}
              />
            )}

            {interacao.exigeJustificativa && (
              <TextArea
                id="justificativa"
                label="Justificativa da reabertura"
                required
                rows={3}
                placeholder="Por que o chamado precisa voltar ao atendimento?"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            )}

            <TextArea
              id="relato"
              label={interacao.rotuloRelato}
              required={interacao.relato === "obrigatorio"}
              rows={3}
              maxLength={2000}
              placeholder={interacao.placeholderRelato}
              value={relato}
              onChange={(e) => setRelato(e.target.value)}
            />

            <p className="-mt-2 text-xs text-text-faint">
              {interacao.aviso ?? "Este registro entra no histórico do chamado, assinado por você."}
            </p>
          </>
        )}

        <ErrorBanner message={error} />

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!podeConfirmar || loading}>
            {interacao?.exigeNivel ? <ArrowUpCircle size={15} /> : <Check size={15} />}
            {loading ? "Registrando..." : "Registrar interação"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
