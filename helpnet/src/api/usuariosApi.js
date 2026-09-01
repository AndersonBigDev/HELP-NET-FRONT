import { apiClient } from "./client";

export const usuariosApi = {
  listar: (params) => apiClient.get("/usuarios", { params }).then((r) => r.data),

  // Perfil do próprio usuário logado — liberado a qualquer autenticado, ao
  // contrário de GET /usuarios, que é restrito a ADMIN/ATENDENTE.
  meuPerfil: () => apiClient.get("/usuarios/me").then((r) => r.data),

  criar: (dto) => apiClient.post("/usuarios", dto).then((r) => r.data),

  editar: (id, dto) => apiClient.put(`/usuarios/${id}`, dto).then((r) => r.data),

  deletar: (id) => apiClient.delete(`/usuarios/${id}`).then((r) => r.data),

  // ===========================================================================
  // TROCA DE SENHA (RF03) — CONTRATO ESPERADO DO BACKEND
  //
  // >>> BACKEND: nenhuma das duas rotas existe ainda. A UI que as consome está
  // >>> em src/pages/Perfil/AlterarSenhaModal.jsx
  //
  // PATCH /usuarios/me/senha        — qualquer autenticado
  //   corpo:    { "senhaAtual": "...", "novaSenha": "..." }
  //   resposta: 204 No Content
  //   400 se: senhaAtual incorreta | novaSenha < 6 chars | novaSenha == atual
  //
  // PATCH /usuarios/{id}/senha      — exclusivo do ADMIN
  //   corpo:    { "novaSenha": "..." }
  //   resposta: 204 No Content
  //   403 se: perfil ATENDENTE ou USUARIO
  //   400 se: ADMIN tentando redefinir a própria senha por esta rota
  //           (deve usar /usuarios/me/senha, que cobra a senha atual)
  //
  // ATENÇÃO À ORDEM DOS MATCHERS no SecurityConfig: "/usuarios/me/senha" precisa
  // vir ANTES de "/usuarios/*/senha". Caso contrário o literal "me" casa com o
  // curinga e a troca da própria senha passa a exigir perfil ADMIN.
  //
  // Exigir a senha atual em /me/senha não é formalidade: sem isso, um token
  // vazado basta para tomar a conta em definitivo.
  // ===========================================================================

  // Troca da própria senha: cobra a senha atual como prova de posse da conta.
  alterarMinhaSenha: (senhaAtual, novaSenha) =>
    apiClient.patch("/usuarios/me/senha", { senhaAtual, novaSenha }).then((r) => r.data),

  // Reset administrativo (só ADMIN): define nova senha sem conhecer a atual.
  redefinirSenha: (id, novaSenha) =>
    apiClient.patch(`/usuarios/${id}/senha`, { novaSenha }).then((r) => r.data),
};
