// Par rótulo/valor dos cards de dados (RN05). Fica em <dl>. Valor vazio vira "—",
// convenção do projeto para dado que o backend ainda não expõe.
export function DataField({ label, value, className = "" }) {
  return (
    <div className={className}>
      <dt className="text-xs text-text-faint">{label}</dt>
      <dd className="text-text">{value || "—"}</dd>
    </div>
  );
}
