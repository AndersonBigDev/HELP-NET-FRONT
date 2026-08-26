import { useEffect, useState } from "react";
import { usuariosApi } from "../api/usuariosApi";
import { useAuth } from "../auth/AuthContext";

// O JWT só carrega `sub`, `nome` e `perfil` — nível e setor do atendente logado
// (necessários para o recorte "Minha Fila", RF10) vêm do GET /usuarios.
// De quebra, a lista serve para resolver o nome do solicitante a partir do e-mail,
// já que o ChamadoResponseDTO só devolve `emailSolicitante`.
export function useUsuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ativo = true;
    usuariosApi
      .listar({ size: 200, sort: "nome" })
      .then((page) => ativo && setUsuarios(page.content ?? []))
      .catch((err) => ativo && setError(err.message))
      .finally(() => ativo && setLoading(false));
    return () => {
      ativo = false;
    };
  }, []);

  const meuPerfil = usuarios.find((u) => u.email === user?.email) ?? null;
  const porEmail = (email) => usuarios.find((u) => u.email === email) ?? null;

  return { usuarios, meuPerfil, porEmail, loading, error };
}
