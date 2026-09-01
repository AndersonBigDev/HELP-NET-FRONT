import { jwtDecode } from "jwt-decode";

export function lerPayload(token) {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

// O backend não configura AuthenticationEntryPoint, então token expirado não volta 401:
// `JwtService.validarETrazerSubject` engole a ExpiredJwtException, devolve null, o filtro
// não autentica e a requisição termina em 403 de corpo vazio — indistinguível, no HTTP, de
// "seu perfil não pode fazer isso". Por isso a validade é conferida aqui, no cliente.
//
// Margem de 5s para não aceitar um token que expira no meio da viagem.
const MARGEM_MS = 5000;

export function tokenExpirado(token) {
  const payload = lerPayload(token);
  if (!payload) return true; // malformado: tratamos como sessão inválida
  if (!payload.exp) return false; // sem `exp`: deixa o servidor decidir
  return payload.exp * 1000 <= Date.now() + MARGEM_MS;
}
