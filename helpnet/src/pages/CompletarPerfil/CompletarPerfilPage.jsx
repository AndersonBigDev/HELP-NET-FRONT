import { UserCog } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usuariosApi } from "../../api/usuariosApi";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Field";
import { ErrorBanner } from "../../components/ui/Feedback";
import { optionsOf, Setor } from "../../domain/enums";

// RF02 / RN03: complemento obrigatório de cargo e setor no 1º acesso.
// Enquanto isso não é feito, o ProtectedRoute mantém o usuário preso aqui.
export function CompletarPerfilPage() {
  const { markCadastroCompleto } = useAuth();
  const navigate = useNavigate();
  const [cargo, setCargo] = useState("");
  const [setor, setSetor] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await usuariosApi.completarPerfil({ cargo, setor });
      markCadastroCompleto();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <UserCog size={26} />
          </span>
          <h1 className="text-xl font-semibold text-text">Complete seu cadastro</h1>
          <p className="text-sm text-text-muted">
            Precisamos do seu cargo e setor antes de liberar o sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="cargo"
            label="Cargo"
            required
            placeholder="Ex: Analista Financeiro"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
          />
          <Select
            id="setor"
            label="Setor"
            required
            placeholder="Selecione seu setor"
            options={optionsOf(Setor)}
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
          />

          <ErrorBanner message={error} />

          <Button type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? "Salvando..." : "Concluir cadastro"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
