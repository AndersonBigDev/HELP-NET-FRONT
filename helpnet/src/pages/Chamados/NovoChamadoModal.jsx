import { useEffect, useState } from "react";
import { chamadosApi } from "../../api/chamadosApi";
import { usuariosApi } from "../../api/usuariosApi";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input, Select, TextArea } from "../../components/ui/Field";
import { ErrorBanner } from "../../components/ui/Feedback";
import { Modal } from "../../components/ui/Modal";
import { Categoria, optionsOf, Urgencia } from "../../domain/enums";

const EMPTY = { categoria: "", urgencia: "", descricao: "", equipamento: "", solicitanteId: "" };

// RF05 (abertura pelo próprio usuário) / RF06 (abertura em nome de outro,
// exclusiva de Atendente/Admin) / RN04 (limite de 3 chamados ativos,
// validado no backend — aqui só repassamos o erro de forma amigável).
export function NovoChamadoModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const podeAbrirProxy = user?.perfil === "ATENDENTE" || user?.perfil === "ADMIN";

  const [form, setForm] = useState(EMPTY);
  const [modoProxy, setModoProxy] = useState(false);
  const [usuariosComuns, setUsuariosComuns] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setModoProxy(false);
    setForm(EMPTY);
  }, [open]);

  useEffect(() => {
    if (!open || !podeAbrirProxy || !modoProxy) return;
    usuariosApi
      .listar({ size: 200, sort: "nome" })
      .then((page) => setUsuariosComuns((page.content ?? []).filter((u) => u.perfil === "USUARIO")))
      .catch((err) => setError(err.message));
  }, [open, podeAbrirProxy, modoProxy]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  const categoriaSelecionada = form.categoria ? Categoria[form.categoria] : null;
  const urgenciaAutomatica = categoriaSelecionada && categoriaSelecionada.value !== "OUTROS";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await chamadosApi.criar({
        categoria: form.categoria,
        urgencia: urgenciaAutomatica ? categoriaSelecionada.urgenciaPadrao : form.urgencia,
        descricao: form.descricao,
        equipamento: form.equipamento || null,
        solicitanteId: modoProxy && form.solicitanteId ? Number(form.solicitanteId) : null,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Abrir chamado">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {podeAbrirProxy && (
          <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1 text-sm">
            <button
              type="button"
              onClick={() => setModoProxy(false)}
              className={`flex-1 rounded-md py-1.5 font-medium cursor-pointer ${!modoProxy ? "bg-accent text-white" : "text-text-muted"}`}
            >
              Abrir para mim
            </button>
            <button
              type="button"
              onClick={() => setModoProxy(true)}
              className={`flex-1 rounded-md py-1.5 font-medium cursor-pointer ${modoProxy ? "bg-accent text-white" : "text-text-muted"}`}
            >
              Abrir em nome de
            </button>
          </div>
        )}

        {modoProxy && (
          <Select
            id="solicitanteId"
            label="Usuário solicitante"
            required
            placeholder="Selecione o usuário"
            options={usuariosComuns.map((u) => ({ value: String(u.id), label: `${u.nome} (${u.email})` }))}
            value={form.solicitanteId}
            onChange={set("solicitanteId")}
          />
        )}

        <Select
          id="categoria"
          label="Categoria"
          required
          placeholder="Selecione a categoria"
          options={optionsOf(Categoria)}
          value={form.categoria}
          onChange={set("categoria")}
        />

        {form.categoria === "OUTROS" ? (
          <Select
            id="urgencia"
            label="Urgência"
            required
            placeholder="Selecione a urgência"
            options={optionsOf(Urgencia)}
            value={form.urgencia}
            onChange={set("urgencia")}
          />
        ) : (
          categoriaSelecionada && (
            <p className="-mt-2 text-xs text-text-faint">
              Urgência definida automaticamente: <strong className="text-text-muted">{Urgencia[categoriaSelecionada.urgenciaPadrao].label}</strong>
            </p>
          )
        )}

        <TextArea
          id="descricao"
          label="Descrição"
          required
          placeholder="Descreva o problema com o máximo de detalhes"
          value={form.descricao}
          onChange={set("descricao")}
        />

        <Input
          id="equipamento"
          label="Equipamento (opcional)"
          placeholder="Ex: Notebook patrimônio 4521"
          value={form.equipamento}
          onChange={set("equipamento")}
        />

        <ErrorBanner message={error} />

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Abrindo..." : "Abrir chamado"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
