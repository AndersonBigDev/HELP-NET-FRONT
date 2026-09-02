// Espelha os enums do backend (com.example.helpdesk_backend.model.enums).
// Centralizado aqui para os dois módulos do front usarem os mesmos rótulos e cores.

export const Perfil = {
  USUARIO: { value: "USUARIO", label: "Usuário Comum" },
  ATENDENTE: { value: "ATENDENTE", label: "Atendente" },
  ADMIN: { value: "ADMIN", label: "Administrador" },
};

export const NivelAtendente = {
  NIVEL_I: { value: "NIVEL_I", label: "Nível I", rank: 1, color: "neutral" },
  NIVEL_II: { value: "NIVEL_II", label: "Nível II", rank: 2, color: "info" },
  NIVEL_III: { value: "NIVEL_III", label: "Nível III", rank: 3, color: "warning" },
};

// RN06: o escalonamento só sobe. Espelha a trava do ChamadoService, que rejeita
// `novoNivel.ordinal() <= nivelExigido.ordinal()` — por isso é rank estritamente maior.
export function niveisAcimaDe(nivelAtual) {
  const rankAtual = NivelAtendente[nivelAtual]?.rank ?? 0;
  return Object.values(NivelAtendente).filter((n) => n.rank > rankAtual);
}

// `labelCurto` é para eixos de gráfico, onde o rótulo completo quebraria em duas linhas.
export const Setor = {
  INFRAESTRUTURA: { value: "INFRAESTRUTURA", label: "Infraestrutura e Redes", labelCurto: "Infraestrutura" },
  DESENVOLVIMENTO: { value: "DESENVOLVIMENTO", label: "Sistemas e Desenvolvimento", labelCurto: "Desenvolvimento" },
  RECURSOS_HUMANOS: { value: "RECURSOS_HUMANOS", label: "Recursos Humanos / RH", labelCurto: "RH" },
  ADMINISTRATIVO: { value: "ADMINISTRATIVO", label: "Administração e Financeiro", labelCurto: "Administrativo" },
  OUTROS: { value: "OUTROS", label: "Outros Atendimentos", labelCurto: "Outros" },
};

export const Urgencia = {
  NORMAL: { value: "NORMAL", label: "Normal", color: "info" },
  MEDIA: { value: "MEDIA", label: "Média", color: "warning" },
  ALTA: { value: "ALTA", label: "Alta", color: "warning" },
  CRITICA: { value: "CRITICA", label: "Crítica", color: "danger" },
};

// Cada categoria já carrega, no backend, a urgência padrão e o setor responsável
// (roteamento automático — RF09). "OUTROS" é a única com urgência/setor livres.
export const Categoria = {
  FALHA_SERVIDOR: { value: "FALHA_SERVIDOR", label: "Falha de Servidor", urgenciaPadrao: "CRITICA", setor: "INFRAESTRUTURA" },
  FALHA_REDE: { value: "FALHA_REDE", label: "Falha de Rede", urgenciaPadrao: "ALTA", setor: "INFRAESTRUTURA" },
  SISTEMA_INOPERANTE: { value: "SISTEMA_INOPERANTE", label: "Sistema Inoperante", urgenciaPadrao: "ALTA", setor: "DESENVOLVIMENTO" },
  ERRO_SISTEMA: { value: "ERRO_SISTEMA", label: "Erro de Sistema", urgenciaPadrao: "MEDIA", setor: "DESENVOLVIMENTO" },
  DUVIDA_FOLHA_PAGAMENTO: { value: "DUVIDA_FOLHA_PAGAMENTO", label: "Dúvida sobre Folha de Pagamento", urgenciaPadrao: "NORMAL", setor: "RECURSOS_HUMANOS" },
  MANUTENCAO_HARDWARE: { value: "MANUTENCAO_HARDWARE", label: "Manutenção de Hardware", urgenciaPadrao: "MEDIA", setor: "INFRAESTRUTURA" },
  OUTROS: { value: "OUTROS", label: "Outros", urgenciaPadrao: null, setor: null },
};

// RF09 — roteamento automático. Quem decide urgência e setor é o backend, em
// `ChamadoService.criarChamado`: para toda categoria diferente de OUTROS ele ignora a
// urgência recebida e aplica `categoria.getUrgenciaPadrao()` e `getSetorResponsavel()`.
// As funções abaixo espelham essa regra só para a tela mostrar o resultado antes do
// POST — a fonte da verdade continua sendo o servidor.
export function urgenciaDaCategoria(categoria) {
  const padrao = Categoria[categoria]?.urgenciaPadrao;
  return padrao ? Urgencia[padrao] : null;
}

export function setorDaCategoria(categoria) {
  const setor = Categoria[categoria]?.setor;
  return setor ? Setor[setor] : null;
}

// Só OUTROS deixa o solicitante escolher a urgência.
export function urgenciaEhLivre(categoria) {
  return categoria === "OUTROS";
}

export const StatusChamado = {
  ABERTO: { value: "ABERTO", label: "Aberto", color: "info" },
  EM_ANDAMENTO: { value: "EM_ANDAMENTO", label: "Em Andamento", color: "warning" },
  PAUSADO: { value: "PAUSADO", label: "Pausado", color: "warning" },
  RESOLVIDO: { value: "RESOLVIDO", label: "Resolvido", color: "success" },
  ESCALONADO: { value: "ESCALONADO", label: "Escalonado", color: "warning" },
  FECHADO: { value: "FECHADO", label: "Fechado", color: "neutral" },
};

// Espelham StatusChamado.isEncerrado() e isEmAtendimento() no backend. Centralizados
// aqui porque a mesma pergunta aparece na fila, no SLA, no painel e no dashboard.
export const STATUS_ENCERRADOS = ["RESOLVIDO", "FECHADO"];
export const STATUS_EM_ATENDIMENTO = ["EM_ANDAMENTO", "ESCALONADO", "PAUSADO"];

export function statusEncerrado(status) {
  return STATUS_ENCERRADOS.includes(status);
}

export function statusEmAtendimento(status) {
  return STATUS_EM_ATENDIMENTO.includes(status);
}

// Trilha de histórico — espelha o enum TipoEventoChamado do backend.
export const TipoEventoChamado = {
  ABERTURA: { value: "ABERTURA", label: "Chamado aberto", color: "info" },
  ATRIBUICAO: { value: "ATRIBUICAO", label: "Atendimento assumido", color: "info" },
  STATUS: { value: "STATUS", label: "Status alterado", color: "neutral" },
  PAUSA: { value: "PAUSA", label: "Atendimento pausado", color: "warning" },
  RETOMADA: { value: "RETOMADA", label: "Atendimento retomado", color: "info" },
  ESCALONAMENTO: { value: "ESCALONAMENTO", label: "Chamado escalonado", color: "warning" },
  RESOLUCAO: { value: "RESOLUCAO", label: "Chamado resolvido", color: "success" },
  REABERTURA: { value: "REABERTURA", label: "Chamado reaberto", color: "danger" },
  ANOTACAO: { value: "ANOTACAO", label: "Anotação do atendimento", color: "neutral" },
  AVALIACAO: { value: "AVALIACAO", label: "Chamado avaliado", color: "success" },
};

export function optionsOf(dict) {
  return Object.values(dict).map(({ value, label }) => ({ value, label }));
}
