import { Clock } from "lucide-react";
import { Badge } from "./Badge";
import { calcularSla } from "../../domain/sla";

// RNF03: item da fila destaca em vermelho quando o SLA estourou.
export function SlaTag({ chamado, className = "" }) {
  const sla = calcularSla(chamado);

  return (
    <Badge color={sla.color} className={`gap-1 ${className}`}>
      <Clock size={12} />
      {sla.label}
    </Badge>
  );
}
