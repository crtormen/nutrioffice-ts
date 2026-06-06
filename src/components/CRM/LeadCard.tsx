import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRightLeft, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/app/router/routes";
import { ILead } from "@/domain/entities";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  site: "Site",
  indicacao: "Indicação",
  outro: "Outro",
};

interface LeadCardProps {
  lead: ILead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const elapsed = lead.createdAt
    ? formatDistanceToNow(new Date(lead.createdAt), { locale: ptBR, addSuffix: true })
    : "";

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className="cursor-pointer select-none hover:border-primary/50 transition-colors"
        onClick={() => navigate(ROUTES.CRM.LEAD_DETAILS(lead.id!))}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div
              className="cursor-grab active:cursor-grabbing touch-none p-0.5 -ml-1 text-muted-foreground hover:text-foreground"
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowRightLeft size={12} />
            </div>
            <p className="font-medium text-sm leading-tight flex-1 min-w-0 truncate">
              {lead.name}
            </p>
          </div>

          {lead.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone size={10} />
              <span>{lead.phone}</span>
            </div>
          )}

          {lead.interest && (
            <p className="text-xs text-muted-foreground truncate">{lead.interest}</p>
          )}

          <div className="flex items-center justify-between gap-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {SOURCE_LABELS[lead.source] ?? lead.source}
            </Badge>
            {lead.isConverted && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-500">
                Cliente
              </Badge>
            )}
          </div>

          {lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lead.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {lead.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{lead.tags.length - 3}</span>
              )}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">{elapsed}</p>
        </CardContent>
      </Card>
    </div>
  );
}
