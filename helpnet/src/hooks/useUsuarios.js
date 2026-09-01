import { useEffect, useState } from "react";
import { usuariosApi } from "../api/usuariosApi";
import { useAuth } from "../auth/AuthContext";

// O JWT só carrega `sub` (e-mail), `nome` e `perfil` — nível e setor do atendente
// logado (necessários para o recorte "Minha Fila", RF10) vêm do GET /usuarios.
// De quebra, a lista resolve e-mail e cargo do solicitante a partir do
// `solicitanteId` que o ChamadoResponseDTO devolve.
//
// GET /usuarios é restrito a ADMIN/ATENDENTE no SecurityConfig: para o perfil
// USUARIO a chamada voltaria 403, então nem tentamos — o hook devolve lista vazia
// e quem consome cai nos dados que o próprio DTO do chamado já traz.
export function useUsuarios() {
  const { user } = useAuth();
  const podeListar = user?.perfil === "ATENDENTE" || user?.perfil === "ADMIN";

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(podeListar);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!podeListar) return;

    let ativo = true;
    usuariosApi
      .listar({ size: 200, sort: "nome" })
      .then((page) => ativo && setUsuarios(page.content ?? []))
      .catch((err) => ativo && setError(err.message))
      .finally(() => ativo && setLoading(false));
    return () => {
      ativo = false;
    };
  }, [podeListar]);

  const meuPerfil = usuarios.find((u) => u.email === user?.email) ?? null;
  const porId = (id) => (id == null ? null : (usuarios.find((u) => u.id === id) ?? null));

  return { usuarios, meuPerfil, porId, podeListar, loading, error };
}
