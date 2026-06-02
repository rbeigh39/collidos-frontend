import { useEffect, useState } from "react";

/**
 * Live minutes elapsed since `timerStartedAt` (an ISO string), updating once a
 * minute. Returns 0 when no timer is running. Shared by the task card and the
 * detail panel so the timer display logic lives in one place.
 */
export function useElapsedMinutes(timerStartedAt?: string): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!timerStartedAt) {
      setElapsed(0);
      return;
    }
    const start = new Date(timerStartedAt).getTime();
    const update = () => setElapsed(Math.max(0, Math.round((Date.now() - start) / 60000)));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [timerStartedAt]);

  return elapsed;
}
