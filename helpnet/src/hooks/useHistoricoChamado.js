import { useCallback, useEffect, useState } from "react";
import { historicoApi } from "../api/historicoApi";

// Trilha de eventos do chamado. Fica em hook porque duas telas consomem a mesma
// coisa com permissões diferentes: a área de atendimento (lê e escreve) e "Meus
// Chamados", onde o solicitante acompanha em modo leitura.
export function useHistoricoChamado(chamadoId) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [semBackend, setSemBackend] = useState(false);

  const recarregar = useCallback(async () => {
    if (!chamadoId) return;
    setError(null);
    try {
      setEventos(await historicoApi.listar(chamadoId));
      setSemBackend(false);
    } catch (err) {
      // Mesmo tratamento do chat (ChamadoMensagens) e da troca de senha: enquanto o
      // servidor não expõe /chamados/{id}/historico a rota volta 404, que não é falha
      // do usuário nem do chamado e não merece banner de erro — vira aviso próprio.
      // Qualquer outro status (400, 403) continua sendo erro de verdade.
      if (err.status === 404) {
        setSemBackend(true);
        setEventos([]);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [chamadoId]);

  useEffect(() => {
    setLoading(true);
    recarregar();
  }, [recarregar]);

  // Toda interação pode gerar mais de um evento no servidor (assumir com relato grava
  // a atribuição e a anotação), então a tela relê a trilha em vez de tentar remontá-la
  // no cliente a partir da resposta de uma chamada só.
  return { eventos, loading, error, semBackend, recarregar };
}
