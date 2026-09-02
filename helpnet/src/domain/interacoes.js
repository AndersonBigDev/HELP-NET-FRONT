import { niveisAcimaDe, statusEncerrado } from "./enums";

// =============================================================================
// CATÁLOGO DE INTERAÇÕES — "o que fazer com este chamado"
// =============================================================================
//
// Em vez de espalhar um botão por endpoint, a tela oferece uma lista única de ações.
// O atendente escolhe o que está fazendo, escreve o relato, e a interação vira ao
// mesmo tempo a mudança de estado e a linha do histórico. É por isso que o campo de
// texto aparece em TODAS as opções: nenhuma ação entra na trilha muda.
//
// Cada opção é só a descrição da ação. Quem traduz para chamada HTTP é o
// `NovaInteracaoModal` — aqui não entra `import` de api de propósito, para o catálogo
// continuar sendo dado puro e testável.
//
// -----------------------------------------------------------------------------
// MAPA PARA O BACKEND ATUAL
// -----------------------------------------------------------------------------
// REGISTRAR  -> POST  /chamados/{id}/historico     { descricao }
// ASSUMIR    -> PATCH /chamados/{id}/assumir
// PAUSAR     -> PATCH /chamados/{id}/status        { status: PAUSADO, observacao }
// RETOMAR    -> PATCH /chamados/{id}/status        { status: EM_ANDAMENTO, observacao }
// ESCALONAR  -> POST  /chamados/{id}/escalonar     { novoNivel, justificativa }
// RESOLVER   -> PATCH /chamados/{id}/status        { status: RESOLVIDO, descricaoResolucao }
// FECHAR     -> PATCH /chamados/{id}/status        { status: FECHADO, descricaoResolucao }
// REABRIR    -> PATCH /chamados/{id}/status        { status: EM_ANDAMENTO, justificativaReabertura }
//
// Duas ações que aparecem em sistemas parecidos NÃO estão aqui porque o backend não
// as suporta hoje: "Aguardando Cliente" (um status próprio, distinto de Pausado) e
// "Reagendar" (uma data de retorno gravada no chamado). Enquanto não existirem, o
// caminho é PAUSAR com o motivo escrito no relato.

// `relato` diz o que o campo de texto significa naquela ação:
//   "obrigatorio" — o backend recusa sem ele
//   "opcional"    — entra no histórico se preenchido
export const INTERACOES = {
  REGISTRAR: {
    value: "REGISTRAR",
    label: "Registrar interação",
    ajuda: "Anota o que foi feito sem alterar o status do chamado.",
    statusResultante: null,
    relato: "obrigatorio",
    rotuloRelato: "O que foi feito",
    placeholderRelato: "Ex.: contato feito com o setor, aguardando confirmação do horário.",
  },

  ASSUMIR: {
    value: "ASSUMIR",
    label: "Iniciar atendimento",
    ajuda: "Passa o chamado para você. Se estiver Aberto, vai para Em Andamento.",
    statusResultante: "EM_ANDAMENTO",
    relato: "opcional",
    rotuloRelato: "Primeiro registro",
    placeholderRelato: "Ex.: atendimento iniciado, entrando em contato com o solicitante.",
  },

  PAUSAR: {
    value: "PAUSAR",
    label: "Pausar atendimento",
    ajuda: "Para o relógio do SLA enquanto o chamado depende de algo de fora.",
    statusResultante: "PAUSADO",
    relato: "obrigatorio",
    rotuloRelato: "Motivo da pausa",
    placeholderRelato: "Ex.: aguardando a peça de reposição chegar.",
    aviso: "O motivo fica visível para o solicitante e o SLA para de correr.",
  },

  RETOMAR: {
    value: "RETOMAR",
    label: "Retomar atendimento",
    ajuda: "Volta a correr o SLA. O tempo parado é devolvido ao prazo.",
    statusResultante: "EM_ANDAMENTO",
    relato: "opcional",
    rotuloRelato: "O que destravou",
    placeholderRelato: "Ex.: peça recebida, retomando a troca.",
  },

  ESCALONAR: {
    value: "ESCALONAR",
    label: "Escalonar nível",
    ajuda: "Sobe o chamado de nível quando ele passa do seu alcance.",
    statusResultante: "ESCALONADO",
    exigeNivel: true,
    relato: "obrigatorio",
    rotuloRelato: "Justificativa do escalonamento",
    placeholderRelato: "Explique por que o chamado precisa subir de nível.",
    aviso: "O fluxo só permite elevação: não é possível rebaixar o nível depois.",
  },

  RESOLVER: {
    value: "RESOLVER",
    label: "Marcar como resolvido",
    ajuda: "Encerra o atendimento. O solicitante ainda pode contestar pela conversa.",
    statusResultante: "RESOLVIDO",
    exigeResolucao: true,
    relato: "opcional",
    rotuloRelato: "Observação adicional",
    placeholderRelato: "Registro extra sobre o encerramento.",
  },

  FECHAR: {
    value: "FECHAR",
    label: "Fechar chamado",
    ajuda: "Encerra em definitivo: não aceita novas mensagens nem registros.",
    statusResultante: "FECHADO",
    exigeResolucao: true,
    relato: "opcional",
    rotuloRelato: "Observação adicional",
    placeholderRelato: "Registro extra sobre o fechamento.",
  },

  REABRIR: {
    value: "REABRIR",
    label: "Reabrir chamado",
    ajuda: "Devolve o chamado para atendimento.",
    statusResultante: "EM_ANDAMENTO",
    exigeJustificativa: true,
    relato: "opcional",
    rotuloRelato: "Observação adicional",
    placeholderRelato: "Registro extra sobre a reabertura.",
  },
};

/**
 * As interações que fazem sentido no estado atual do chamado.
 *
 * Espelha as travas do `ChamadoService`: em vez de deixar o atendente escolher uma
 * ação e tomar 400 do servidor, a opção nem aparece. As regras espelhadas são:
 *
 *   pausar   -> exige responsável e um atendimento em curso
 *   retomar  -> só a partir de PAUSADO
 *   escalonar-> só se existe nível acima do exigido (RN06)
 *   FECHADO  -> não aceita anotação nem mensagem, só reabertura
 */
export function interacoesDisponiveis(chamado, usuarioId) {
  if (!chamado) return [];

  const { REGISTRAR, ASSUMIR, PAUSAR, RETOMAR, ESCALONAR, RESOLVER, FECHAR, REABRIR } = INTERACOES;

  if (chamado.status === "FECHADO") return [REABRIR];
  if (statusEncerrado(chamado.status)) return [REABRIR, FECHAR, REGISTRAR];

  const opcoes = [REGISTRAR];

  // `responsavelNome` vem "Não atribuído" do backend quando não há ninguém — quem
  // decide é o id. Assumir também serve para puxar o chamado de outro atendente.
  if (chamado.responsavelId !== usuarioId) opcoes.push(ASSUMIR);

  if (chamado.status === "PAUSADO") {
    opcoes.push(RETOMAR);
  } else if (chamado.responsavelId && chamado.status !== "ABERTO") {
    opcoes.push(PAUSAR);
  }

  if (niveisAcimaDe(chamado.nivelExigido).length > 0) opcoes.push(ESCALONAR);

  opcoes.push(RESOLVER, FECHAR);

  return opcoes;
}

// Fechar um chamado que já está RESOLVIDO não repete a descrição da resolução — o
// backend só a exige na primeira vez que o chamado é encerrado.
export function exigeResolucao(interacao, chamado) {
  return Boolean(interacao.exigeResolucao) && !statusEncerrado(chamado.status);
}
