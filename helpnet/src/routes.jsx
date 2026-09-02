import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { RoleRoute } from "./auth/RoleRoute";
import { useAuth } from "./auth/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/Atendimento/DashboardPage";
import { DetalheChamadoPage } from "./pages/Atendimento/DetalheChamadoPage";
import { FilasAtendimentoPage } from "./pages/Atendimento/FilasAtendimentoPage";
import { MeusChamadosPage } from "./pages/Chamados/MeusChamadosPage";
import { EquipamentosPage } from "./pages/Equipamentos/EquipamentosPage";
import { LoginPage } from "./pages/Login/LoginPage";
import { UsuariosPage } from "./pages/Usuarios/UsuariosPage";

// Tela inicial por perfil. Quem atende cai no dashboard: é a visão da operação
// inteira e, com os indicadores clicáveis, também o caminho mais curto para cada
// recorte da fila. O perfil USUARIO não alcança a área de atendimento (RoleRoute),
// então continua indo para os próprios chamados.
function Home() {
  const { user } = useAuth();
  return user?.perfil === "USUARIO" ? (
    <Navigate to="/meus-chamados" replace />
  ) : (
    <Navigate to="/atendimento/dashboard" replace />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/meus-chamados" element={<MeusChamadosPage />} />
          {/* O backend libera GET /equipamentos para qualquer autenticado e recorta
              o resultado por perfil, então a rota fica fora do RoleRoute — o perfil
              USUARIO vê a listagem do próprio setor, em modo leitura. */}
          <Route path="/equipamentos" element={<EquipamentosPage />} />

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
