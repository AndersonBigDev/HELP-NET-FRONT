import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Restringe uma rota a um subconjunto de perfis (ex: RF03/RF04 — só
// ATENDENTE/ADMIN acessam a tela de Usuários).
export function RoleRoute({ allow }) {
  const { user } = useAuth();

  if (!user || !allow.includes(user.perfil)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
