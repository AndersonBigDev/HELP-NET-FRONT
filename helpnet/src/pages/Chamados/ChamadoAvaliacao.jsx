import { Star } from "lucide-react";
import { useState } from "react";
import { chamadosApi } from "../../api/chamadosApi";
import { Button } from "../../components/ui/Button";
import { TextArea } from "../../components/ui/Field";
import { ErrorBanner } from "../../components/ui/Feedback";
import { avaliacaoVisivel, NOTAS, ROTULO_DA_NOTA } from "../../domain/avaliacao";

// =============================================================================
// AVALIAÇÃO DO ATENDIMENTO (RN08)
// =============================================================================
//
// PATCH /chamados/{id}/avaliar — corpo { notaAvaliacao (1..5), comentarioAvaliacao? }.
// O servidor recusa quem não é o solicitante do chamado e chamado que ainda não foi
// encerrado, então a tela só oferece o formulário nas mesmas condições: é o mesmo
// princípio das interações do atendente, a opção não aparece em vez de dar 400.
//
// Uma vez avaliado, vira leitura. O backend aceitaria sobrescrever a nota, mas cada
// avaliação grava um evento na trilha — deixar reeditar encheria o histórico de
// "Chamado avaliado" repetidos sem contar nada novo.

function Estrela({ preenchida }) {
  return (
    <Star
      size={22}
      className={preenchida ? "fill-warning text-warning" : "text-text-faint"}
    />
  );
}

// Leitura: as cinco estrelas continuam desenhadas, só que as não atingidas ficam
// vazias. Mostrar só as estrelas conquistadas esconderia a escala — "3 estrelas" só
// significa alguma coisa ao lado do total.
function NotaLida({ nota }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5" role="img" aria-label={`Nota ${nota} de 5`}>
        {NOTAS.map((n) => (
          <Estrela key={n} preenchida={n <= nota} />
        ))}
      </div>
      <span className="text-sm font-medium text-text">{ROTULO_DA_NOTA[nota]}</span>
    </div>
  );
}

/**
 * Seletor de nota.
 *
 * São radios de verdade, escondidos visualmente: o componente ganha de graça a
 * navegação por setas, o rótulo lido em voz alta e o foco visível pelo teclado, que
 * uma fileira de <button> com aria-pressed teria que reimplementar.
 */
function SeletorDeNota({ nota, onChange, name }) {
  const [previa, setPrevia] = useState(0);
  const referencia = previa || nota;

  return (
    <fieldset onMouseLeave={() => setPrevia(0)}>
      <legend className="mb-1.5 text-sm font-medium text-text-muted">
        Que nota você dá para este atendimento? <span className="text-danger">*</span>
      </legend>

      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {NOTAS.map((n) => (
            <label
              key={n}
              onMouseEnter={() => setPrevia(n)}
              title={ROTULO_DA_NOTA[n]}
              className="cursor-pointer rounded p-0.5 transition-transform hover:scale-110 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input
                type="radio"
                name={name}
                value={n}
                checked={nota === n}
                onChange={() => onChange(n)}
                className="sr-only"
              />
              <span className="sr-only">
                {n} — {ROTULO_DA_NOTA[n]}
              </span>
              <Estrela preenchida={n <= referencia} />
            </label>
          ))}
        </div>

        {/* aria-hidden: o rótulo já vai no texto de cada radio, e o leitor de tela
            anuncia a opção escolhida. Repetir aqui só duplicaria a fala. */}
        <span aria-hidden="true" className="text-sm text-text-muted">
          {referencia ? ROTULO_DA_NOTA[referencia] : "Selecione de 1 a 5"}
        </span>
      </div>
    </fieldset>
  );
}

/**
 * @param {object} props
 * @param {object} props.chamado
 * @param {boolean} [props.somenteLeitura]  visão do atendente: ele lê, não avalia
 * @param {(chamado: object) => void} [props.onAvaliado]  recebe o chamado atualizado
 */
export function ChamadoAvaliacao({ chamado, somenteLeitura = false, onAvaliado }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (!avaliacaoVisivel(chamado)) return null;

  const jaAvaliado = chamado.notaAvaliacao != null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nota || enviando) return;

    setError(null);
    setEnviando(true);
    try {
      const atualizado = await chamadosApi.avaliar(chamado.id, {
        notaAvaliacao: nota,
        comentarioAvaliacao: comentario.trim() || null,
      });
      onAvaliado?.(atualizado);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text">
        <Star size={15} />
        Avaliação do atendimento
      </h3>

      {jaAvaliado ? (
        <>
          <NotaLida nota={chamado.notaAvaliacao} />
          {chamado.comentarioAvaliacao && (
            <p className="rounded-lg border border-border-soft bg-surface-2 px-3 py-2 text-sm whitespace-pre-line text-text-muted">
              {chamado.comentarioAvaliacao}
            </p>
          )}
        </>
      ) : somenteLeitura ? (
        <p className="text-xs text-text-faint">
          O solicitante ainda não avaliou este atendimento.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <SeletorDeNota nota={nota} onChange={setNota} name={`nota-${chamado.id}`} />

          <TextArea
            id={`comentario-${chamado.id}`}
            label="Quer comentar alguma coisa? (opcional)"
            rows={2}
            maxLength={500}
            placeholder="O que funcionou bem, o que poderia ter sido melhor."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />

          <ErrorBanner message={error} />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-text-faint">A avaliação não pode ser alterada depois.</p>
            <Button type="submit" disabled={!nota || enviando}>
              <Star size={15} />
              {enviando ? "Enviando..." : "Enviar avaliação"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
