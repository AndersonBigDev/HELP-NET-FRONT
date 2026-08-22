import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// ==========================================
// IMPORTS DAS PÁGINAS
// ==========================================
import Login from '../../pages/Auth/Login';

// Módulo: Cliente
import MeusChamados from '../../pages/Cliente/MeusChamados';
import NovoChamado from '../../pages/Cliente/NovoChamado';

// Módulo: Suporte
import Dashboard from '../../pages/Suporte/Dashboard';
import FilasAtendimento from '../../pages/Suporte/FilasAtendimento';
import DetalheChamado from '../../pages/Suporte/DetalheChamado';
import AberturaProxy from '../../pages/Suporte/AberturaProxy';
import GestaoUsuarios from "../../pages/Suporte/GestãoUsuarios";



// ==========================================
// IMPORTS DE LAYOUT (Componentes Comuns)
// ==========================================


import Header from "../../components/Layout/Header/index.jsx";
import Sidebar from "../../components/Layout/Sidebar/index.jsx";

/**
 * COMPONENTE DE LAYOUT BASE
 * Tudo que estiver dentro do <Outlet /> será renderizado ao lado da Sidebar.
 * Isso impede que a Sidebar apareça na tela de Login!
 */
const AppLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f9' }}>
      {/* O menu lateral fixo na esquerda */}
      <Sidebar />
      
      {/* O container principal da direita */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* O cabeçalho fixo no topo */}
        <Header />
        
        {/* A área onde as páginas (Dashboard, Filas, etc) vão aparecer */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet /> 
        </main>
        
      </div>
    </div>
  );
};
/**
 * PROTEÇÃO DE ROTAS E CONTROLE DE ACESSO (RBAC)
 * Simula a verificação se o usuário está logado e se tem permissão para a rota.
 * Quando seu colega terminar o Login, basta substituir essa lógica pelo Context API.
 */
const ProtectedRoute = ({ allowedRole }) => {
  // TODO: Substituir por um Hook real do seu Contexto de Autenticação, ex: const { user } = useAuth();
  const user = { 
    isAuthenticated: true, 
    role: 'suporte' // Troque para 'cliente' para testar a outra visão
  };

  if (!user.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Se logar como cliente e tentar acessar /suporte, volta para a home dele
    return <Navigate to={`/${user.role}`} replace />;
  }

  // Se passou nas validações, renderiza o Layout e as rotas filhas
  return <AppLayout />;
};

// ==========================================
// ROTEADOR PRINCIPAL
// ==========================================
export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA PÚBLICA */}
        <Route path="/login" element={<Login />} />

        {/* REDIRECIONAMENTO RAIZ */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ======================================= */}
        {/* ROTAS PRIVADAS: SUPORTE (Help Desk)     */}
        {/* ======================================= */}
        <Route element={<ProtectedRoute allowedRole="suporte" />}>
          {/* Ao acessar /suporte, joga pro dashboard direto */}
          <Route path="/suporte" element={<Navigate to="/suporte/dashboard" replace />} />
          
          <Route path="/suporte/dashboard" element={<Dashboard />} />
          <Route path="/suporte/filas" element={<FilasAtendimento />} />
          <Route path="/suporte/chamado/:id" element={<DetalheChamado />} />
          <Route path="/suporte/proxy" element={<AberturaProxy />} />
          <Route path="/suporte/usuarios" element={<GestaoUsuarios />} />
        </Route>

        {/* ======================================= */}
        {/* ROTAS PRIVADAS: CLIENTE                 */}
        {/* ======================================= */}
        <Route element={<ProtectedRoute allowedRole="cliente" />}>
          <Route path="/cliente" element={<Navigate to="/cliente/meus-chamados" replace />} />
          
          <Route path="/cliente/meus-chamados" element={<MeusChamados />} />
          <Route path="/cliente/novo-chamado" element={<NovoChamado />} />
        </Route>

        {/* ======================================= */}
        {/* FALLBACK: ROTA NÃO ENCONTRADA (404)     */}
        {/* ======================================= */}
        <Route path="*" element={
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <h1>404 - Página não encontrada</h1>
            <a href="/login">Voltar para o Início</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};