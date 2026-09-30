import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { toneColumn, toneDot, type Tone } from "./ui";
import { cx } from "../lib/format";

interface KanbanProps<T extends { id: string }, S extends string> {
  statuses: readonly S[];
  items: T[];
  getStatus: (item: T) => S;
  tones: Record<S, Tone>;
  renderCard: (item: T) => ReactNode;
  onMove: (item: T, to: S) => void;
  onOpen: (item: T) => void;
  columnMeta?: (status: S, items: T[]) => ReactNode;
}

export function Kanban<T extends { id: string }, S extends string>(props: KanbanProps<T, S>) {
  const { statuses, items, getStatus, onMove } = props;
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] } }),
  );
  const active = items.find((i) => i.id === activeId);

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const item = items.find((i) => i.id === e.active.id);
    const to = e.over?.id as S | undefined;
    if (item && to && getStatus(item) !== to) onMove(item, to);
  };

  return (
    <DndContext sensors={sensors} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {statuses.map((s) => (
          <Column key={s} status={s} {...props} items={items.filter((i) => getStatus(i) === s)} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.16,1,0.3,1)" }}>
        {active && <div className="rotate-2 cursor-grabbing rounded-xl border border-zinc-900 bg-white p-3 shadow-2xl dark:border-zinc-300 dark:bg-zinc-950">{props.renderCard(active)}</div>}
      </DragOverlay>
    </DndContext>
  );
}

function Column<T extends { id: string }, S extends string>({ status, items, tones, renderCard, onOpen, columnMeta }: KanbanProps<T, S> & { status: S }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-72 shrink-0 snap-start flex-col lg:w-auto lg:min-w-60 lg:flex-1">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={cx("size-2 rounded-full", toneDot[tones[status]])} />
        <h3 className="label-mono font-bold">{status}</h3>
        <span className="font-mono text-xs text-zinc-400 tabular">{String(items.length).padStart(2, "0")}</span>
        <div className="ml-auto font-mono text-xs text-zinc-500 tabular">{columnMeta?.(status, items)}</div>
      </div>
      <div
        ref={setNodeRef}
        className={cx(
          "flex min-h-40 flex-1 flex-col gap-2 rounded-2xl border border-dashed p-2 transition-colors",
          isOver ? "border-zinc-900 bg-white/80 dark:border-zinc-300 dark:bg-zinc-900" : cx("border-zinc-300 dark:border-zinc-800", toneColumn[tones[status]]),
        )}
      >
        {items.map((item) => (
          <Card key={item.id} item={item} onOpen={onOpen}>
            {renderCard(item)}
          </Card>
        ))}
      </div>
    </div>
  );
}

function Card<T extends { id: string }>({ item, onOpen, children }: { item: T; onOpen(item: T): void; children: ReactNode }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === "Enter" && !isDragging) onOpen(item);
      }}
      className={cx(
        "cursor-grab touch-manipulation rounded-xl border border-zinc-200/70 bg-white p-3 transition hover:border-zinc-900 focus-visible:outline-2 focus-visible:outline-signal dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-400",
        isDragging && "opacity-30",
      )}
    >
      {children}
    </div>
  );
}
