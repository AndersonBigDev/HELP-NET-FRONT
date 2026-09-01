import { useCallback, useEffect, useState } from "react";
import { equipamentosApi } from "../api/equipamentosApi";

// GET /equipamentos só pagina — não aceita busca nem filtro, então (como na fila de
// chamados) puxamos a página cheia e todo o recorte da tela acontece no client.
// A rota devolve apenas equipamentos ativos.
const TAMANHO_PAGINA = 200;

export function useEquipamentos() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const recarregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await equipamentosApi.listar({ size: TAMANHO_PAGINA, sort: "nome" });
      setEquipamentos(page.content ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { equipamentos, loading, error, recarregar };
}
