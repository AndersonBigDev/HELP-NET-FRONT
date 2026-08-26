// RF13 / RNF05 — geração de CSV 100% no client (o backend não expõe endpoint de
// relatório). Mesmo padrão de download do anexo em `pages/Chamados/ChamadoAnexos.jsx`:
// monta um Blob e dispara um <a download> temporário.

// Excel pt-BR assume ";" como separador e precisa do BOM para não quebrar acento.
const SEPARADOR = ";";
const BOM = "﻿";

function escapar(valor) {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

/**
 * @param {string} nomeArquivo  ex: "fila-atendimento.csv"
 * @param {{ header: string, valor: (linha: any) => unknown }[]} colunas
 * @param {any[]} linhas
 */
export function baixarCsv(nomeArquivo, colunas, linhas) {
  const cabecalho = colunas.map((c) => escapar(c.header)).join(SEPARADOR);
  const corpo = linhas.map((linha) =>
    colunas.map((c) => escapar(c.valor(linha))).join(SEPARADOR),
  );

  const conteudo = BOM + [cabecalho, ...corpo].join("\r\n");
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function carimboDeData(data = new Date()) {
  return data.toISOString().slice(0, 10);
}
