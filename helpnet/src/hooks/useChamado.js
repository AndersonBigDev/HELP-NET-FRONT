import { useCallback, useEffect, useState } from "react";
import { chamadosApi } from "../api/chamadosApi";

// Um chamado só, pelo `GET /chamados/{id}`.
//
// A tela de atendimento antes lia a lista inteira e achava o chamado pelo id da rota —
// 200 registros para mostrar um. Pior: depois de assumir ou pausar, era a lista toda que
// precisava ser recarregada para a tela refletir a mudança. Aqui `aplicar` recebe o
// chamado que o próprio PATCH devolveu e atualiza a tela sem nova requisição.
export function useChamado(id) {
  const [chamado, setChamado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const recarregar = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      setChamado(await chamadosApi.buscarPorId(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    recarregar();
  }, [recarregar]);

  return { chamado, loading, error, recarregar, aplicar: setChamado };
}
