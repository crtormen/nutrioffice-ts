import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Slot } from "@radix-ui/react-slot";
import { GripVertical } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useComposedRefs } from "@/lib/compose-refs";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Context
 * -------------------------------------------------------------------------- */

type SortableContextValue = {
  activeId: UniqueIdentifier | null;
  orientation: "vertical" | "horizontal" | "mixed";
  flatCursor: boolean;
};

const SortableContext_ = React.createContext<SortableContextValue | null>(null);

function useSortableContext() {
  const context = React.useContext(SortableContext_);
  if (!context) {
    throw new Error("useSortableContext must be used within <Sortable />");
  }
  return context;
}

/* -----------------------------------------------------------------------------
 * Sortable (Root)
 * -------------------------------------------------------------------------- */

type SortableProps<T> = {
  value: T[];
  onValueChange: (value: T[]) => void;
  children: React.ReactNode;
  getItemValue?: (item: T) => UniqueIdentifier;
  orientation?: "vertical" | "horizontal" | "mixed";
  flatCursor?: boolean;
};

function Sortable<T>({
  value,
  onValueChange,
  children,
  getItemValue,
  orientation = "vertical",
  flatCursor = false,
}: SortableProps<T>) {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const ids = value.map((item) =>
        getItemValue ? getItemValue(item) : (item as UniqueIdentifier),
      );
      const oldIndex = ids.indexOf(active.id);
      const newIndex = ids.indexOf(over.id);

      onValueChange(arrayMove(value, oldIndex, newIndex));
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const modifiers =
    orientation === "vertical"
      ? [restrictToVerticalAxis, restrictToParentElement]
      : orientation === "horizontal"
        ? [restrictToParentElement]
        : [];

  return (
    <SortableContext_.Provider value={{ activeId, orientation, flatCursor }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={modifiers}
      >
        {children}
      </DndContext>
    </SortableContext_.Provider>
  );
}

/* -----------------------------------------------------------------------------
 * SortableContent
 * -------------------------------------------------------------------------- */

type SortableContentProps = {
  children: React.ReactNode;
  items: UniqueIdentifier[];
};

function SortableContent({ children, items }: SortableContentProps) {
  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  );
}

/* -----------------------------------------------------------------------------
 * SortableItem
 * -------------------------------------------------------------------------- */

type SortableItemContextValue = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  ref: (node: HTMLElement | null) => void;
};

const SortableItemContext =
  React.createContext<SortableItemContextValue | null>(null);

function useSortableItemContext() {
  const context = React.useContext(SortableItemContext);
  if (!context) {
    throw new Error(
      "useSortableItemContext must be used within <SortableItem />",
    );
  }
  return context;
}

type SortableItemProps = React.HTMLAttributes<HTMLDivElement> & {
  value: UniqueIdentifier;
  asHandle?: boolean;
  asChild?: boolean;
  disabled?: boolean;
};

const SortableItem = React.forwardRef<HTMLDivElement, SortableItemProps>(
  (
    { value, asHandle = false, asChild, disabled, className, style, ...props },
    forwardedRef,
  ) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: value, disabled });

    const { _activeId, _flatCursor } = useSortableContext();

    const ref = useComposedRefs(
      setNodeRef as React.Ref<HTMLDivElement>,
      forwardedRef,
    );
    const Comp = asChild ? Slot : "div";

    return (
      <SortableItemContext.Provider
        value={{
          attributes,
          listeners,
          ref: setActivatorNodeRef,
        }}
      >
        <Comp
          ref={ref}
          className={cn(className)}
          data-dragging={isDragging ? "" : undefined}
          data-disabled={disabled ? "" : undefined}
          style={{
            transform: CSS.Transform.toString(transform),
            transition,
            ...style,
          }}
          {...props}
        />
      </SortableItemContext.Provider>
    );
  },
);
SortableItem.displayName = "SortableItem";

/* -----------------------------------------------------------------------------
 * SortableItemHandle
 * -------------------------------------------------------------------------- */

type SortableItemHandleProps = React.ComponentPropsWithoutRef<typeof Button>;

const SortableItemHandle = React.forwardRef<
  HTMLButtonElement,
  SortableItemHandleProps
>(({ className, ...props }, forwardedRef) => {
  const {
    attributes,
    listeners,
    ref: setActivatorNodeRef,
  } = useSortableItemContext();

  const ref = useComposedRefs(
    setActivatorNodeRef as React.Ref<HTMLButtonElement>,
    forwardedRef,
  );

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("cursor-grab active:cursor-grabbing", className)}
      {...attributes}
      {...listeners}
      {...props}
    >
      <GripVertical className="h-4 w-4" />
    </Button>
  );
});
SortableItemHandle.displayName = "SortableItemHandle";

/* -----------------------------------------------------------------------------
 * SortableOverlay
 * -------------------------------------------------------------------------- */

type SortableOverlayProps = {
  children:
    | React.ReactNode
    | ((activeId: UniqueIdentifier | null) => React.ReactNode);
};

function SortableOverlay({ children }: SortableOverlayProps) {
  const { activeId } = useSortableContext();

  return (
    <DragOverlay>
      {activeId
        ? typeof children === "function"
          ? children(activeId)
          : children
        : null}
    </DragOverlay>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
};
