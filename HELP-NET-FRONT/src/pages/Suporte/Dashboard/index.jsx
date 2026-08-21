// src/pages/Suporte/Dashboard/index.jsx
import React, { useMemo } from 'react';
import { FiAlertCircle, FiCheckCircle, FiClock, FiThumbsDown, FiActivity, FiDownload } from 'react-icons/fi';
import { exportToCsv } from '../../../service/exportCsv';
import './style.css';

const Dashboard = () => {
  // Mock de logs para exportação (RNF05)
  const escalationLogsMock = [
    { protocolo: 'CH-1001', nivelAnterior: 'N1', nivelAtual: 'N2', justificativa: 'Acesso negado no AD.', data: '2026-08-21 10:00' },
    { protocolo: 'CH-1005', nivelAnterior: 'N2', nivelAtual: 'N3', justificativa: 'Falha crítica no banco de dados.', data: '2026-08-21 14:30' }
  ];

  // Mock de chamados abertos para validação de SLA (RNF03)
  const chamadosMock = [
    { id: 'CH-1010', titulo: 'Reset de Senha', abertura: '2026-08-21T15:00:00' },
    { id: 'CH-1011', titulo: 'Servidor Offline', abertura: '2026-08-19T09:00:00' }, // SLA estourado
  ];

  // Regra de Negócio: Verifica se o chamado tem mais de 24h
  const verificarSLA = (dataAbertura) => {
    const dataChamado = new Date(dataAbertura);
    const agora = new Date();
    const diferencaHoras = (agora - dataChamado) / (1000 * 60 * 60);
    return diferencaHoras > 24;
  };

  const handleExport = () => {
    exportToCsv(escalationLogsMock, 'logs_escalonamento.csv');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Visão Geral - Operação</h2>
        <button className="btn-export" onClick={handleExport}>
          <FiDownload /> Exportar Relatório de Escalonamento
        </button>
      </header>

      {/* Cards de Métricas (RNF02 & RN08) */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon alert"><FiAlertCircle /></div>
          <div className="metric-info">
            <span>Abertos</span>
            <h3>145</h3>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon success"><FiCheckCircle /></div>
          <div className="metric-info">
            <span>Resolvidos (Hoje)</span>
            <h3>89</h3>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon warning"><FiClock /></div>
          <div className="metric-info">
            <span>Atrasados</span>
            <h3>12</h3>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon danger"><FiThumbsDown /></div>
          <div className="metric-info">
            <span>Avaliações Negativas</span>
            <h3>3</h3>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon neutral"><FiActivity /></div>
          <div className="metric-info">
            <span>Total Atendidos (Dia)</span>
            <h3>112</h3>
          </div>
        </div>
      </section>

      {/* Fila rápida para demonstração de Tags de SLA (RNF03) */}
      <section className="sla-monitor-section">
        <h3>Monitoramento de SLA</h3>
        <ul className="sla-list">
          {chamadosMock.map(chamado => {
            const isEstourado = verificarSLA(chamado.abertura);
            return (
              <li key={chamado.id} className="sla-item">
                <div className="chamado-info">
                  <strong>{chamado.id}</strong> - {chamado.titulo}
                </div>
                {isEstourado ? (
                  <span className="tag-sla danger">SLA Estourado</span>
                ) : (
                  <span className="tag-sla success">No Prazo</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;