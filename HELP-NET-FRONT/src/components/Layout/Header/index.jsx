import React from 'react';
// import './style.css'; // Descomente depois que criar o CSS

const Header = () => {
  return (
    <header style={{ 
      backgroundColor: '#ffffff', 
      padding: '20px', 
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h2 style={{ margin: 0, color: '#1e293b' }}>Portal de Suporte</h2>
      <div style={{ color: '#64748b' }}>Bem-vindo(a), Atendente</div>
    </header>
  );
};

export default Header;