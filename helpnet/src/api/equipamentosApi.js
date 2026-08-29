import { apiClient } from "./client";

export const equipamentosApi = {
  // Paginado. O recorte por perfil é do backend: ADMIN/ATENDENTE recebem todos os
  // ativos, o perfil USUARIO só os do próprio setor.
  listar: (params) => apiClient.get("/equipamentos", { params }).then((r) => r.data),

  criar: (dto) => apiClient.post("/equipamentos", dto).then((r) => r.data),

  editar: (id, dto) => apiClient.put(`/equipamentos/${id}`, dto).then((r) => r.data),

  // DELETE /equipamentos/{id} é exclusão lógica (`ativo = false`), não remoção.
  inativar: (id) => apiClient.delete(`/equipamentos/${id}`).then((r) => r.data),
};
