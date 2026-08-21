import React, { useState } from 'react';
import { FiFilter, FiSearch, FiUser, FiUsers, FiEye } from 'react-icons/fi';
import './style.css';

const FilasAtendimento = () => {
  const [abaAtiva, setAbaAtiva] = useState('minha_fila'); // 'geral' ou 'minha_fila'
  
  // Mock de chamados para visualizarmos a interface
  const chamadosMock = [
    { id: 'CH-1001', titulo: 'Sistema ERP fora do ar', status: 'Aberto', nivel: 'N2', prioridade: 'Alta', responsavel: 'Você', data: '21/08/2026' },
    { id: 'CH-1002', titulo: 'Mouse não funciona', status: 'Em Andamento', nivel: 'N1', prioridade: 'Baixa', responsavel: 'Você', data: '21/08/2026' },
    { id: 'CH-1003', titulo: 'Lentidão no Banco de Dados', status: 'Aberto', nivel: 'N3', prioridade: 'Crítica', responsavel: 'João Silva', data: '20/08/2026' },
  ];

  const handleFiltrar = (e) => {
    e.preventDefault();
    // Aqui entrará a lógica de requisição via Axios no futuro
    console.log("Filtros aplicados!");
  };

  return (
    <div className="filas-container">
      <header className="filas-header">
        <h2>Gestão de Filas</h2>
        <p>Acompanhe e trie os chamados técnicos</p>
      </header>

      {/* Navegação por Abas (RF10) */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${abaAtiva === 'minha_fila' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('minha_fila')}
        >
          <FiUser /> Minha Fila
        </button>
        <button 
          className={`tab-btn ${abaAtiva === 'geral' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('geral')}
        >
          <FiUsers /> Fila Geral
        </button>
      </div>

      <div className="filas-content">
        {/* Painel de Filtros (RF11) */}
        <aside className="filtros-panel">
          <div className="filtros-header">
            <FiFilter /> <h3>Filtros</h3>
          </div>
          <form onSubmit={handleFiltrar} className="filtros-form">
            <div className="form-group">
              <label>Status</label>
              <select defaultValue="">
                <option value="">Todos</option>
                <option value="aberto">Aberto</option>
                <option value="andamento">Em Andamento</option>
                <option value="pendente">Pendente Terceiros</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Nível Exigido</label>
              <select defaultValue="">
                <option value="">Todos</option>
                <option value="N1">Nível 1 (Help Desk)</option>
                <option value="N2">Nível 2 (Field Service)</option>
                <option value="N3">Nível 3 (Especialista)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prioridade</label>
              <select defaultValue="">
                <option value="">Todas</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>

            <button type="submit" className="btn-filtrar">
              <FiSearch /> Aplicar Filtros
            </button>
          </form>
        </aside>

        {/* Lista de Chamados */}
        <main className="chamados-list">
          <table className="table-chamados">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Título</th>
                <th>Status</th>
                <th>Nível</th>
                <th>Prioridade</th>
                <th>Responsável</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {chamadosMock.map((chamado) => (
                <tr key={chamado.id}>
                  <td><strong>{chamado.id}</strong></td>
                  <td>{chamado.titulo}</td>
                  <td><span className={`badge status-${chamado.status.replace(/\s+/g, '').toLowerCase()}`}>{chamado.status}</span></td>
                  <td>{chamado.nivel}</td>
                  <td><span className={`badge prioridade-${chamado.prioridade.toLowerCase()}`}>{chamado.prioridade}</span></td>
                  <td>{abaAtiva === 'minha_fila' ? 'Você' : chamado.responsavel}</td>
                  <td>
                    <button className="btn-icon" title="Ver Detalhes">
                      <FiEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
};

export default FilasAtendimento;