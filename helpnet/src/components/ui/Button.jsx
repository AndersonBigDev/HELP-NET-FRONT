const VARIANTS = {
  primary:
    "bg-accent text-white hover:bg-accent-hover disabled:opacity-50",
  secondary:
    "bg-surface-2 text-text border border-border hover:bg-surface-3 disabled:opacity-50",
  danger:
    "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 disabled:opacity-50",
  ghost:
    "text-text-muted hover:text-text hover:bg-surface-2 disabled:opacity-50",
};

export function Button({ variant = "primary", className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
