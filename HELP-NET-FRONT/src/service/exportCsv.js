// src/service/exportCsv.js

export const exportToCsv = (data, filename = 'relatorio_escalonamento.csv') => {
  if (!data || data.length === 0) {
    console.warn('Nenhum dado para exportar.');
    return;
  }

  // Extrai as chaves (cabeçalhos) do primeiro objeto
  const headers = Object.keys(data[0]).join(',');

  // Mapeia os valores de cada linha
  const rows = data.map(obj => 
    Object.values(obj)
      // Escapa vírgulas e aspas dentro das strings para não quebrar o CSV
      .map(value => `"${String(value).replace(/"/g, '""')}"`)
      .join(',')
  ).join('\n');

  const csvContent = `${headers}\n${rows}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};