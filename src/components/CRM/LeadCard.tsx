import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { selectCrmSettings } from "@/app/state/features/settingsSlice";
import { useAppSelector } from "@/app/state/hooks";
import { ROUTES } from "@/app/router/routes";
import { ILead } from "@/domain/entities";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/infra/firebase";

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

function LeadCardContent({ lead }: { lead: ILead }) {
  const navigate = useNavigate();
  const { dbUid } = useAuth();
  const selectSettings = useMemo(() => selectCrmSettings(dbUid), [dbUid]);
  const crmSettings = useAppSelector(selectSettings);

  const inboxSetting = lead.chatwootInboxId != null
    ? crmSettings?.inboxSettings?.[lead.chatwootInboxId]
    : undefined;

  const createdAtDate = lead.createdAt ? new Date(lead.createdAt) : null;
  const elapsed =
    createdAtDate && !isNaN(createdAtDate.getTime())
      ? formatDistanceToNow(createdAtDate, { locale: ptBR, addSuffix: true })
      : "";

  return (
    <Card
      className="cursor-pointer select-none hover:border-primary/50 transition-colors"
      onClick={() => navigate(ROUTES.CRM.LEAD_DETAILS(lead.id!))}
    >
      <CardContent className="p-3 space-y-2">
        <p className="font-medium text-sm leading-tight min-w-0 truncate">
          {lead.name}
        </p>

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
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {SOURCE_LABELS[lead.source] ?? lead.source}
            </Badge>
            {inboxSetting && (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0 rounded-full border font-medium"
                style={{ borderColor: inboxSetting.color, color: inboxSetting.color }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: inboxSetting.color }}
                />
                {inboxSetting.label ?? `Inbox ${lead.chatwootInboxId}`}
              </span>
            )}
          </div>
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
  );
}

export function LeadCard({ lead }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCardContent lead={lead} />
    </div>
  );
}

export function LeadCardOverlay({ lead }: LeadCardProps) {
  return <LeadCardContent lead={lead} />;
}
