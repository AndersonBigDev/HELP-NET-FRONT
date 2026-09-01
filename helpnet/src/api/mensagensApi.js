import { apiClient } from "./client";

// =============================================================================
// MINI CHAT DO CHAMADO (RF08) — CONTRATO ESPERADO DO BACKEND
//
// >>> BACKEND: este arquivo é a referência. Ele define exatamente o que o front
// >>> envia e o que espera receber. A UI que consome isso está em
// >>> src/pages/Chamados/ChamadoMensagens.jsx
//
// Nenhuma destas rotas existe no backend ainda. Enquanto não existirem, o
// componente detecta o 404 e exibe um aviso em vez de um erro genérico.
//
// -----------------------------------------------------------------------------
// GET /chamados/{chamadoId}/mensagens
// -----------------------------------------------------------------------------
// Resposta 200 — array ordenado por dataEnvio ASC (mais antiga primeiro):
//
// [
//   {
//     "id": 1,
//     "chamadoId": 1,
//     "autorId": 2,
//     "autorNome": "Joao Solicitante",
//     "autorEmail": "joao@helpdesk.com",
//     "autorPerfil": "USUARIO",        // USUARIO | ATENDENTE | ADMIN
//     "conteudo": "A internet caiu por volta das 8h.",
//     "dataEnvio": "2026-09-01T08:40:01.96",
//     "autoria": true                   // ver observação abaixo
//   }
// ]
//
// -----------------------------------------------------------------------------
// POST /chamados/{chamadoId}/mensagens
// -----------------------------------------------------------------------------
// Corpo:    { "conteudo": "texto" }   obrigatório, não-vazio, máx. 2000 chars
// Resposta: 201 com o mesmo objeto acima, já com `id` e `dataEnvio`
//
// -----------------------------------------------------------------------------
// SOBRE O CAMPO `autoria`
// -----------------------------------------------------------------------------
// É relativo a QUEM ESTÁ LENDO: true quando o leitor é o autor daquela mensagem.
// A mesma mensagem volta com autoria=true para quem a escreveu e autoria=false
// para o outro lado. É o que permite alinhar a bolha do chat (direita = "Você")
// sem o front precisar comparar ids.
//
// No serviço, basta comparar o autor da mensagem com o usuário autenticado:
//     autor.getId().equals(usuarioLogado.getId())
//
// Se preferirem NÃO devolver esse campo, avisem: o front passa a comparar
// `autorId` com a claim `id` do token, o que muda o componente.
//
// -----------------------------------------------------------------------------
// REGRAS DE ACESSO (aplicadas no servidor, não aqui)
// -----------------------------------------------------------------------------
// | Situação                                      | Esperado              |
// |-----------------------------------------------|-----------------------|
// | Solicitante dono do chamado                   | lê e escreve          |
// | Atendente com nível >= nivelExigido do chamado| lê e escreve          |
// | ADMIN                                         | sempre permitido      |
// | Qualquer outro usuário                        | 403                   |
// | Sem token / token expirado                    | 401                   |
// | conteudo vazio ou só espaços                  | 400                   |
// | Chamado FECHADO                               | 400 no POST, GET 200  |
// | Chamado RESOLVIDO                             | PERMITE escrever      |
//
// A última linha é intencional: RESOLVIDO é justamente quando o solicitante
// precisa contestar a solução. Só FECHADO encerra a conversa.
//
// A regra de "quem alcança o chamado" já existe em
// ChamadoService.validarPermissaoAcessoChamado — vale reaproveitar em vez de
// reescrever (ela já está duplicada em AnexoService).
// =============================================================================

export const mensagensApi = {
  listar: (chamadoId) =>
    apiClient.get(`/chamados/${chamadoId}/mensagens`).then((r) => r.data),

  enviar: (chamadoId, conteudo) =>
    apiClient.post(`/chamados/${chamadoId}/mensagens`, { conteudo }).then((r) => r.data),
};
