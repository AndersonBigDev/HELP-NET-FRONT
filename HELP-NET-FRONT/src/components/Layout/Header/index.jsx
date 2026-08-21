import React from 'react';
import { FiUser } from 'react-icons/fi';
import './style.css';

export default function Header() {
  return (
    <header className="layout-header">
      <div className="header-title">Sistema de Gestão de Chamados</div>
      <div className="header-user">
        <FiUser /> <span>usuario@helpdesk.com</span>
      </div>
    </header>
  );
}