export interface UserSettings {
  timezone: string;
  autoRollover: boolean;
  carryOpenSubtasks: boolean;
  weekStartsOn: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  settings: UserSettings;
}

export type TaskStatus = "backlog" | "planned" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  plannedDate?: string;
  timeEstimateMinutes?: number;
  channel?: string;
  completedAt?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/** Standard success envelope returned by the API. */
export interface ApiSuccess<T> {
  status: "success";
  message?: string;
  data: T;
}
