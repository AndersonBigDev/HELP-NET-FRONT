import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

// RF01/RN02: exige sessão válida.
//
// O desvio para /completar-perfil saiu daqui: cargo e setor passaram a ser
// obrigatórios na criação do usuário (UserCreateDTO), então não existe mais
// "cadastro pendente" — e o endpoint que aquela tela chamava
// (PATCH /usuarios/complementar-perfil) foi removido do backend, o que prendia
// todo perfil USUARIO numa tela que só sabia dar erro.
export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
