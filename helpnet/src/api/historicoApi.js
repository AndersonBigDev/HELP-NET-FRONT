import { apiClient } from "./client";

// =============================================================================
// TRILHA DE HISTÓRICO DO CHAMADO
//
// Backend: ChamadoController (`/chamados/{id}/historico`) → ChamadoService →
// HistoricoChamadoService. A tabela é `tab_chamado_historico`.
//
// A trilha é append-only: não existe PUT nem DELETE de propósito. O valor dela está
// em provar o que aconteceu no atendimento, então evento gravado não é editado.
//
// -----------------------------------------------------------------------------
// GET /chamados/{chamadoId}/historico
// -----------------------------------------------------------------------------
// Resposta 200 — array em ordem cronológica (mais antigo primeiro):
//
// [
//   {
//     "id": 12,
//     "chamadoId": 1,
//     "autorId": 3,                       // quem executou a ação
//     "autorNome": "Maria Atendente",
//     "autorEmail": "maria@helpdesk.com",
//     "autorPerfil": "ATENDENTE",         // USUARIO | ATENDENTE | ADMIN
//     "autorNivel": "NIVEL_II",           // null quando o autor não é atendente
//     "tipo": "PAUSA",                    // ver TipoEventoChamado em domain/enums.js
//     "tipoDescricao": "Atendimento pausado",
//     "descricao": "Aguardando a peça de reposição chegar.",
//     "statusAnterior": "EM_ANDAMENTO",   // null em ANOTACAO e AVALIACAO
//     "statusNovo": "PAUSADO",
//     "nivelAnterior": null,              // preenchidos só no escalonamento
//     "nivelNovo": null,
//     "responsavelId": 3,                 // quem atendia o chamado NAQUELE momento
//     "responsavelNome": "Maria Atendente",
//     "dataEvento": "2026-09-01T09:12:44.31"
//   }
// ]
//
// `responsavelId`/`responsavelNome` são o retrato do responsável no instante do
// evento, não o responsável atual — é o que permite ler a trilha de um chamado que
// trocou de atendente sem atribuir tudo ao último deles.
//
// -----------------------------------------------------------------------------
// POST /chamados/{chamadoId}/historico
// -----------------------------------------------------------------------------
// Corpo:    { "descricao": "texto" }   obrigatório, não-vazio, máx. 2000 chars
// Resposta: 201 com o evento acima, tipo "ANOTACAO"
//
// Anotação é o registro do que foi feito sem mexer no status. Só ATENDENTE/ADMIN
// escrevem (o SecurityConfig já barra o perfil USUARIO); chamado FECHADO recusa
// novas anotações com 400.
//
// -----------------------------------------------------------------------------
// QUEM ENXERGA
// -----------------------------------------------------------------------------
// A leitura usa a mesma regra do chamado (ChamadoService.validarPermissaoAcessoChamado):
// solicitante dono, atendente com nível >= nivelExigido, ou ADMIN. O solicitante
// acompanha o próprio atendimento em modo leitura.
//
// Os demais eventos (abertura, atribuição, pausa, retomada, escalonamento, resolução,
// reabertura, avaliação) o servidor grava sozinho, dentro da transação da ação que os
// originou — o front nunca os cria.
// =============================================================================

export const historicoApi = {
  listar: (chamadoId) =>
    apiClient.get(`/chamados/${chamadoId}/historico`).then((r) => r.data),

  registrar: (chamadoId, descricao) =>
    apiClient.post(`/chamados/${chamadoId}/historico`, { descricao }).then((r) => r.data),
};
