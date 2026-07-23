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
import { useEffect, useRef, useState } from "react";

import { useUpdateLeadMutation } from "@/app/state/features/leadsSlice";
import { IFunnel, ILead } from "@/domain/entities";
import { useAuth } from "@/infra/firebase";
import { Badge } from "@/components/ui/badge";

import { KanbanColumn } from "./KanbanColumn";
import { LeadCard, LeadCardOverlay } from "./LeadCard";

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

  const topScrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Keep the probe div width equal to the board's scroll width so the top
  // scrollbar thumb is the correct size and travels the correct distance.
  useEffect(() => {
    const board = boardRef.current;
    const probe = topScrollRef.current?.firstElementChild as HTMLElement | null;
    if (!board || !probe) return;
    const ro = new ResizeObserver(() => {
      probe.style.width = `${board.scrollWidth}px`;
    });
    ro.observe(board);
    return () => ro.disconnect();
  }, [sortedStages.length]);

  function syncFromTop() {
    const x = topScrollRef.current?.scrollLeft ?? 0;
    if (boardRef.current) boardRef.current.scrollLeft = x;
    if (headerRef.current) headerRef.current.scrollLeft = x;
  }
  function syncFromBoard() {
    const x = boardRef.current?.scrollLeft ?? 0;
    if (topScrollRef.current) topScrollRef.current.scrollLeft = x;
    if (headerRef.current) headerRef.current.scrollLeft = x;
  }

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
      {/* Top scrollbar — mirrors the board scroll */}
      <div
        ref={topScrollRef}
        className="overflow-x-auto"
        onScroll={syncFromTop}
      >
        <div style={{ height: 1, visibility: "hidden" }} className="board-width-probe" />
      </div>

      {/* Sticky column headers — outside the vertical scroll so they stay visible */}
      <div
        ref={headerRef}
        className="sticky top-0 z-20 overflow-x-hidden bg-background flex gap-4 pb-1"
      >
        {sortedStages.map((stage) => (
          <div
            key={stage.id}
            className="w-64 flex-shrink-0 flex items-center justify-between px-1 py-2"
            style={{ borderBottom: `2px solid ${stage.color}` }}
          >
            <span className="text-sm font-semibold truncate">{stage.label}</span>
            <Badge variant="secondary" className="text-xs ml-2">
              {leadsByStage(stage.id).length}
            </Badge>
          </div>
        ))}
      </div>

      <div
        ref={boardRef}
        className="flex gap-4 overflow-x-auto pb-4"
        onScroll={syncFromBoard}
      >
        {sortedStages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage(stage.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <LeadCardOverlay lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
