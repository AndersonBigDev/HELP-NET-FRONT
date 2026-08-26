import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

export function Spinner({ size = 18, className = "" }) {
  return <Loader2 size={size} className={`animate-spin text-accent ${className}`} />;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-14 text-center">
      <Icon size={28} className="text-text-faint" />
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="max-w-xs text-xs text-text-muted">{description}</p>}
    </div>
  );
}
