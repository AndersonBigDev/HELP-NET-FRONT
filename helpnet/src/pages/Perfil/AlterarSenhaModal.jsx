import { useEffect, useState } from "react";
import { usuariosApi } from "../../api/usuariosApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { ErrorBanner } from "../../components/ui/Feedback";
import { Modal } from "../../components/ui/Modal";

// =============================================================================
// TROCA DE SENHA (RF03) — UI
//
// >>> BACKEND: o contrato HTTP está documentado em src/api/usuariosApi.js,
// >>> nas funções alterarMinhaSenha e redefinirSenha.
// =============================================================================

// Espelha a validação esperada no backend. O servidor continua sendo a autoridade —
// isto só evita um round-trip para erro óbvio.
const TAMANHO_MINIMO = 6;

// Enquanto o backend não expõe as rotas de senha, elas voltam 404.
const AVISO_SEM_BACKEND =
  "A troca de senha ainda não está disponível: o servidor não expõe este recurso. " +
  "Aguardando a implementação de PATCH /usuarios/me/senha no backend.";

/**
 * Troca de senha.
 *
 * Sem `usuario`: o próprio usuário logado troca a senha e precisa informar a atual
 * (PATCH /usuarios/me/senha).
 * Com `usuario`: reset administrativo daquela conta, sem pedir a senha atual
 * (PATCH /usuarios/{id}/senha) — o backend restringe essa rota ao perfil ADMIN.
 */
export function AlterarSenhaModal({ open, onClose, usuario = null, onAlterada }) {
  const modoReset = usuario != null;

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Limpa o formulário a cada abertura para a senha digitada não sobreviver ao
  // fechamento do modal.
  useEffect(() => {
    if (open) {
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (novaSenha.length < TAMANHO_MINIMO) {
      setError(`A nova senha deve ter ao menos ${TAMANHO_MINIMO} caracteres.`);
      return;
    }
    if (novaSenha !== confirmacao) {
      setError("A confirmação não confere com a nova senha.");
      return;
    }
    if (!modoReset && novaSenha === senhaAtual) {
      setError("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      if (modoReset) {
        await usuariosApi.redefinirSenha(usuario.id, novaSenha);
      } else {
        await usuariosApi.alterarMinhaSenha(senhaAtual, novaSenha);
      }
      onAlterada?.();
      onClose();
    } catch (err) {
      setError(err.status === 404 ? AVISO_SEM_BACKEND : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modoReset ? `Redefinir senha de ${usuario.nome}` : "Alterar minha senha"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {modoReset ? (
          <p className="text-sm text-text-muted">
            A nova senha passa a valer imediatamente. Combine com a pessoa como ela vai
            receber essa senha — o sistema não envia aviso.
          </p>
        ) : (
          <Input
            id="senhaAtual"
            type="password"
            label="Senha atual"
            required
            autoComplete="current-password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
          />
        )}

        <Input
          id="novaSenha"
          type="password"
          label="Nova senha"
          required
          autoComplete="new-password"
          hint={`Mínimo de ${TAMANHO_MINIMO} caracteres.`}
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />

        <Input
          id="confirmacao"
          type="password"
          label="Confirme a nova senha"
          required
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
        />

        <ErrorBanner message={error} />

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : modoReset ? "Redefinir senha" : "Alterar senha"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
