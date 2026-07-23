import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { IFunnelStage, ILead } from "@/domain/entities";

import { LeadCard } from "./LeadCard";

interface KanbanColumnProps {
  stage: IFunnelStage;
  leads: ILead[];
}

export function KanbanColumn({ stage, leads }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[120px] rounded-lg p-1.5 transition-colors ${
          isOver ? "bg-primary/5" : "bg-muted/30"
        }`}
      >
        <SortableContext
          items={leads.map((l) => l.id!)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            Sem leads
          </div>
        )}
      </div>
    </div>
  );
}
