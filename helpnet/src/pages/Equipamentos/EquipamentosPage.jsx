import { HardDrive, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { equipamentosApi } from "../../api/equipamentosApi";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Field";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui/Feedback";
import { optionsOf, Setor, Urgencia } from "../../domain/enums";
import {
  motivoDoBloqueio,
  podeCadastrar,
  podeEditar,
  podeGerenciar,
  podeInativar,
} from "../../domain/equipamentos";
import { useEquipamentos } from "../../hooks/useEquipamentos";
import { useUsuarios } from "../../hooks/useUsuarios";
import { EquipamentoFormModal } from "./EquipamentoFormModal";

// Busca insensível a acento: "impressao" acha "Impressão".
function normalizar(texto) {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function filtrar(equipamentos, { busca, setor, urgencia }) {
  const termo = normalizar(busca.trim());

  return equipamentos.filter((e) => {
    if (setor && e.setorLocalizado !== setor) return false;
    if (urgencia && e.urgencia !== urgencia) return false;
    if (!termo) return true;
    return [e.patrimonio, e.nome, e.marca].some((campo) => normalizar(campo).includes(termo));
  });
}

const FILTROS_VAZIOS = { busca: "", setor: "", urgencia: "" };

// Listagem de equipamentos (GET /equipamentos) com o CRUD que o backend expõe.
// A rota devolve só os ativos e já vem recortada por perfil: ADMIN e ATENDENTE veem o
// parque inteiro, o perfil USUARIO só os equipamentos do próprio setor.
export function EquipamentosPage() {
  const { equipamentos, loading, error, recarregar } = useEquipamentos();
  const { meuPerfil, podeListar, loading: carregandoPerfil } = useUsuarios();

  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [erroAcao, setErroAcao] = useState(null);

  // `meuPerfil` só existe para quem pode ler GET /usuarios (ADMIN/ATENDENTE), que é
  // exatamente quem gerencia equipamentos. Para o perfil USUARIO a tela é só leitura.
  const gerenciando = podeGerenciar(meuPerfil);
  const carregandoPermissoes = podeListar && carregandoPerfil;

  const visiveis = useMemo(() => filtrar(equipamentos, filtros), [equipamentos, filtros]);
  const temFiltro = filtros.busca !== "" || filtros.setor !== "" || filtros.urgencia !== "";

  function set(campo) {
    return (e) => setFiltros((f) => ({ ...f, [campo]: e.target.value }));
  }

  function abrirCadastro() {
    setEditando(null);
    setModalOpen(true);
  }

  function abrirEdicao(equipamento) {
    setEditando(equipamento);
    setModalOpen(true);
  }

  async function salvar(dto) {
    if (editando) {
      await equipamentosApi.editar(editando.id, dto);
    } else {
      await equipamentosApi.criar(dto);
    }
    await recarregar();
  }

  async function inativar(equipamento) {
    const confirmado = confirm(
      `Inativar o equipamento "${equipamento.nome}" (patrimônio ${equipamento.patrimonio})?\n\n` +
        "Ele sai da listagem e deixa de aceitar novos chamados. Os chamados já abertos continuam vinculados.",
    );
    if (!confirmado) return;

    setErroAcao(null);
    try {
      await equipamentosApi.inativar(equipamento.id);
      await recarregar();
    } catch (err) {
      setErroAcao(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Equipamentos</h1>
          <p className="text-sm text-text-muted">
            {visiveis.length} {visiveis.length === 1 ? "equipamento ativo" : "equipamentos ativos"}
            {temFiltro && ` de ${equipamentos.length}`}
            {!gerenciando && !carregandoPermissoes && " · somente os do seu setor"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={recarregar} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Atualizar
          </Button>
          {podeCadastrar(meuPerfil) && (
            <Button onClick={abrirCadastro}>
              <Plus size={16} />
              Novo equipamento
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint"
          />
          <Input
            id="busca"
            placeholder="Buscar por patrimônio, nome ou marca"
            className="pl-9"
            value={filtros.busca}
            onChange={set("busca")}
          />
        </div>
        <Select
          id="filtroSetor"
          placeholder="Todos os setores"
          options={optionsOf(Setor)}
          value={filtros.setor}
          onChange={set("setor")}
        />
        <Select
          id="filtroUrgencia"
          placeholder="Todas as urgências"
          options={optionsOf(Urgencia)}
          value={filtros.urgencia}
          onChange={set("urgencia")}
        />
      </div>

      {erroAcao && (
        <div className="mb-4">
          <ErrorBanner message={erroAcao} />
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {!loading && error && <ErrorBanner message={error} />}

      {!loading && !error && visiveis.length === 0 && (
        <EmptyState
          icon={HardDrive}
          title={temFiltro ? "Nenhum equipamento para esses filtros" : "Nenhum equipamento cadastrado"}
          description={
            temFiltro
              ? "Ajuste a busca ou limpe os filtros para ver mais resultados."
              : gerenciando
                ? "Cadastre o primeiro equipamento para vinculá-lo aos chamados."
                : "Nenhum equipamento ativo no seu setor. Fale com o atendimento para cadastrar."
          }
        />
      )}

      {!loading && !error && visiveis.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-soft text-xs text-text-faint uppercase">
                  <th className="px-4 py-3 font-medium">Patrimônio</th>
                  <th className="px-4 py-3 font-medium">Equipamento</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">Setor</th>
                  <th className="px-4 py-3 font-medium">Urgência</th>
                  {gerenciando && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((e) => {
                  const editavel = podeEditar(meuPerfil, e);
                  const inativavel = podeInativar(meuPerfil, e);

                  return (
                    <tr key={e.id} className="border-b border-border-soft last:border-0">
                      <td className="px-4 py-3 font-mono text-text-muted">{e.patrimonio}</td>
                      <td className="px-4 py-3 text-text">{e.nome}</td>
                      <td className="px-4 py-3 text-text-muted">{e.marca}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {Setor[e.setorLocalizado]?.label ?? e.setorLocalizado ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={Urgencia[e.urgencia]?.color}>
                          {Urgencia[e.urgencia]?.label ?? e.urgencia}
                        </Badge>
                      </td>
                      {gerenciando && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {/* Desabilitado em vez de escondido: a trava de nível fica
                                visível, com o motivo no title. */}
                            <button
                              type="button"
                              onClick={() => abrirEdicao(e)}
                              disabled={!editavel}
                              aria-label="Editar"
                              title={motivoDoBloqueio(meuPerfil, e, "editar") ?? "Editar"}
                              className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-2 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => inativar(e)}
                              disabled={!inativavel}
                              aria-label="Inativar"
                              title={motivoDoBloqueio(meuPerfil, e, "inativar") ?? "Inativar"}
                              className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-2 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <EquipamentoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        equipamento={editando}
        onSubmit={salvar}
      />
    </div>
  );
}
