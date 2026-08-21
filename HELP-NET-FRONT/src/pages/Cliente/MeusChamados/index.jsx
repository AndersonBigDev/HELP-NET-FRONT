import React from 'react';
import './style.css';

export default function MeusChamados() {
  // Mock de dados para você visualizar antes da API estar pronta
  const mockChamados = [
    {
      protocolo: 'TK-202310-001',
      solicitanteNome: 'Maria Silva',
      solicitanteEmail: 'maria@helpdesk.com',
      solicitanteTel: '(11) 98888-7777',
      responsavel: 'Suporte N1 - Triagem',
      tipo: 'Software',
      prioridade: 'Médio',
      status: 'Em Andamento',
      nivel: 'N1'
    }
  ];

  return (
    <div className="page-container">
      <h2>Meus Chamados</h2>
      <p>Acompanhe o status das suas solicitações (RN05).</p>

      <div className="table-responsive">
        <table className="chamados-table">
          <thead>
            <tr>
              <th>Protocolo</th>
              <th>Dados do Solicitante</th>
              <th>Responsável / Nível</th>
              <th>Tipo / Prioridade</th>
              <th>Status Atual</th>
            </tr>
          </thead>
          <tbody>
            {mockChamados.map(chamado => (
              <tr key={chamado.protocolo}>
                <td><strong>{chamado.protocolo}</strong></td>
                <td>
                  {chamado.solicitanteNome}<br/>
                  <small>{chamado.solicitanteEmail} | {chamado.solicitanteTel}</small>
                </td>
                <td>{chamado.responsavel} <br/><span className="badge badge-nivel">{chamado.nivel}</span></td>
                <td>{chamado.tipo} <br/><span className="badge badge-prioridade">{chamado.prioridade}</span></td>
                <td><span className="badge badge-status">{chamado.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}