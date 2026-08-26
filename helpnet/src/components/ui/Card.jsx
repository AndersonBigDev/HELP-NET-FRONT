export function Card({ className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-5 ${className}`}
      {...props}
    />
  );
}
