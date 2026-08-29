import { ChevronDown, Plus, Ticket as TicketIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { chamadosApi } from "../../api/chamadosApi";
import { useAuth } from "../../auth/AuthContext";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataField } from "../../components/ui/DataField";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui/Feedback";
import { Categoria, StatusChamado, Urgencia } from "../../domain/enums";
import { useUsuarios } from "../../hooks/useUsuarios";
import { ChamadoAnexos } from "./ChamadoAnexos";
import { NovoChamadoModal } from "./NovoChamadoModal";

const STATUS_ATIVOS = ["ABERTO", "EM_ANDAMENTO"];

// O ChamadoResponseDTO identifica o solicitante por `solicitanteId`/`solicitanteNome`
// e não devolve mais o e-mail. O JWT também não carrega o id do usuário e o GET
// /usuarios é bloqueado para o perfil USUARIO, então nesse perfil não há como resolver
// o próprio id: caímos no nome, que é o único identificador que o token traz.
// ATENDENTE e ADMIN conseguem ler a lista de usuários e comparam pelo id, que é exato.
function ehMeuChamado(chamado, user, meuId) {
  if (meuId != null) return chamado.solicitanteId === meuId;
  return chamado.solicitanteNome === user.nome;
}

// RN05: cada chamado exibe protocolo, dados do solicitante, responsável,
// tipo, prioridade, status e nível exigido.
// Obs: o backend não expõe telefone do solicitante/responsável ainda —
// exibimos "—" nesses campos em vez de inventar dado.
export function MeusChamadosPage() {
  const { user } = useAuth();
  const { meuPerfil } = useUsuarios();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandido, setExpandido] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /chamados não filtra por solicitante — filtramos no client.
      const page = await chamadosApi.listar({ size: 200 });
      const lista = [...(page.content ?? [])];
      lista.sort((a, b) => new Date(b.dataAbertura) - new Date(a.dataAbertura));
      setTodos(lista);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Derivado (e não filtrado dentro do `carregar`) porque `meuPerfil` chega depois da
  // primeira busca: assim a lista se corrige sozinha quando o id resolve.
  const chamados = useMemo(
    () => todos.filter((c) => ehMeuChamado(c, user, meuPerfil?.id)),
    [todos, user, meuPerfil],
  );

  const ativos = chamados.filter((c) => STATUS_ATIVOS.includes(c.status)).length;
  const limiteAtingido = ativos >= 3;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Meus Chamados</h1>
          <p className="text-sm text-text-muted">
            {ativos}/3 chamados ativos no momento
            {limiteAtingido && " — limite atingido, aguarde a resolução de um chamado."}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={limiteAtingido}>
          <Plus size={16} />
          Abrir chamado
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {!loading && error && <ErrorBanner message={error} />}

      {!loading && !error && chamados.length === 0 && (
        <EmptyState
          icon={TicketIcon}
          title="Nenhum chamado aberto"
          description="Quando você abrir um chamado, ele aparece aqui."
        />
      )}

      <div className="flex flex-col gap-3">
        {!loading &&
          !error &&
          chamados.map((c) => {
            const aberto = expandido === c.id;
            return (
              <Card key={c.id} className="overflow-hidden p-0">
                <button
                  type="button"
                  onClick={() => setExpandido(aberto ? null : c.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-text-muted">{c.protocolo}</span>
                      <Badge color={StatusChamado[c.status]?.color}>{StatusChamado[c.status]?.label}</Badge>
                      <Badge color={Urgencia[c.urgencia]?.color}>{Urgencia[c.urgencia]?.label}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-text">{Categoria[c.categoria]?.label ?? c.categoria}</p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-text-faint transition-transform ${aberto ? "rotate-180" : ""}`}
                  />
                </button>

                {aberto && (
                  <div className="border-t border-border-soft px-5 py-4">
                    <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                      <DataField label="Solicitante" value={c.solicitanteNome} />
                      <DataField label="E-mail" value={user.email} />
                      <DataField label="Telefone" value="—" />
                      <DataField label="Responsável" value={c.responsavelNome} />
                      <DataField label="Nível exigido" value={c.nivelExigido} />
                      <DataField label="Equipamento" value={c.equipamentoNome} />
                      <DataField label="Aberto em" value={new Date(c.dataAbertura).toLocaleString("pt-BR")} />
                    </dl>
                    <p className="mb-4 text-sm text-text-muted">{c.descricao}</p>
                    <ChamadoAnexos chamadoId={c.id} />
                  </div>
                )}
              </Card>
            );
          })}
      </div>

      <NovoChamadoModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={carregar} />
    </div>
  );
}
