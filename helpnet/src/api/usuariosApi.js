import { apiClient } from "./client";

export const usuariosApi = {
  listar: (params) => apiClient.get("/usuarios", { params }).then((r) => r.data),

  criar: (dto) => apiClient.post("/usuarios", dto).then((r) => r.data),

  editar: (id, dto) => apiClient.put(`/usuarios/${id}`, dto).then((r) => r.data),

  deletar: (id) => apiClient.delete(`/usuarios/${id}`).then((r) => r.data),

  completarPerfil: (dto) =>
    apiClient.patch("/usuarios/complementar-perfil", dto).then((r) => r.data),

  complementarPerfilPorId: (id, dto) =>
    apiClient.patch(`/usuarios/${id}/complementar-perfil`, dto).then((r) => r.data),
};
