import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AppShell } from "@/components/AppShell";
import { BacklogRail } from "@/components/BacklogRail";
import { ChannelFilterBar } from "@/components/ChannelFilterBar";
import { DaySection } from "@/components/DaySection";
import { TaskCard } from "@/components/TaskItem";
import { ObjectivesStrip } from "@/components/ObjectivesStrip";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { useChannels } from "@/hooks/useChannels";
import { useObjectives } from "@/hooks/useObjectives";
import { useTaskRange } from "@/hooks/useTaskRange";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { qk } from "@/lib/queryKeys";
import type { Task } from "@/types";

export function MultiDayView() {
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [backlogOpen, setBacklogOpen] = useState(false);
  const { channels, addChannel, editChannel, removeChannel } = useChannels();
  const channelById = useMemo(
    () => new Map(channels.map((c) => [c.id, c])),
    [channels],
  );
  const queryClient = useQueryClient();
  const range = useTaskRange(channelFilter);
  const {
    days,
    today,
    isLoading,
    error,
    loadEarlier,
    loadLater,
    editTask,
    addTask,
    toggleTaskDone,
    removeTask,
    addSubtask,
    toggleSubtask,
    renameSubtask,
    removeSubtask,
    startTimer,
    stopTimer,
  } = range;

  const { objectives } = useObjectives(today);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const toggleChannel = useCallback(
    (id: string) =>
      setChannelFilter((cur) =>
        cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id],
      ),
    [],
  );

  // Move a scheduled task back to the backlog (refreshes range + backlog list).
  // editTask already invalidates the range root on settle; the task also leaves
  // the day window, so refresh the backlog list it now belongs to.
  const sendToBacklog = useCallback(
    async (id: string) => {
      await editTask(id, { plannedDate: null });
      await queryClient.invalidateQueries({ queryKey: qk.backlog });
    },
    [editTask, queryClient],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const leftSentinel = useRef<HTMLDivElement>(null);
  const rightSentinel = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  // For horizontal scroll anchoring when prepending earlier days on the left.
  const firstDate = days[0]?.date;
  const prevFirstDate = useRef<string | undefined>(undefined);
  const prevScrollWidth = useRef(0);

  // Find the selected task across all buckets so the panel reflects mutations.
  const selectedTask = findTask(days, selectedId);

  // Scroll to "today" once, after the first load (today sits near the left).
  useEffect(() => {
    if (didInitialScroll.current || days.length === 0) return;
    didInitialScroll.current = true;
    document.getElementById(`day-${today}`)?.scrollIntoView({ inline: "start", block: "nearest" });
  }, [days.length, today]);

  // Preserve horizontal scroll position when earlier days are prepended.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prevFirstDate.current && firstDate && firstDate !== prevFirstDate.current) {
      const delta = el.scrollWidth - prevScrollWidth.current;
      if (delta > 0) el.scrollLeft += delta;
    }
    prevFirstDate.current = firstDate;
  }, [firstDate]);

  const handleLoadEarlier = useCallback(() => {
    if (scrollRef.current) prevScrollWidth.current = scrollRef.current.scrollWidth;
    loadEarlier();
  }, [loadEarlier]);

  // Infinite scroll: observe sentinels at the left and right edges.
  useEffect(() => {
    const left = leftSentinel.current;
    const right = rightSentinel.current;
    const root = scrollRef.current;
    if (!left || !right || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.target === right) loadLater();
          else if (entry.target === left && didInitialScroll.current) handleLoadEarlier();
        }
      },
      { root, rootMargin: "300px" },
    );
    observer.observe(left);
    observer.observe(right);
    return () => observer.disconnect();
  }, [loadLater, handleLoadEarlier]);

  const goToDate = useCallback((date: string) => {
    document
      .getElementById(`day-${date}`)
      ?.scrollIntoView({ inline: "start", block: "nearest", behavior: "smooth" });
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      void removeTask(id);
      setSelectedId((cur) => (cur === id ? null : cur));
    },
    [removeTask],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const [settleTaskId, setSettleTaskId] = useState<string | null>(null);
  const settleRef = useRef<{ taskId: string; sourceDate: string } | null>(null);

  useEffect(() => {
    const settle = settleRef.current;
    if (!settle) return;
    const { taskId, sourceDate } = settle;

    for (const day of days) {
      const found = day.live.some((a) => a.task.id === taskId);
      if (found && day.date !== sourceDate) {
        settleRef.current = null;
        setSettleTaskId(null);
        setActiveTask(null);
        return;
      }
    }
  }, [days]);

  useEffect(() => {
    if (!settleTaskId) return;
    const timer = setTimeout(() => {
      settleRef.current = null;
      setSettleTaskId(null);
      setActiveTask(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [settleTaskId]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      setActiveTask(null);
      return;
    }
    const draggedTask = active.data.current?.task as Task | undefined;
    // Both day columns and task cards expose a calendar `date` (YYYY-MM-DD) in
    // their dnd data, so source/target comparisons stay in one consistent format.
    const sourceDate = active.data.current?.date as string | undefined;
    const overDate = over.data.current?.date as string | undefined;

    if (!draggedTask || !overDate) {
      setActiveTask(null);
      return;
    }

    const dayBucket = days.find((d) => d.date === overDate);

    if (sourceDate !== overDate) {
      // Cross-day move.
      settleRef.current = { taskId: draggedTask.id, sourceDate: sourceDate ?? "" };
      setSettleTaskId(draggedTask.id);
      if (over.data.current?.type === "Task" && dayBucket) {
        // Insert at the dropped position within the target day.
        const newIds = dayBucket.live.map((a) => a.task.id).filter((id) => id !== draggedTask.id);
        const targetIndex = dayBucket.live.findIndex((a) => a.task.id === over.id);
        const insertAt = targetIndex >= 0 ? Math.min(targetIndex, newIds.length) : newIds.length;
        newIds.splice(insertAt, 0, draggedTask.id);
        void range.moveAndReorder(draggedTask.id, overDate, newIds);
      } else {
        // Dropped on the column itself: append to the end.
        const lastOrder = dayBucket?.live.length
          ? Math.max(...dayBucket.live.map((a) => a.task.order ?? 0))
          : -1;
        void range.moveTask(draggedTask.id, overDate, lastOrder + 1);
      }
    } else {
      // Same-day reorder.
      setActiveTask(null);
      if (active.id !== over.id && dayBucket) {
        const ids = dayBucket.live.map((a) => a.task.id);
        const oldIndex = ids.indexOf(active.id as string);
        const newIndex = ids.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newIds = [...ids];
          newIds.splice(oldIndex, 1);
          newIds.splice(newIndex, 0, active.id as string);
          void range.reorderTasks(newIds);
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        settleRef.current = null;
        setActiveTask(null);
        setSettleTaskId(null);
      }}
    >
      <AppShell>
      <div className="flex h-full flex-col">
        <ChannelFilterBar
          channels={channels}
          selectedIds={channelFilter}
          onToggle={toggleChannel}
          onClear={() => setChannelFilter([])}
          onCreate={addChannel}
          onEdit={(id, input) => editChannel(id, input)}
          onDelete={(id) => removeChannel(id)}
          rightSlot={
            <button
              onClick={() => setBacklogOpen((v) => !v)}
              className={`rounded-control px-2.5 py-1 text-xs transition-colors ${
                backlogOpen
                  ? "bg-primary-soft text-primary"
                  : "text-ink-muted hover:bg-primary-soft/60"
              }`}
            >
              ≣ Backlog
            </button>
          }
        />
        <ObjectivesStrip weekAnchor={today} channels={channels} />

        <div className="flex min-h-0 flex-1">
          {isLoading && days.length === 0 ? (
            <p className="p-6 text-sm text-ink-muted">Loading your days…</p>
          ) : error ? (
            <p className="p-6 text-sm text-danger">{getErrorMessage(error)}</p>
          ) : (
            <div ref={scrollRef} className="flex h-full flex-1 overflow-x-auto">
              <div ref={leftSentinel} className="w-px shrink-0" />
              {days.map((day) => (
                <DaySection
                  key={day.date}
                  day={day}
                  todayStr={today}
                  selectedId={selectedId}
                  channelById={channelById}
                  onSelect={setSelectedId}
                  onAddTask={addTask}
                  onToggleTask={toggleTaskDone}
                  onToggleSubtask={toggleSubtask}
                  onDeleteTask={handleDelete}
                  onGoToDate={goToDate}
                  settleTaskId={settleTaskId}
                />
              ))}
              <div ref={rightSentinel} className="w-px shrink-0" />
            </div>
          )}

          {selectedTask ? (
            <TaskDetailPanel
              task={selectedTask}
              channels={channels}
              objectives={objectives}
              onClose={() => setSelectedId(null)}
              onSendToBacklog={sendToBacklog}
              editTask={editTask}
              addSubtask={addSubtask}
              toggleSubtask={toggleSubtask}
              renameSubtask={renameSubtask}
              removeSubtask={removeSubtask}
              startTimer={startTimer}
              stopTimer={stopTimer}
            />
          ) : null}

          {backlogOpen ? (
            <BacklogRail today={today} onClose={() => setBacklogOpen(false)} />
          ) : null}
        </div>
      </div>
      </AppShell>
      <DragOverlay dropAnimation={null}>
        {activeTask || settleTaskId ? (
          (() => {
            const overlayTask = activeTask || findTask(days, settleTaskId)!;
            return (
              <TaskCard
                task={overlayTask}
                channel={overlayTask.channelRef ? channelById.get(overlayTask.channelRef) ?? null : null}
                onToggle={() => {}}
                onDelete={() => {}}
                onSelect={() => {}}
                isOverlay
              />
            );
          })()
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Locate a task by id across every day bucket (live, completed, breadcrumbs). */
function findTask(
  days: ReturnType<typeof useTaskRange>["days"],
  id: string | null,
): Task | null {
  if (!id) return null;
  for (const day of days) {
    for (const bucket of [day.live, day.completed, day.breadcrumbs]) {
      const found = bucket.find((a) => a.task.id === id);
      if (found) return found.task;
    }
  }
  return null;
}
