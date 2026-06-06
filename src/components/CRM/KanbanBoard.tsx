import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";

import { useUpdateLeadMutation } from "@/app/state/features/leadsSlice";
import { IFunnel, ILead } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";

import { KanbanColumn } from "./KanbanColumn";
import { LeadCard } from "./LeadCard";

interface KanbanBoardProps {
  funnel: IFunnel;
  leads: ILead[];
}

export function KanbanBoard({ funnel, leads }: KanbanBoardProps) {
  const { dbUid } = useAuth();
  const [updateLead] = useUpdateLeadMutation();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sortedStages = [...funnel.stages].sort((a, b) => a.order - b.order);

  const leadsByStage = (stageId: string) =>
    leads.filter((l) => l.stage === stageId);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !dbUid) return;

    const overId = over.id as string;
    const activeId = active.id as string;

    // Determine the target stage: over could be a column (stage id) or a lead card
    const targetStageId =
      sortedStages.find((s) => s.id === overId)?.id ??
      leads.find((l) => l.id === overId)?.stage;

    if (!targetStageId) return;
    const activeLead = leads.find((l) => l.id === activeId);
    if (!activeLead || activeLead.stage === targetStageId) return;

    // Optimistic update — persist on dragEnd too
    updateLead({ uid: dbUid, leadId: activeId, updates: { stage: targetStageId } });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !dbUid) return;

    const overId = over.id as string;
    const activeId = active.id as string;

    const targetStageId =
      sortedStages.find((s) => s.id === overId)?.id ??
      leads.find((l) => l.id === overId)?.stage;

    if (!targetStageId) return;
    const activeLead = leads.find((l) => l.id === activeId);
    if (!activeLead || activeLead.stage === targetStageId) return;

    updateLead({ uid: dbUid, leadId: activeId, updates: { stage: targetStageId } });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedStages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage(stage.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
