import { jwtDecode } from "jwt-decode";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { tokenStorage } from "../api/client";

// RN03/RF02: o backend não expõe um "quem sou eu" para o perfil USUARIO
// (GET /usuarios é restrito a ADMIN/ATENDENTE, e o JWT não carrega
// `cadastroCompleto`). Guardamos essa flag localmente, por e-mail, assim
// que o complemento de perfil é confirmado no servidor.
function cadastroCompletoKey(email) {
  return `helpnet.cadastroCompleto.${email}`;
}

function readCadastroCompleto(email) {
  return localStorage.getItem(cadastroCompletoKey(email)) === "true";
}

function decodeUser(token) {
  const payload = jwtDecode(token);
  return {
    email: payload.sub,
    nome: payload.nome,
    perfil: payload.perfil,
  };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = tokenStorage.get();
    if (!token) return null;
    try {
      const decoded = decodeUser(token);
      return { ...decoded, cadastroCompleto: readCadastroCompleto(decoded.email) };
    } catch {
      tokenStorage.clear();
      return null;
    }
  });

  const login = useCallback(async (email, senha) => {
    const { token } = await authApi.login(email, senha);
    tokenStorage.set(token);
    const decoded = decodeUser(token);
    const next = { ...decoded, cadastroCompleto: readCadastroCompleto(decoded.email) };
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const markCadastroCompleto = useCallback(() => {
    setUser((current) => {
      if (!current) return current;
      localStorage.setItem(cadastroCompletoKey(current.email), "true");
      return { ...current, cadastroCompleto: true };
    });
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, markCadastroCompleto }),
    [user, login, logout, markCadastroCompleto],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
