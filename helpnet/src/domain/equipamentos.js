// Espelha as travas de `EquipamentoService` (validarAcesso e
// validarPermissaoHierarquica). Quem valida de verdade é o backend — isto existe só
// para a tela não oferecer um botão que voltaria BusinessException.
//
// Regras:
//   - perfil USUARIO não gerencia nada (só enxerga a listagem do próprio setor);
//   - Nível I não cadastra nem inativa, qualquer que seja a urgência;
//   - ADMIN e Nível III alcançam qualquer urgência;
//   - Nível I só alcança urgência NORMAL; Nível II, NORMAL e MÉDIA.

import { NivelAtendente, Urgencia } from "./enums";

const URGENCIAS_FORA_DO_ALCANCE = {
  NIVEL_I: ["MEDIA", "ALTA", "CRITICA"],
  NIVEL_II: ["ALTA", "CRITICA"],
};

function alcancaUrgencia(usuario, urgencia) {
  if (usuario.perfil === "ADMIN") return true;
  return !(URGENCIAS_FORA_DO_ALCANCE[usuario.nivelAntendente] ?? []).includes(urgencia);
}

// Nível I é barrado antes mesmo da checagem de urgência nessas duas ações.
function nivelUmSemPoderDeCriacao(usuario) {
  return usuario.perfil !== "ADMIN" && usuario.nivelAntendente === "NIVEL_I";
}

export function podeGerenciar(usuario) {
  return Boolean(usuario) && usuario.perfil !== "USUARIO";
}

export function podeCadastrar(usuario) {
  return podeGerenciar(usuario) && !nivelUmSemPoderDeCriacao(usuario);
}

export function podeEditar(usuario, equipamento) {
  return podeGerenciar(usuario) && alcancaUrgencia(usuario, equipamento.urgencia);
}

export function podeInativar(usuario, equipamento) {
  return (
    podeGerenciar(usuario) &&
    !nivelUmSemPoderDeCriacao(usuario) &&
    alcancaUrgencia(usuario, equipamento.urgencia)
  );
}

// Texto do `title` no botão desabilitado — explica a trava em vez de só apagar a ação.
export function motivoDoBloqueio(usuario, equipamento, acao) {
  if (!podeGerenciar(usuario)) return "Somente atendentes e administradores gerenciam equipamentos.";

  if (nivelUmSemPoderDeCriacao(usuario) && acao !== "editar") {
    return `Atendentes ${NivelAtendente.NIVEL_I.label} não podem ${acao} equipamentos.`;
  }

  if (equipamento && !alcancaUrgencia(usuario, equipamento.urgencia)) {
    const nivel = NivelAtendente[usuario.nivelAntendente]?.label ?? "Seu nível";
    const urgencia = Urgencia[equipamento.urgencia]?.label ?? equipamento.urgencia;
    return `${nivel} não alcança equipamentos de urgência ${urgencia}.`;
  }

  return null;
}
