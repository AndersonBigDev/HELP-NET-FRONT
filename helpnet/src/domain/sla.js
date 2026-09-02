import { STATUS_ENCERRADOS } from "./enums";

// RNF03 — política de SLA.
//
// O backend passou a calcular o prazo e a devolvê-lo em `ChamadoResponseDTO.prazoLimite`
// (`ChamadoService.calcularPrazoSla`). Passamos a usar esse valor como fonte da verdade;
// a tabela abaixo virou fallback para chamados antigos, gravados antes do campo existir.
// Ela espelha exatamente as faixas do backend, então os dois caminhos dão o mesmo prazo.

export const PRAZO_HORAS_POR_URGENCIA = {
  CRITICA: 4,
  ALTA: 8,
  MEDIA: 24,
  NORMAL: 72,
};

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
 * @returns {{ prazo: Date, horas: number, encerrado: boolean, pausado: boolean,
 *             atrasado: boolean, restanteMs: number, color: string, label: string }}
 */
export function calcularSla(chamado, agora = new Date()) {
  const horas = PRAZO_HORAS_POR_URGENCIA[chamado.urgencia] ?? PRAZO_HORAS_POR_URGENCIA.NORMAL;
  const prazo = chamado.prazoLimite
    ? new Date(chamado.prazoLimite)
    : new Date(new Date(chamado.dataAbertura).getTime() + horas * UMA_HORA_MS);

  // Enquanto o chamado está pausado o relógio para: o backend devolve o tempo parado
  // ao `prazoLimite` na retomada (`ChamadoService.encerrarPausa`), então até lá a
  // contagem fica congelada no instante da pausa — senão a tela mostraria um atraso
  // que o servidor vai desfazer.
  const pausado = chamado.status === "PAUSADO";
  const referencia = pausado && chamado.pausadoEm ? new Date(chamado.pausadoEm) : agora;
  const restanteMs = prazo.getTime() - referencia.getTime();

  if (STATUS_ENCERRADOS.includes(chamado.status)) {
    return { prazo, horas, encerrado: true, pausado: false, atrasado: false, restanteMs, color: "neutral", label: "SLA encerrado" };
  }

  if (pausado) {
    return {
      prazo, horas, encerrado: false, pausado: true, atrasado: restanteMs <= 0, restanteMs,
      label: restanteMs > 0 ? `SLA pausado · restam ${formatarDuracao(restanteMs)}` : "SLA pausado · em atraso",
      color: restanteMs > 0 ? "neutral" : "danger",
    };
  }

  if (restanteMs <= 0) {
    return {
      prazo, horas, encerrado: false, pausado: false, atrasado: true, restanteMs,
      label: `Atrasado há ${formatarDuracao(-restanteMs)}`,
      color: "danger",
    };
  }

  const emAtencao = restanteMs <= horas * UMA_HORA_MS * FRACAO_ATENCAO;
  return {
    prazo, horas, encerrado: false, pausado: false, atrasado: false, restanteMs,
    label: `Vence em ${formatarDuracao(restanteMs)}`,
    color: emAtencao ? "warning" : "neutral",
  };
}

export function estaAtrasado(chamado, agora = new Date()) {
  return calcularSla(chamado, agora).atrasado;
}
