import { ArrowUpCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { chamadosApi } from "../../api/chamadosApi";
import { Button } from "../../components/ui/Button";
import { TextArea } from "../../components/ui/Field";
import { ErrorBanner } from "../../components/ui/Feedback";
import { Modal } from "../../components/ui/Modal";
import { NivelAtendente, niveisAcimaDe } from "../../domain/enums";

// RF12 — escalonamento N1 → N2 → N3.
// RN06 — sem downgrade: só listamos níveis acima do atual, então rebaixar nem aparece
//        como opção (o backend também rejeita, aqui a UI não chega a oferecer).
// RN07 — "Confirmar Escalonamento" só habilita com justificativa preenchida.
export function EscalonarModal({ open, onClose, chamado, onEscalonado }) {
  const [novoNivel, setNovoNivel] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const opcoes = niveisAcimaDe(chamado?.nivelExigido);
  const noNivelMaximo = opcoes.length === 0;
  const justificativaValida = justificativa.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    setNovoNivel("");
    setJustificativa("");
    setError(null);
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await chamadosApi.escalonar(chamado.id, { novoNivel, justificativa: justificativa.trim() });
      onEscalonado?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Escalonar chamado">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
          <span className="text-text-muted">Nível atual: </span>
          <strong className="text-text">
            {NivelAtendente[chamado?.nivelExigido]?.label ?? "—"}
          </strong>
        </div>

        {noNivelMaximo ? (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-muted">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-success" />
            <span>
              Este chamado já está no nível máximo de atendimento. O fluxo só permite
              elevação de nível, então não há para onde escalonar.
            </span>
          </div>
        ) : (
          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-text-muted">
              Escalonar para <span className="text-danger">*</span>
            </legend>
            <div className="flex flex-col gap-2">
              {opcoes.map((nivel) => (
                <label
                  key={nivel.value}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    novoNivel === nivel.value
                      ? "border-accent bg-accent-soft text-text"
                      : "border-border bg-surface-2 text-text-muted hover:text-text"
                  }`}
                >
                  <input
                    type="radio"
                    name="novoNivel"
                    value={nivel.value}
                    checked={novoNivel === nivel.value}
                    onChange={(e) => setNovoNivel(e.target.value)}
                    className="accent-accent"
                  />
                  <ArrowUpCircle size={16} />
                  {nivel.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <TextArea
          id="justificativa"
          label="Justificativa"
          required
          rows={4}
          placeholder="Explique por que o chamado precisa subir de nível."
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          disabled={noNivelMaximo}
          error={justificativa.length > 0 && !justificativaValida ? "A justificativa não pode ser só espaços." : null}
        />

        <ErrorBanner message={error} />

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={noNivelMaximo || !novoNivel || !justificativaValida || loading}>
            {loading ? "Escalonando..." : "Confirmar Escalonamento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
