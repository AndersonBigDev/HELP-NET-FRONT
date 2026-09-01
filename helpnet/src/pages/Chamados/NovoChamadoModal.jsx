import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { chamadosApi } from "../../api/chamadosApi";
import { equipamentosApi } from "../../api/equipamentosApi";
import { usuariosApi } from "../../api/usuariosApi";
import { useAuth } from "../../auth/AuthContext";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select, TextArea } from "../../components/ui/Field";
import { ErrorBanner } from "../../components/ui/Feedback";
import { Modal } from "../../components/ui/Modal";
import {
  Categoria,
  optionsOf,
  setorDaCategoria,
  Urgencia,
  urgenciaDaCategoria,
  urgenciaEhLivre,
} from "../../domain/enums";
import { formatarDuracao, PRAZO_HORAS_POR_URGENCIA } from "../../domain/sla";

const EMPTY = { categoria: "", urgencia: "", descricao: "", equipamentoId: "", solicitanteId: "" };

const UMA_HORA_MS = 60 * 60 * 1000;

// RF09 — o roteamento automático é decidido no backend a partir da categoria; aqui a
// tela só antecipa o resultado para o solicitante ver o que vai acontecer.
function RoteamentoAutomatico({ categoria }) {
  const urgencia = urgenciaDaCategoria(categoria);
  const setor = setorDaCategoria(categoria);
  if (!urgencia) return null;

  const prazo = PRAZO_HORAS_POR_URGENCIA[urgencia.value];

  return (
    <div className="-mt-1 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-muted">
        <Zap size={13} className="text-accent" />
        Definido automaticamente por esta categoria
      </p>
      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <dt className="text-xs text-text-faint">Urgência</dt>
          <dd>
            <Badge color={urgencia.color}>{urgencia.label}</Badge>
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-xs text-text-faint">Setor</dt>
          <dd className="text-text">{setor?.label ?? "—"}</dd>
        </div>
        {prazo && (
          <div className="flex items-center gap-2">
            <dt className="text-xs text-text-faint">Prazo SLA</dt>
            <dd className="text-text">{formatarDuracao(prazo * UMA_HORA_MS)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// RF05 (abertura pelo próprio usuário) / RF06 (abertura em nome de outro,
// exclusiva de Atendente/Admin) / RN04 (limite de 3 chamados ativos,
// validado no backend — aqui só repassamos o erro de forma amigável).
export function NovoChamadoModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const podeAbrirProxy = user?.perfil === "ATENDENTE" || user?.perfil === "ADMIN";

  const [form, setForm] = useState(EMPTY);
  const [modoProxy, setModoProxy] = useState(false);
  const [usuariosComuns, setUsuariosComuns] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
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

  // O chamado passou a referenciar o equipamento por id (`ChamadoCreateDTO.equipamentoId`),
  // não mais por texto livre. A rota devolve só equipamentos ativos, já recortados pelo
  // perfil de quem está logado.
  useEffect(() => {
    if (!open) return;
    equipamentosApi
      .listar({ size: 200, sort: "nome" })
      .then((page) => setEquipamentos(page.content ?? []))
      .catch((err) => setError(err.message));
  }, [open]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  const urgenciaLivre = urgenciaEhLivre(form.categoria);
  const urgenciaAutomatica = urgenciaDaCategoria(form.categoria);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await chamadosApi.criar({
        categoria: form.categoria,
        // O DTO exige `urgencia` mesmo quando o backend vai sobrescrevê-la pela
        // urgência padrão da categoria — só OUTROS usa de fato o valor enviado.
        urgencia: urgenciaAutomatica ? urgenciaAutomatica.value : form.urgencia,
        descricao: form.descricao,
        equipamentoId: form.equipamentoId ? Number(form.equipamentoId) : null,
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
              className={`flex-1 cursor-pointer rounded-md py-1.5 font-medium ${!modoProxy ? "bg-accent text-white" : "text-text-muted"}`}
            >
              Abrir para mim
            </button>
            <button
              type="button"
              onClick={() => setModoProxy(true)}
              className={`flex-1 cursor-pointer rounded-md py-1.5 font-medium ${modoProxy ? "bg-accent text-white" : "text-text-muted"}`}
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

        {urgenciaLivre ? (
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
          <RoteamentoAutomatico categoria={form.categoria} />
        )}

        <TextArea
          id="descricao"
          label="Descrição"
          required
          placeholder="Descreva o problema com o máximo de detalhes"
          value={form.descricao}
          onChange={set("descricao")}
        />

        <Select
          id="equipamentoId"
          label="Equipamento (opcional)"
          placeholder={equipamentos.length === 0 ? "Nenhum equipamento ativo disponível" : "Sem equipamento"}
          disabled={equipamentos.length === 0}
          options={equipamentos.map((eq) => ({
            value: String(eq.id),
            label: `${eq.nome} · ${eq.marca} · patrimônio ${eq.patrimonio}`,
          }))}
          value={form.equipamentoId}
          onChange={set("equipamentoId")}
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
