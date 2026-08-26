// RNF03 — política de SLA.
//
// O backend não tem campo de prazo no `Chamado` (só `dataAbertura`; `dataFechamento`
// existe na entidade mas nem é exposto no ChamadoResponseDTO). Enquanto isso, o prazo
// é derivado aqui a partir da urgência. Este é o ÚNICO lugar com essa regra — quando o
// backend passar a devolver o prazo, só `calcularSla` muda.

export const PRAZO_HORAS_POR_URGENCIA = {
  CRITICA: 4,
  ALTA: 8,
  MEDIA: 24,
  NORMAL: 72,
};

// Chamado encerrado não acumula atraso.
const STATUS_ENCERRADOS = ["RESOLVIDO", "FECHADO"];

// Abaixo de 25% do prazo restante o chamado entra em estado de atenção.
const FRACAO_ATENCAO = 0.25;

const UMA_HORA_MS = 60 * 60 * 1000;

export function formatarDuracao(ms) {
  const minutos = Math.floor(ms / 60000);
  if (minutos < 60) return `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) {
    const resto = minutos % 60;
    return resto ? `${horas}h ${resto}min` : `${horas}h`;
  }
  const dias = Math.floor(horas / 24);
  const resto = horas % 24;
  return resto ? `${dias}d ${resto}h` : `${dias}d`;
}

/**
 * @returns {{ prazo: Date, horas: number, encerrado: boolean, atrasado: boolean,
 *             restanteMs: number, color: string, label: string }}
 */
export function calcularSla(chamado, agora = new Date()) {
  const horas = PRAZO_HORAS_POR_URGENCIA[chamado.urgencia] ?? PRAZO_HORAS_POR_URGENCIA.NORMAL;
  const prazo = new Date(new Date(chamado.dataAbertura).getTime() + horas * UMA_HORA_MS);
  const restanteMs = prazo.getTime() - agora.getTime();

  if (STATUS_ENCERRADOS.includes(chamado.status)) {
    return { prazo, horas, encerrado: true, atrasado: false, restanteMs, color: "neutral", label: "SLA encerrado" };
  }

  if (restanteMs <= 0) {
    return {
      prazo, horas, encerrado: false, atrasado: true, restanteMs,
      label: `Atrasado há ${formatarDuracao(-restanteMs)}`,
      color: "danger",
    };
  }

  const emAtencao = restanteMs <= horas * UMA_HORA_MS * FRACAO_ATENCAO;
  return {
    prazo, horas, encerrado: false, atrasado: false, restanteMs,
    label: `Vence em ${formatarDuracao(restanteMs)}`,
    color: emAtencao ? "warning" : "neutral",
  };
}

export function estaAtrasado(chamado, agora = new Date()) {
  return calcularSla(chamado, agora).atrasado;
}
