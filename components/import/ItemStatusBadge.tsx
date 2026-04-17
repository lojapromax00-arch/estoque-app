import { Badge } from "@/components/ui/Badge";
import type { ItemStatus } from "@/types/pipeline";

interface ItemStatusBadgeProps {
  status: ItemStatus;
}

const statusConfig: Record<ItemStatus, { label: string; variant: "success" | "warning" | "error" | "info" | "default" }> = {
  pendente: { label: "Pendente", variant: "default" },
  processando: { label: "Processando", variant: "info" },
  aprovado_automaticamente: { label: "Aprovado", variant: "success" },
  bloqueado_por_duvida: { label: "Bloqueado", variant: "warning" },
  erro_tecnico: { label: "Erro", variant: "error" },
  sincronizado_tray: { label: "Sync Tray ✓", variant: "success" },
};

export function ItemStatusBadge({ status }: ItemStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
