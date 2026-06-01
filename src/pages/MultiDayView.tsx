import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";
import { AppShell } from "@/components/AppShell";
import { BacklogRail } from "@/components/BacklogRail";
import { ChannelFilterBar } from "@/components/ChannelFilterBar";
import { DaySection } from "@/components/DaySection";
import { ObjectivesStrip } from "@/components/ObjectivesStrip";
import { TaskDetailPanel } from "@/components/TaskDetailPanel";
import { useChannels } from "@/hooks/useChannels";
import { useObjectives } from "@/hooks/useObjectives";
import { useTaskRange } from "@/hooks/useTaskRange";
import { getErrorMessage } from "@/lib/getErrorMessage";
import type { Task } from "@/types";

export function MultiDayView() {
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [backlogOpen, setBacklogOpen] = useState(false);
  const { channels, addChannel } = useChannels();
  const { mutate: globalMutate } = useSWRConfig();
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
  } = range;

  // Focused-week objectives (for the strip and the detail-panel picker).
  const { objectives } = useObjectives(today);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleChannel = useCallback(
    (id: string) =>
      setChannelFilter((cur) =>
        cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id],
      ),
    [],
  );

  // Move a scheduled task back to the backlog (refreshes range + backlog list).
  const sendToBacklog = useCallback(
    async (id: string) => {
      await editTask(id, { plannedDate: null });
      await globalMutate("backlog");
    },
    [editTask, globalMutate],
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

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <ChannelFilterBar
          channels={channels}
          selectedIds={channelFilter}
          onToggle={toggleChannel}
          onClear={() => setChannelFilter([])}
          onCreate={addChannel}
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
                  onSelect={setSelectedId}
                  onAddTask={addTask}
                  onToggleTask={toggleTaskDone}
                  onDeleteTask={handleDelete}
                  onGoToDate={goToDate}
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
            />
          ) : null}

          {backlogOpen ? (
            <BacklogRail today={today} onClose={() => setBacklogOpen(false)} />
          ) : null}
        </div>
      </div>
    </AppShell>
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
