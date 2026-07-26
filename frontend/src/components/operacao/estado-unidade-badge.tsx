import { Badge } from "../ui/badge";
import { nomesEstadosConsolidadosUnidade, type EstadoConsolidadoUnidade } from "../../types/database";

const variants: Record<EstadoConsolidadoUnidade, "success" | "info" | "warning" | "highlight" | "muted"> = {
  disponivel: "success",
  reservada: "info",
  preparando: "warning",
  pronta_checkin: "highlight",
  ocupada: "info",
  aguardando_limpeza: "warning",
  em_limpeza: "warning",
  manutencao: "warning",
  bloqueada: "muted",
};

export function EstadoUnidadeBadge({ estado }: { estado: EstadoConsolidadoUnidade }) {
  return <Badge variant={variants[estado]}>{nomesEstadosConsolidadosUnidade[estado]}</Badge>;
}
