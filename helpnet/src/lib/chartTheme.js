// Os gráficos (Recharts) precisam de cores como string, não como classe do Tailwind.
// Lemos os tokens que o `@theme` de `index.css` publica em :root, com fallback para o
// valor literal caso a variável não esteja disponível (SSR, teste, tree-shaking).
const FALLBACK = {
  "--color-accent": "#7c5cff",
  "--color-info": "#3b82f6",
  "--color-warning": "#f59e0b",
  "--color-success": "#22c55e",
  "--color-danger": "#ef4444",
  "--color-surface": "#121722",
  "--color-surface-2": "#1a2030",
  "--color-border": "#262e42",
  "--color-text": "#e8eaf2",
  "--color-text-muted": "#9aa3b8",
  "--color-text-faint": "#626c85",
};

export function corToken(nome) {
  const chave = `--color-${nome}`;
  if (typeof window === "undefined") return FALLBACK[chave];
  const valor = getComputedStyle(document.documentElement).getPropertyValue(chave).trim();
  return valor || FALLBACK[chave];
}

// Cor semântica de `domain/enums.js` (success/warning/danger/info/neutral) → hex.
export function corSemantica(nome) {
  return nome && nome !== "neutral" ? corToken(nome) : corToken("text-faint");
}
