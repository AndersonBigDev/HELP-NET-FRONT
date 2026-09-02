import { ChevronDown, Plus, Ticket as TicketIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { chamadosApi } from "../../api/chamadosApi";
import { useAuth } from "../../auth/AuthContext";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataField } from "../../components/ui/DataField";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui/Feedback";
import { Categoria, STATUS_ATIVOS, StatusChamado, Urgencia } from "../../domain/enums";
import { ChamadoAnexos } from "./ChamadoAnexos";
import { avaliacaoVisivel } from "../../domain/avaliacao";
import { ChamadoAvaliacao } from "./ChamadoAvaliacao";
import { ChamadoMensagens } from "./ChamadoMensagens";
import { HistoricoChamado } from "./HistoricoChamado";
import { NovoChamadoModal } from "./NovoChamadoModal";

// O JWT carrega o id do usuário (claim `id`), então a comparação é exata para todos
// os perfis. Antes, o perfil USUARIO caía num casamento por nome — que confunde
// homônimos e quebra se o nome for editado.
function ehMeuChamado(chamado, user) {
  return chamado.solicitanteId === user?.id;
}

// RN05: cada chamado exibe protocolo, dados do solicitante, responsável,
// tipo, prioridade, status e nível exigido.
// Obs: o backend não expõe telefone do solicitante/responsável ainda —
// exibimos "—" nesses campos em vez de inventar dado.
export function MeusChamadosPage() {
  const { user } = useAuth();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandido, setExpandido] = useState(null);
  // A trilha vive no servidor, entao avaliar a deixa velha: o evento "Chamado avaliado"
  // acabou de nascer la e o componente ja tinha carregado. Mesmo mecanismo do detalhe.
  const [versaoTrilha, setVersaoTrilha] = useState(0);

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

  const chamados = useMemo(() => todos.filter((c) => ehMeuChamado(c, user)), [todos, user]);

  // O PATCH de avaliar devolve o chamado ja atualizado, entao trocamos so ele na lista
  // em vez de recarregar as 200 linhas -- e recarregar fecharia o card expandido.
  const aplicarChamado = useCallback((atualizado) => {
    setTodos((lista) => lista.map((c) => (c.id === atualizado.id ? atualizado : c)));
    setVersaoTrilha((v) => v + 1);
  }, []);

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

                    {/* Pausado é o único status em que o chamado está parado por decisão
                        do suporte — o motivo fica na trilha, aqui vai só o aviso. */}
                    {c.status === "PAUSADO" && (
                      <p className="mb-4 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">
                        O atendimento está pausado. O motivo e a previsão estão no histórico abaixo.
                      </p>
                    )}

                    {/* RN08. Fica acima da descricao de proposito: quando o chamado
                        acabou de ser resolvido, avaliar e a unica coisa que sobrou para
                        o solicitante fazer -- enterrar isso depois do historico e da
                        conversa seria esconder a acao atras de duas rolagens. */}
                    {avaliacaoVisivel(c) && (
                      <div className="mb-4 rounded-lg border border-border bg-surface-2 px-4 py-3">
                        <ChamadoAvaliacao chamado={c} onAvaliado={aplicarChamado} />
                      </div>
                    )}

                    <p className="mb-4 text-sm text-text-muted">{c.descricao}</p>
                    <ChamadoAnexos chamadoId={c.id} />

                    {/* Acompanhamento do atendimento em modo leitura: o solicitante vê
                        quem assumiu, quando pausou e o que o suporte registrou. */}
                    <div className="mt-5 border-t border-border-soft pt-4">
                      <HistoricoChamado
                        chamadoId={c.id}
                        recarregarEm={versaoTrilha}
                        avisoLeitura="Registro mantido pelo suporte. Para falar com o atendente, use a conversa abaixo."
                      />
                    </div>

                    {/* RF08: o solicitante conversa com o atendente pelo mesmo fio. */}
                    <div className="mt-5 border-t border-border-soft pt-4">
                      <ChamadoMensagens chamadoId={c.id} somenteLeitura={c.status === "FECHADO"} />
                    </div>
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
