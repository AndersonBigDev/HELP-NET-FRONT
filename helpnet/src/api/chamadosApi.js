import { apiClient } from "./client";

export const chamadosApi = {
  listar: (params) => apiClient.get("/chamados", { params }).then((r) => r.data),

  criar: (dto) => apiClient.post("/chamados", dto).then((r) => r.data),

  escalonar: (id, dto) =>
    apiClient.post(`/chamados/${id}/escalonar`, dto).then((r) => r.data),
};
