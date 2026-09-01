import { LifeBuoy } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Field";
import { ErrorBanner } from "../../components/ui/Feedback";
import { SeletorTema } from "../../components/ui/SeletorTema";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, senha);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-canvas px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <LifeBuoy size={26} />
          </span>
          <h1 className="text-xl font-semibold text-text">Entrar no HelpNet</h1>
          <p className="text-sm text-text-muted">
            Use seu e-mail corporativo (@helpdesk.com)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            label="E-mail"
            type="email"
            required
            autoComplete="username"
            placeholder="voce@helpdesk.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="senha"
            label="Senha"
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <ErrorBanner message={error} />

          <Button type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>

      {/* Deixa trocar claro/escuro antes de entrar. O acento fica só na barra
          lateral, para não poluir a tela de login. */}
      <div className="w-52">
        <SeletorTema compacto />
      </div>
    </div>
  );
}
