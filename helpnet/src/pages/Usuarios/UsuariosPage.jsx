import { Pencil, Plus, Trash2, Users as UsersIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { usuariosApi } from "../../api/usuariosApi";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui/Feedback";
import { NivelAtendente, Perfil, Setor } from "../../domain/enums";
import { UsuarioFormModal } from "./UsuarioFormModal";

// RF03: listagem agrupada por cargo e perfil. Agrupamos por perfil (seções)
// e ordenamos por cargo dentro de cada seção.
function agruparPorPerfil(usuarios) {
  const grupos = { ADMIN: [], ATENDENTE: [], USUARIO: [] };
  for (const u of usuarios) {
    (grupos[u.perfil] ??= []).push(u);
  }
  for (const lista of Object.values(grupos)) {
    lista.sort((a, b) => (a.cargo ?? "").localeCompare(b.cargo ?? ""));
  }
  return grupos;
}

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await usuariosApi.listar({ size: 200, sort: "nome" });
      setUsuarios(page.content ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleCreate(dto) {
    await usuariosApi.criar(dto);
    await carregar();
  }

  async function handleEdit(dto) {
    await usuariosApi.editar(editing.id, dto);
    await carregar();
  }

  async function handleDelete(usuario) {
    if (!confirm(`Excluir o usuário "${usuario.nome}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await usuariosApi.deletar(usuario.id);
      await carregar();
    } catch (err) {
      alert(err.message);
    }
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(usuario) {
    setEditing(usuario);
    setModalOpen(true);
  }

  const grupos = agruparPorPerfil(usuarios);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Usuários</h1>
          <p className="text-sm text-text-muted">Gestão de contas, setor e nível de atendimento.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Novo usuário
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {!loading && error && <ErrorBanner message={error} />}

      {!loading && !error && usuarios.length === 0 && (
        <EmptyState
          icon={UsersIcon}
          title="Nenhum usuário cadastrado"
          description="Crie o primeiro usuário para começar."
        />
      )}

      {!loading &&
        !error &&
        Object.entries(grupos).map(([perfil, lista]) =>
          lista.length === 0 ? null : (
            <section key={perfil} className="mb-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-faint">
                {Perfil[perfil]?.label ?? perfil} · {lista.length}
              </h2>
              <Card className="p-0 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border-soft text-xs uppercase text-text-faint">
                      <th className="px-4 py-3 font-medium">Nome</th>
                      <th className="px-4 py-3 font-medium">E-mail</th>
                      <th className="px-4 py-3 font-medium">Cargo</th>
                      <th className="px-4 py-3 font-medium">Setor</th>
                      {perfil === "ATENDENTE" && <th className="px-4 py-3 font-medium">Nível</th>}
                      <th className="px-4 py-3 font-medium">Cadastro</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((u) => (
                      <tr key={u.id} className="border-b border-border-soft last:border-0">
                        <td className="px-4 py-3 text-text">{u.nome}</td>
                        <td className="px-4 py-3 text-text-muted">{u.email}</td>
                        <td className="px-4 py-3 text-text-muted">{u.cargo || "—"}</td>
                        <td className="px-4 py-3 text-text-muted">{Setor[u.setor]?.label ?? "—"}</td>
                        {perfil === "ATENDENTE" && (
                          <td className="px-4 py-3 text-text-muted">
                            {NivelAtendente[u.nivelAntendente]?.label ?? "—"}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <Badge color={u.cadastroCompleto ? "success" : "warning"}>
                            {u.cadastroCompleto ? "Completo" : "Pendente"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              aria-label="Editar"
                              className="rounded-md p-1.5 text-text-muted hover:bg-surface-2 hover:text-accent cursor-pointer"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(u)}
                              aria-label="Excluir"
                              className="rounded-md p-1.5 text-text-muted hover:bg-surface-2 hover:text-danger cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </section>
          ),
        )}

      <UsuarioFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        usuario={editing}
        onSubmit={editing ? handleEdit : handleCreate}
      />
    </div>
  );
}
