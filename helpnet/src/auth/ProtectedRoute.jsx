import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

// RF01/RN02: exige sessão válida. RF02/RN03: usuário comum com cadastro
// incompleto só pode acessar a tela de complemento de perfil.
export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const precisaCompletarPerfil = user.perfil === "USUARIO" && !user.cadastroCompleto;
  if (precisaCompletarPerfil && location.pathname !== "/completar-perfil") {
    return <Navigate to="/completar-perfil" replace />;
  }

  return <Outlet />;
}
