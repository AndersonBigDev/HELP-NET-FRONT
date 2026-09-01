import axios from "axios";
import { tokenExpirado } from "../auth/jwt";

const TOKEN_KEY = "helpnet.token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// O AuthContext se inscreve aqui para derrubar a sessão na tela quando o servidor
// recusa o token. Mora no client porque quem detecta a recusa é o interceptor.
let aoExpirarSessao = null;

export function onSessaoExpirada(callback) {
  aoExpirarSessao = callback;
  return () => {
    if (aoExpirarSessao === callback) aoExpirarSessao = null;
  };
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function sessaoInvalida() {
  const token = tokenStorage.get();
  return !token || tokenExpirado(token);
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // O backend não tem AuthenticationEntryPoint: requisição sem autenticação válida
    // volta 403 de corpo vazio, não 401. Como o mesmo 403 também significa "seu perfil
    // não pode fazer isso", olhamos a validade do token para separar os dois casos —
    // senão uma negativa de permissão derrubaria a sessão de quem está logado.
    if (status === 401 || (status === 403 && sessaoInvalida())) {
      tokenStorage.clear();
      aoExpirarSessao?.();
      return Promise.reject(new Error("Sua sessão expirou. Entre novamente."));
    }

    // Formato de erro do backend: StandardError { timestamp, status, error, path }.
    // As recusas do Spring Security não passam pelo GlobalExceptionHandler e chegam
    // sem corpo, então precisam de uma mensagem própria.
    const message =
      error.response?.data?.error ||
      (status === 403
        ? "Acesso negado. Seu perfil pode não ter permissão para isso, ou a sessão não é mais válida — saia e entre novamente."
        : null) ||
      error.message ||
      "Não foi possível completar a requisição.";

    // Preserva o status no Error. Sem isso a tela só recebe a string e não consegue
    // distinguir "rota não existe" (404) de "você não pode" (403) — distinção que hoje
    // importa, porque há endpoints que o front já consome e o backend ainda não expõe.
    const erro = new Error(message);
    erro.status = status ?? null;
    return Promise.reject(erro);
  },
);
