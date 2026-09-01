import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { onSessaoExpirada, tokenStorage } from "../api/client";
import { lerPayload, tokenExpirado } from "./jwt";

// O JWT carrega `sub` (e-mail), `id`, `nome` e `perfil` — ver JwtService.gerarToken
// no backend. O `id` é o que permite reconhecer os próprios chamados sem depender
// de GET /usuarios, que é bloqueado para o perfil USUARIO.
function decodeUser(token) {
  const payload = lerPayload(token);
  if (!payload) return null;
  return {
    id: payload.id ?? null,
    email: payload.sub,
    nome: payload.nome,
    perfil: payload.perfil,
  };
}

// Monta o usuário a partir do token guardado, recusando token expirado ou ilegível.
// Sem essa checagem a sessão "parecia" viva (o JWT decodifica sem validar `exp`) e a
// tela abria normalmente, mas toda chamada à API voltava erro.
function usuarioDoTokenSalvo() {
  const token = tokenStorage.get();
  if (!token || tokenExpirado(token)) {
    tokenStorage.clear();
    return null;
  }

  const decoded = decodeUser(token);
  if (!decoded) {
    tokenStorage.clear();
    return null;
  }

  return decoded;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(usuarioDoTokenSalvo);

  const login = useCallback(async (email, senha) => {
    const { token } = await authApi.login(email, senha);
    tokenStorage.set(token);
    const decoded = decodeUser(token);
    setUser(decoded);
    return decoded;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Quando o servidor recusa o token no meio da navegação, o interceptor avisa aqui e
  // a sessão cai na hora — em vez de deixar a tela montada errando a cada requisição.
  useEffect(() => onSessaoExpirada(logout), [logout]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
