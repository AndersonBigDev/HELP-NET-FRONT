import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importação dos seus componentes do Módulo 1
// (Ajuste os caminhos relativos se a sua pasta de componentes estiver em outro local)
import Login from '../../components/Login';
import NovoChamado from '../../components/NovoChamado';
import GestaoUsuarios from '../../components/GestaoUsuarios';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redireciona a raiz para o login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rotas do Módulo 1 */}
        <Route path="/login" element={<Login />} />
        <Route path="/novo-chamado" element={<NovoChamado />} />
        <Route path="/gestao-usuarios" element={<GestaoUsuarios />} />

        {/* Fallback para rotas desconhecidas */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}