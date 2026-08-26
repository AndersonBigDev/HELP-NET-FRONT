import { useCallback, useEffect, useState } from "react";
import { chamadosApi } from "../api/chamadosApi";

// O `GET /chamados` só pagina — não filtra e não separa fila geral de minha fila.
// Buscamos a página cheia uma vez e todo o recorte (RF10/RF11) acontece no client.
// Fila, Detalhe e Dashboard consomem este mesmo hook.
const TAMANHO_PAGINA = 200;

export function useChamados() {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const recarregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await chamadosApi.listar({ size: TAMANHO_PAGINA });
      const lista = [...(page.content ?? [])];
      lista.sort((a, b) => new Date(b.dataAbertura) - new Date(a.dataAbertura));
      setChamados(lista);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { chamados, loading, error, recarregar };
}
