import { Badge } from "@/components/ui/badge";

interface GoalStatusBadgeProps {
  status: "achieved" | "active" | "expired" | "behind";
}

const statusConfig = {
  achieved: {
    label: "Alcançada",
    variant: "secondary" as const,
  },
  active: {
    label: "Em Andamento",
    variant: "default" as const,
  },
  expired: {
    label: "Expirada",
    variant: "outline" as const,
  },
  behind: {
    label: "Atrasada",
    variant: "destructive" as const,
  },
};

export const GoalStatusBadge = ({ status }: GoalStatusBadgeProps) => {
  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
