import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  ACENTO_PADRAO,
  CHAVE_ACENTO,
  CHAVE_MODO,
  MODO_PADRAO,
  normalizarAcento,
  normalizarModo,
} from "./temas";

const CONSULTA_CLARO = "(prefers-color-scheme: light)";

// localStorage pode lançar (navegação privada, cookies bloqueados). Preferência
// de tema é conveniência: se não der para ler ou gravar, o app segue no padrão.
function lerPreferencia(chave, padrao) {
  try {
    return localStorage.getItem(chave) ?? padrao;
  } catch {
    return padrao;
  }
}

function gravarPreferencia(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* sem persistência: vale só para esta sessão */
  }
}

function preferenciaDoSistema() {
  return window.matchMedia(CONSULTA_CLARO).matches ? "claro" : "escuro";
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [modo, definirModo] = useState(() => normalizarModo(lerPreferencia(CHAVE_MODO, MODO_PADRAO)));
  const [acento, definirAcento] = useState(() =>
    normalizarAcento(lerPreferencia(CHAVE_ACENTO, ACENTO_PADRAO)),
  );
  const [modoDoSistema, setModoDoSistema] = useState(preferenciaDoSistema);

  // Incrementado depois que o tema é aplicado no <html>. Serve para quem lê cor
  // direto da variável CSS (os gráficos do dashboard, via `chartTheme`): esses
  // valores não passam pelo React, então precisam de um sinal para recalcular —
  // e o sinal só pode chegar num render POSTERIOR ao carimbo, senão a leitura
  // ainda devolve a paleta antiga.
  const [versaoTema, setVersaoTema] = useState(0);

  // No modo "sistema" a tela acompanha o SO em tempo real, inclusive quando o
  // usuário troca o tema do Windows com o app já aberto.
  useLayoutEffect(() => {
    const consulta = window.matchMedia(CONSULTA_CLARO);
    const sincronizar = () => setModoDoSistema(consulta.matches ? "claro" : "escuro");

    consulta.addEventListener("change", sincronizar);
    // Rede de segurança: existe ambiente que atualiza `matches` sem disparar o
    // `change` (o emulador do DevTools é um deles). Ao voltar para a aba a gente
    // reconfere, em vez de depender só do evento.
    document.addEventListener("visibilitychange", sincronizar);

    return () => {
      consulta.removeEventListener("change", sincronizar);
      document.removeEventListener("visibilitychange", sincronizar);
    };
  }, []);

  // "sistema" é a preferência guardada; `modoEfetivo` é o que está na tela.
  const modoEfetivo = modo === "sistema" ? modoDoSistema : modo;

  // useLayoutEffect (e não useEffect) para o carimbo acontecer antes do paint:
  // com useEffect a tela chega a desenhar um quadro no tema anterior.
  useLayoutEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.theme = modoEfetivo === "claro" ? "light" : "dark";
    raiz.dataset.accent = acento;
    setVersaoTema((v) => v + 1);
  }, [modoEfetivo, acento]);

  const escolherModo = useCallback((novo) => {
    const valido = normalizarModo(novo);
    definirModo(valido);
    gravarPreferencia(CHAVE_MODO, valido);
  }, []);

  const escolherAcento = useCallback((novo) => {
    const valido = normalizarAcento(novo);
    definirAcento(valido);
    gravarPreferencia(CHAVE_ACENTO, valido);
  }, []);

  const value = useMemo(
    () => ({ modo, modoEfetivo, acento, versaoTema, escolherModo, escolherAcento }),
    [modo, modoEfetivo, acento, versaoTema, escolherModo, escolherAcento],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de <ThemeProvider>");
  return ctx;
}
