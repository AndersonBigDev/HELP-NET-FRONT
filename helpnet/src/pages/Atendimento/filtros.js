import { calcularSla } from "../../domain/sla";

// RF10/RF11 — todo o recorte da fila acontece no client, porque o `GET /chamados`
// só pagina (não aceita filtro nem separa fila geral de minha fila).

// As cinco dimensões de múltipla escolha. `atrasados` e `dia` ficam de fora porque
// não são listas — são um sinalizador e uma data.
const DIMENSOES_LISTA = ["status", "categorias", "setores", "niveis", "urgencias"];

export const FILTROS_VAZIOS = {
  status: [],
  categorias: [],
  setores: [],
  niveis: [],
  urgencias: [],
  // Recortes que o dashboard usa e que não são campo do chamado: SLA estourado e
  // data de abertura. Ambos derivados, por isso não cabiam nas listas acima.
  atrasados: false,
  dia: null,
};

// Chave de dia usada tanto no gráfico de aberturas quanto no filtro, para os dois
// falarem a mesma língua: "01/09/2026".
export function chaveDoDia(data) {
  return new Date(data).toLocaleDateString("pt-BR");
}

export function temFiltroAtivo(filtros) {
  return (
    DIMENSOES_LISTA.some((d) => filtros[d].length > 0) ||
    filtros.atrasados ||
    filtros.dia != null
  );
}

export function contarFiltrosAtivos(filtros) {
  const listas = DIMENSOES_LISTA.reduce((total, d) => total + filtros[d].length, 0);
  return listas + (filtros.atrasados ? 1 : 0) + (filtros.dia ? 1 : 0);
}

export function alternarValor(lista, valor) {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

// Lista vazia = "sem restrição" nessa dimensão; as dimensões se combinam por E.
function casa(lista, valor) {
  return lista.length === 0 || lista.includes(valor);
}

export function aplicarFiltros(chamados, filtros) {
  return chamados.filter(
    (c) =>
      casa(filtros.status, c.status) &&
      casa(filtros.categorias, c.categoria) &&
      casa(filtros.setores, c.setor) &&
      casa(filtros.niveis, c.nivelExigido) &&
      casa(filtros.urgencias, c.urgencia) &&
      (!filtros.atrasados || calcularSla(c).atrasado) &&
      (!filtros.dia || chaveDoDia(c.dataAbertura) === filtros.dia),
  );
}

// =============================================================================
// FILTROS NA URL
// =============================================================================
//
// O recorte mora na query string, não no estado da tela. Assim o dashboard vira um
// índice navegável — cada indicador é só um link para a fila já filtrada — e de
// quebra o link fica compartilhável e o botão "voltar" do navegador funciona, o que
// não aconteceria com o filtro guardado em `useState`.
//
// Formato: /atendimento?status=ABERTO,EM_ANDAMENTO&setor=INFRAESTRUTURA&atrasados=1

const PARAM_POR_DIMENSAO = {
  status: "status",
  categorias: "categoria",
  setores: "setor",
  niveis: "nivel",
  urgencias: "urgencia",
};

export function filtrosDaUrl(searchParams) {
  const filtros = { ...FILTROS_VAZIOS };

  for (const [dimensao, param] of Object.entries(PARAM_POR_DIMENSAO)) {
    const bruto = searchParams.get(param);
    filtros[dimensao] = bruto ? bruto.split(",").filter(Boolean) : [];
  }

  filtros.atrasados = searchParams.get("atrasados") === "1";
  filtros.dia = searchParams.get("dia") || null;

  return filtros;
}

/** @returns {Record<string, string>} pronto para `setSearchParams`. */
export function paramsDosFiltros(filtros) {
  const params = {};

  for (const [dimensao, param] of Object.entries(PARAM_POR_DIMENSAO)) {
    if (filtros[dimensao].length > 0) params[param] = filtros[dimensao].join(",");
  }

  if (filtros.atrasados) params.atrasados = "1";
  if (filtros.dia) params.dia = filtros.dia;

  return params;
}

/** Monta o destino de um link do dashboard: `linkDaFila({ status: ["ABERTO"] })`. */
export function linkDaFila(recorte) {
  const params = new URLSearchParams(paramsDosFiltros({ ...FILTROS_VAZIOS, ...recorte }));
  const query = params.toString();
  return query ? `/atendimento?${query}` : "/atendimento";
}

// Título da tela quando ela chega filtrada pelo dashboard. Um recorte de um valor só
// vira uma tela com nome próprio ("Chamados abertos"); combinações caem no genérico,
// porque nomear toda combinação daria títulos piores que os próprios chips de filtro.
export function tituloDaFila(filtros, rotuloDeStatus) {
  if (filtros.atrasados && !temOutroRecorte(filtros, "atrasados")) {
    return "Chamados com SLA estourado";
  }

  if (filtros.dia && !temOutroRecorte(filtros, "dia")) {
    return `Chamados abertos em ${filtros.dia}`;
  }

  if (filtros.status.length === 1 && !temOutroRecorte(filtros, "status")) {
    return `Chamados: ${rotuloDeStatus(filtros.status[0])}`;
  }

  return "Filas de Atendimento";
}

function temOutroRecorte(filtros, dimensaoIgnorada) {
  const semADimensao = { ...filtros, [dimensaoIgnorada]: FILTROS_VAZIOS[dimensaoIgnorada] };
  return temFiltroAtivo(semADimensao);
}

// RF10 — "Minha Fila".
//
// O backend agora tem PATCH /chamados/{id}/assumir, que preenche `Chamado.responsavel`,
// então `responsavelNome` já pode vir preenchido. Mesmo assim mantemos "minha fila" por
// AFINIDADE: os chamados que competem ao atendente logado — mesmo nível exigido e mesmo
// setor. O recorte serve para achar o que ainda NÃO foi assumido; filtrar por responsável
// mostraria só o que já está na mão de alguém. Quem tem só um dos dois campos preenchidos
// (o ADMIN não tem nível) é filtrado pelo critério que existir.
//
// TODO: com o "assumir" disponível, vale oferecer os dois recortes na tela (afinidade x
// atribuídos a mim) em vez de escolher um pelo usuário.
export function pertenceAMinhaFila(chamado, meuPerfil) {
  if (!meuPerfil) return false;

  const criterios = [];
  if (meuPerfil.nivelAntendente) criterios.push(chamado.nivelExigido === meuPerfil.nivelAntendente);
  if (meuPerfil.setor) criterios.push(chamado.setor === meuPerfil.setor);

  return criterios.length > 0 && criterios.every(Boolean);
}

export function temCriterioDeAfinidade(meuPerfil) {
  return Boolean(meuPerfil?.nivelAntendente || meuPerfil?.setor);
}
