import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { ImportJobStatus } from "@/types/pipeline";

interface JobStatusBadgeProps {
  status: ImportJobStatus;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  switch (status) {
    case "pendente":
      return <Badge variant="default">Pendente</Badge>;
    case "processando":
      return (
        <Badge variant="info">
          <Spinner size="sm" />
          Processando...
        </Badge>
      );
    case "concluido":
      return <Badge variant="success">Concluído</Badge>;
    case "erro":
      return <Badge variant="error">Erro</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}
