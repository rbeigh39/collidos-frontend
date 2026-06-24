import { FormEvent, memo, useState } from "react";
import { BreadcrumbItem } from "@/components/BreadcrumbItem";
import { TaskItem } from "@/components/TaskItem";
import { relativeLabel, shortDate } from "@/lib/dates";
import type { Channel, DayBucket, Task } from "@/types";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface DaySectionProps {
  day: DayBucket;
  todayStr: string;
  selectedId: string | null;
  /** channelRef id → Channel, for rendering the #channel chip on cards. */
  channelById: Map<string, Channel>;
  onSelect: (id: string) => void;
  onAddTask: (date: string, title: string) => void;
  onToggleTask: (task: Task) => void;
  onToggleSubtask: (taskId: string, subId: string, completed: boolean) => void;
  onDeleteTask: (id: string) => void;
  onGoToDate: (date: string) => void;
  settleTaskId?: string | null;
}

/**
 * A single day rendered as a vertical column (Sunsama-style). Columns sit side
 * by side in a horizontally scrolling row; each scrolls its own task list.
 */
export const DaySection = memo(function DaySection({
  day,
  todayStr,
  selectedId,
  channelById,
  onSelect,
  onAddTask,
  onToggleTask,
  onToggleSubtask,
  onDeleteTask,
  onGoToDate,
  settleTaskId,
}: DaySectionProps) {
  const [title, setTitle] = useState("");
  const isToday = day.date === todayStr;
  const openCount = day.live.filter((a) => a.task.status !== "done").length;

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAddTask(day.date, trimmed);
    setTitle("");
  }

  const { setNodeRef } = useDroppable({
    id: `day-${day.date}`,
    data: { type: "Day", date: day.date },
  });

  return (
    <section
      ref={setNodeRef}
      id={`day-${day.date}`}
      className={`flex h-full w-80 shrink-0 flex-col border-r border-line ${
        isToday ? "bg-surface" : "bg-canvas"
      }`}
    >
      <header
        className={`flex items-baseline gap-2 border-b border-line px-4 py-3 ${
          isToday ? "bg-primary-soft" : ""
        }`}
      >
        <h2 className={`text-sm font-semibold ${isToday ? "text-primary" : "text-ink"}`}>
          {relativeLabel(day.date, todayStr)}
        </h2>
        <span className="text-xs text-ink-subtle">{shortDate(day.date)}</span>
        {openCount > 0 ? (
          <span className="ml-auto text-xs text-ink-subtle">{openCount}</span>
        ) : null}
      </header>

      <form onSubmit={handleAdd} className="border-b border-line p-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="+ Add a task"
          className="w-full rounded-control border border-transparent bg-transparent px-3 py-1.5 text-sm text-ink placeholder:text-ink-subtle hover:border-line focus:border-primary focus:bg-surface"
        />
      </form>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <SortableContext items={day.live.map((a) => a.task.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2 min-h-2">
            {day.live.map((a) => (
              <TaskItem
                key={a.task.id}
                task={a.task}
                dayDate={day.date}
                selected={a.task.id === selectedId}
                channel={a.task.channelRef ? channelById.get(a.task.channelRef) ?? null : null}
                completedSubtaskIdsOnThisDay={a.completedSubtaskIdsOnThisDay}
                onToggle={onToggleTask}
                onToggleSubtask={onToggleSubtask}
                onDelete={onDeleteTask}
                onSelect={onSelect}
                settleTaskId={settleTaskId}
              />
            ))}
          </ul>
        </SortableContext>

        {day.completed.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2 opacity-70">
            {day.completed.map((a) => (
              <TaskItem
                key={`done-${a.task.id}`}
                task={a.task}
                selected={a.task.id === selectedId}
                channel={a.task.channelRef ? channelById.get(a.task.channelRef) ?? null : null}
                completedSubtaskIdsOnThisDay={a.completedSubtaskIdsOnThisDay}
                onToggle={onToggleTask}
                onToggleSubtask={onToggleSubtask}
                onDelete={onDeleteTask}
                onSelect={onSelect}
              />
            ))}
          </ul>
        ) : null}

        {day.breadcrumbs.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1.5">
            {day.breadcrumbs.map((a) => (
              <BreadcrumbItem
                key={`bc-${a.task.id}`}
                appearance={a}
                todayStr={todayStr}
                onSelect={onSelect}
                onGoToLiveDate={onGoToDate}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
});
