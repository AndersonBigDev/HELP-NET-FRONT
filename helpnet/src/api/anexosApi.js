import { apiClient } from "./client";

export const anexosApi = {
  listar: (chamadoId) =>
    apiClient.get(`/chamados/${chamadoId}/anexos`).then((r) => r.data),

  upload: (chamadoId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient
      .post(`/chamados/${chamadoId}/anexos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  download: (anexoId) =>
    apiClient
      .get(`/anexos/${anexoId}/download`, { responseType: "blob" })
      .then((r) => r.data),

  deletar: (chamadoId, anexoId) =>
    apiClient
      .delete(`/chamados/${chamadoId}/anexos/${anexoId}`)
      .then((r) => r.data),
};
