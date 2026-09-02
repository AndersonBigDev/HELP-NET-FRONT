import { apiClient } from "./client";

export const chamadosApi = {
  listar: (params) => apiClient.get("/chamados", { params }).then((r) => r.data),

  // O detalhe do chamado tem rota própria no backend, com a mesma regra de
  // visibilidade da listagem: solicitante dono, atendente de nível suficiente ou ADMIN.
  buscarPorId: (id) => apiClient.get(`/chamados/${id}`).then((r) => r.data),

  criar: (dto) => apiClient.post("/chamados", dto).then((r) => r.data),

  escalonar: (id, dto) =>
    apiClient.post(`/chamados/${id}/escalonar`, dto).then((r) => r.data),

  // Passa o chamado para o atendente logado (e move ABERTO -> EM_ANDAMENTO).
  assumir: (id) => apiClient.patch(`/chamados/${id}/assumir`).then((r) => r.data),

  // dto: { status, descricaoResolucao?, justificativaReabertura?, observacao? }
  // Ver `camposDaTransicao` em src/domain/enums.js para o que cada transição exige.
  alterarStatus: (id, dto) =>
    apiClient.patch(`/chamados/${id}/status`, dto).then((r) => r.data),

  // dto: { notaAvaliacao, comentarioAvaliacao? } — só o solicitante, só após encerrado.
  avaliar: (id, dto) => apiClient.patch(`/chamados/${id}/avaliar`, dto).then((r) => r.data),
};
