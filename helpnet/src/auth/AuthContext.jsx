import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";
import { onSessaoExpirada, tokenStorage } from "../api/client";
import { lerPayload, tokenExpirado } from "./jwt";

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
  const payload = lerPayload(token);
  if (!payload) return null;
  return {
    email: payload.sub,
    nome: payload.nome,
    perfil: payload.perfil,
  };
}

// Monta o usuário a partir do token guardado, recusando token expirado ou ilegível.
// Sem essa checagem a sessão "parecia" viva (o JWT decodifica sem validar `exp`) e a
// tela abria normalmente, mas toda chamada à API voltava 403.
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

  return { ...decoded, cadastroCompleto: readCadastroCompleto(decoded.email) };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(usuarioDoTokenSalvo);

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

  // Quando o servidor recusa o token no meio da navegação, o interceptor avisa aqui e
  // a sessão cai na hora — em vez de deixar a tela montada errando a cada requisição.
  useEffect(() => onSessaoExpirada(logout), [logout]);

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
