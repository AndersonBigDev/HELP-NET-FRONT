// RF10/RF11 — todo o recorte da fila acontece no client, porque o `GET /chamados`
// só pagina (não aceita filtro nem separa fila geral de minha fila).

export const FILTROS_VAZIOS = {
  status: [],
  categorias: [],
  setores: [],
  niveis: [],
  urgencias: [],
};

export function temFiltroAtivo(filtros) {
  return Object.values(filtros).some((lista) => lista.length > 0);
}

export function contarFiltrosAtivos(filtros) {
  return Object.values(filtros).reduce((total, lista) => total + lista.length, 0);
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
      casa(filtros.urgencias, c.urgencia),
  );
}

// RF10 — "Minha Fila".
//
// O backend nunca preenche `Chamado.responsavel` (nenhum service atribui, e não há
// endpoint de "assumir"), então `nomeResponsavel` é sempre "Não atribuído" e um filtro
// por responsável devolveria lista vazia para sempre. Definimos "minha fila" por
// AFINIDADE: os chamados que competem ao atendente logado — mesmo nível exigido e
// mesmo setor. Quem tem só um dos dois preenchidos (o ADMIN não tem nível) é filtrado
// pelo critério que existir.
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
