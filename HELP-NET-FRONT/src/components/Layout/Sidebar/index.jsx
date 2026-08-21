import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiPlusCircle, FiList, FiLogOut } from 'react-icons/fi';
import './style.css';

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <aside className="layout-sidebar">
      <div className="sidebar-logo">HelpDesk N3</div>
      <nav className="sidebar-nav">
        <Link to="/suporte/dashboard"><FiHome /> Dashboard</Link>
        <Link to="/cliente/novo-chamado"><FiPlusCircle /> Novo Ticket</Link>
        <Link to="/cliente/meus-chamados"><FiList /> Meus Tickets</Link>
      </nav>
      <button className="logout-btn" onClick={() => navigate('/')}><FiLogOut /> Sair</button>
    </aside>
  );
}