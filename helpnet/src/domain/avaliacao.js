import { statusEncerrado } from "./enums";

// RN08 — avaliação do atendimento pelo solicitante.
//
// As regras moram aqui, e não dentro do componente, porque três lugares diferentes
// perguntam a mesma coisa: a tela que coleta a nota, o dashboard que conta as
// negativas e o filtro da fila. Um deles importando do outro deixaria `filtros.js`
// dependendo de um componente de página.

export const NOTAS = [1, 2, 3, 4, 5];

export const ROTULO_DA_NOTA = {
  1: "Péssimo",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Ótimo",
};

/**
 * Até onde a nota conta como insatisfação.
 *
 * 3 fica de fora de propósito: numa escala de 5, o meio é o "atendeu, sem mais" —
 * juntá-lo às negativas inflaria o indicador com chamados que ninguém reclamou.
 */
export const NOTA_NEGATIVA_MAXIMA = 2;

export function avaliacaoNegativa(chamado) {
  return chamado?.notaAvaliacao != null && chamado.notaAvaliacao <= NOTA_NEGATIVA_MAXIMA;
}

/**
 * O bloco de avaliação só existe depois que o atendimento acaba: antes disso não há o
 * que avaliar. As telas usam isto para decidir se abrem o Card em volta — sem isso, um
 * chamado em andamento renderizaria um card vazio.
 */
export function avaliacaoVisivel(chamado) {
  return chamado?.notaAvaliacao != null || statusEncerrado(chamado?.status);
}
