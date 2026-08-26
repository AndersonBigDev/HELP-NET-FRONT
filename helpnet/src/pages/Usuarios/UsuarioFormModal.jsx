import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { ErrorBanner } from "../../components/ui/Feedback";
import { Modal } from "../../components/ui/Modal";
import { NivelAtendente, optionsOf, Perfil, Setor } from "../../domain/enums";

const EMPTY = { nome: "", email: "", senha: "", cargo: "", setor: "", perfil: "USUARIO", nivelAntendente: "" };

// RF04: criação de usuários e edição de e-mail/setor/cargo pelo Atendente
// Nível II/III. `usuario` presente => modo edição (PUT), ausente => criação (POST).
export function UsuarioFormModal({ open, onClose, usuario, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(usuario);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      usuario
        ? {
            nome: usuario.nome,
            email: usuario.email,
            senha: "",
            cargo: usuario.cargo ?? "",
            setor: usuario.setor ?? "",
            perfil: usuario.perfil,
            nivelAntendente: usuario.nivelAntendente ?? "",
          }
        : EMPTY,
    );
  }, [open, usuario]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isEdit) {
        await onSubmit({
          nome: form.nome,
          email: form.email,
          cargo: form.cargo || null,
          setor: form.setor || null,
          nivelAntendente: form.perfil === "ATENDENTE" ? form.nivelAntendente || null : null,
        });
      } else {
        await onSubmit({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          perfil: form.perfil,
          nivelAntendente: form.perfil === "ATENDENTE" ? form.nivelAntendente || null : null,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar usuário" : "Novo usuário"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="nome" label="Nome" required value={form.nome} onChange={set("nome")} />
        <Input id="email" label="E-mail" type="email" required value={form.email} onChange={set("email")} />

        {!isEdit && (
          <Input
            id="senha"
            label="Senha provisória"
            type="password"
            required
            value={form.senha}
            onChange={set("senha")}
          />
        )}

        {!isEdit && (
          <Select
            id="perfil"
            label="Perfil"
            required
            options={optionsOf(Perfil)}
            value={form.perfil}
            onChange={set("perfil")}
          />
        )}

        {isEdit && <Input id="cargo" label="Cargo" value={form.cargo} onChange={set("cargo")} />}
        {isEdit && (
          <Select
            id="setor"
            label="Setor"
            placeholder="Sem setor"
            options={optionsOf(Setor)}
            value={form.setor}
            onChange={set("setor")}
          />
        )}

        {form.perfil === "ATENDENTE" && (
          <Select
            id="nivelAntendente"
            label="Nível do atendente"
            required
            placeholder="Selecione o nível"
            options={optionsOf(NivelAtendente)}
            value={form.nivelAntendente}
            onChange={set("nivelAntendente")}
          />
        )}

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
