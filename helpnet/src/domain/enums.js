// Espelha os enums do backend (com.example.helpdesk_backend.model.enums).
// Centralizado aqui para os dois módulos do front usarem os mesmos rótulos e cores.

export const Perfil = {
  USUARIO: { value: "USUARIO", label: "Usuário Comum" },
  ATENDENTE: { value: "ATENDENTE", label: "Atendente" },
  ADMIN: { value: "ADMIN", label: "Administrador" },
};

export const NivelAtendente = {
  NIVEL_I: { value: "NIVEL_I", label: "Nível I", rank: 1 },
  NIVEL_II: { value: "NIVEL_II", label: "Nível II", rank: 2 },
  NIVEL_III: { value: "NIVEL_III", label: "Nível III", rank: 3 },
};

export const Setor = {
  INFRAESTRUTURA: { value: "INFRAESTRUTURA", label: "Infraestrutura e Redes" },
  DESENVOLVIMENTO: { value: "DESENVOLVIMENTO", label: "Sistemas e Desenvolvimento" },
  RECURSOS_HUMANOS: { value: "RECURSOS_HUMANOS", label: "Recursos Humanos / RH" },
  ADMINISTRATIVO: { value: "ADMINISTRATIVO", label: "Administração e Financeiro" },
  OUTROS: { value: "OUTROS", label: "Outros Atendimentos" },
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

export const StatusChamado = {
  ABERTO: { value: "ABERTO", label: "Aberto", color: "info" },
  EM_ANDAMENTO: { value: "EM_ANDAMENTO", label: "Em Andamento", color: "warning" },
  RESOLVIDO: { value: "RESOLVIDO", label: "Resolvido", color: "success" },
  ESCALONADO: { value: "ESCALONADO", label: "Escalonado", color: "warning" },
  FECHADO: { value: "FECHADO", label: "Fechado", color: "neutral" },
};

export function optionsOf(dict) {
  return Object.values(dict).map(({ value, label }) => ({ value, label }));
}
