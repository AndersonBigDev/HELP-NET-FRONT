import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { RoleRoute } from "./auth/RoleRoute";
import { useAuth } from "./auth/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/Atendimento/DashboardPage";
import { DetalheChamadoPage } from "./pages/Atendimento/DetalheChamadoPage";
import { FilasAtendimentoPage } from "./pages/Atendimento/FilasAtendimentoPage";
import { MeusChamadosPage } from "./pages/Chamados/MeusChamadosPage";
import { CompletarPerfilPage } from "./pages/CompletarPerfil/CompletarPerfilPage";
import { LoginPage } from "./pages/Login/LoginPage";
import { UsuariosPage } from "./pages/Usuarios/UsuariosPage";

function Home() {
  const { user } = useAuth();
  return user?.perfil === "USUARIO" ? (
    <Navigate to="/meus-chamados" replace />
  ) : (
    <Navigate to="/atendimento" replace />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/completar-perfil" element={<CompletarPerfilPage />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/meus-chamados" element={<MeusChamadosPage />} />

          {/* Módulo 2 — área de atendimento, restrita a ATENDENTE/ADMIN. */}
          <Route element={<RoleRoute allow={["ATENDENTE", "ADMIN"]} />}>
            <Route path="/atendimento" element={<FilasAtendimentoPage />} />
            <Route path="/atendimento/chamados/:id" element={<DetalheChamadoPage />} />
            <Route path="/atendimento/dashboard" element={<DashboardPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
