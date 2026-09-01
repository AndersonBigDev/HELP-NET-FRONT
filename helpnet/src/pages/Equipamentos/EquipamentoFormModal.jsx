import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { ErrorBanner } from "../../components/ui/Feedback";
import { Modal } from "../../components/ui/Modal";
import { optionsOf, Setor, Urgencia } from "../../domain/enums";

const EMPTY = { patrimonio: "", nome: "", marca: "", setorLocalizado: "", urgencia: "" };

// `equipamento` presente => edição (PUT), ausente => cadastro (POST).
// O EquipamentoRequestDTO exige os cinco campos nas duas operações, mas o
// `EquipamentoService.editar` não reaproveita o patrimônio recebido — ele é imutável
// depois do cadastro, então na edição o campo vai bloqueado e só repete o valor atual.
export function EquipamentoFormModal({ open, onClose, equipamento, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(equipamento);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      equipamento
        ? {
            patrimonio: equipamento.patrimonio,
            nome: equipamento.nome,
            marca: equipamento.marca,
            setorLocalizado: equipamento.setorLocalizado ?? "",
            urgencia: equipamento.urgencia ?? "",
          }
        : EMPTY,
    );
  }, [open, equipamento]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        patrimonio: form.patrimonio.trim(),
        nome: form.nome.trim(),
        marca: form.marca.trim(),
        setorLocalizado: form.setorLocalizado,
        urgencia: form.urgencia,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar equipamento" : "Novo equipamento"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="patrimonio"
          label="Patrimônio"
          required
          disabled={isEdit}
          placeholder="Ex: 4521"
          value={form.patrimonio}
          onChange={set("patrimonio")}
          hint={isEdit ? "O patrimônio não muda depois do cadastro." : null}
        />

        <Input
          id="nome"
          label="Nome"
          required
          placeholder="Ex: Notebook Vostro 3520"
          value={form.nome}
          onChange={set("nome")}
        />

        <Input id="marca" label="Marca" required placeholder="Ex: Dell" value={form.marca} onChange={set("marca")} />

        <Select
          id="setorLocalizado"
          label="Setor onde está localizado"
          required
          placeholder="Selecione o setor"
          options={optionsOf(Setor)}
          value={form.setorLocalizado}
          onChange={set("setorLocalizado")}
        />

        {/* A urgência do equipamento é o que define quem pode editá-lo ou inativá-lo
            depois (hierarquia de nível em EquipamentoService). */}
        <Select
          id="urgencia"
          label="Urgência do equipamento"
          required
          placeholder="Selecione a urgência"
          options={optionsOf(Urgencia)}
          value={form.urgencia}
          onChange={set("urgencia")}
        />

        <ErrorBanner message={error} />

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
