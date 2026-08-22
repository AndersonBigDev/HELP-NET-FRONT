import React from 'react';
import { Link } from 'react-router-dom';
// import './style.css'; // Descomente depois que criar o CSS

const Sidebar = () => {
  return (
    <aside style={{ 
      width: '260px', 
      backgroundColor: '#1e293b', 
      color: 'white', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h2 style={{ marginBottom: '30px', color: '#3b82f6' }}>Help Desk N1/N2</h2>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <Link to="/suporte/dashboard" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
          📊 Dashboard
        </Link>
        <Link to="/suporte/filas" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
          📋 Filas de Atendimento
        </Link>
        <Link to="/suporte/proxy" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
          🛡️ Abertura de Proxy
        </Link>
        <Link to="/suporte/usuarios" style={{ color: '#cbd5e1', textDecoration: 'none' }}>
          👥 Gestão de Usuários
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;