import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import './style.css'; // Opcional, geralmente vazio para esse componente

export default function ProtectedRoute() {
  const isAuthenticated = true; // Simulação: Aqui você validaria o token do localStorage
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}