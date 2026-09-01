// Catálogo dos temas. Os valores de cor NÃO moram aqui — moram em `index.css`,
// nos blocos [data-accent]. Este arquivo guarda só o que a interface precisa
// saber: quais opções existem, como se chamam e como são persistidas.
//
// Atenção: as duas chaves abaixo estão repetidas no script inline do
// `index.html`, que aplica o tema antes do React montar para a tela não piscar
// no modo errado. Se renomear aqui, renomeie lá também.

export const CHAVE_MODO = "helpnet.tema.modo";
export const CHAVE_ACENTO = "helpnet.tema.acento";

export const MODOS = [
  { value: "sistema", label: "Sistema", descricao: "Acompanha a aparência do seu sistema operacional" },
  { value: "claro", label: "Claro", descricao: "Sempre no tema claro" },
  { value: "escuro", label: "Escuro", descricao: "Sempre no tema escuro" },
];

export const ACENTOS = [
  { value: "violeta", label: "Violeta" },
  { value: "indigo", label: "Índigo" },
  { value: "turquesa", label: "Turquesa" },
  { value: "magenta", label: "Magenta" },
  { value: "grafite", label: "Grafite" },
];

export const MODO_PADRAO = "sistema";
export const ACENTO_PADRAO = "violeta";

const MODOS_VALIDOS = MODOS.map((m) => m.value);
const ACENTOS_VALIDOS = ACENTOS.map((a) => a.value);

// Uma preferência salva em versão anterior (ou adulterada à mão no
// localStorage) não pode derrubar a aplicação: qualquer valor fora do catálogo
// vira o padrão.
export function normalizarModo(valor) {
  return MODOS_VALIDOS.includes(valor) ? valor : MODO_PADRAO;
}

export function normalizarAcento(valor) {
  return ACENTOS_VALIDOS.includes(valor) ? valor : ACENTO_PADRAO;
}
