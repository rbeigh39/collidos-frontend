export interface UserSettings {
  timezone: string;
  autoRollover: boolean;
  carryOpenSubtasks: boolean;
  autoRolloverObjectives: boolean;
  weekStartsOn: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  settings: UserSettings;
}

export interface Channel {
  id: string;
  name: string;
  color: string;
  order: number;
  archived: boolean;
}

export interface Objective {
  id: string;
  title: string;
  weekStart: string;
  channelRef?: string;
  order: number;
  completed: boolean;
  notes?: string;
}

export type TaskStatus = "backlog" | "planned" | "in_progress" | "done";

export type BacklogBucket =
  | "next_two_weeks"
  | "next_month"
  | "next_quarter"
  | "next_year"
  | "someday"
  | "never";

export interface BacklogGroup {
  bucket: BacklogBucket;
  tasks: Task[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  order: number;
  leftOnDate?: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  subtasks: Subtask[];
  plannedDate?: string;
  timeEstimateMinutes?: number;
  actualTimeMinutes?: number;
  timerStartedAt?: string;
  channel?: string;
  channelRef?: string;
  objective?: string;
  backlogBucket?: BacklogBucket;
  backlogFolder?: string;
  completedAt?: string;
  order: number;
  rolloverCount: number;
  lastRolledAt?: string;
  activityDates?: string[];
  createdAt: string;
  updatedAt: string;
}

/** One task's relevance to a particular day in the range feed. */
export interface TaskAppearance {
  task: Task;
  completedSubtaskIdsOnThisDay: string[];
  leftBehindSubtaskIdsOnThisDay: string[];
  openSubtaskCount: number;
  /** For breadcrumbs: the day the task actually lives on. */
  liveDate?: string;
}

export interface DayBucket {
  date: string; // YYYY-MM-DD
  live: TaskAppearance[];
  completed: TaskAppearance[];
  breadcrumbs: TaskAppearance[];
}

export interface RangeResponse {
  from: string;
  to: string;
  timezone: string;
  days: DayBucket[];
}

/** Standard success envelope returned by the API. */
export interface ApiSuccess<T> {
  status: "success";
  message?: string;
  data: T;
}
