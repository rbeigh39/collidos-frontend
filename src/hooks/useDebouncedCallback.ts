import { useEffect, useMemo, useRef } from "react";

/**
 * Returns a debounced version of `callback`. The latest callback is kept in a
 * ref so the debounced function identity stays stable across renders (per
 * vercel-react-best-practices `advanced-event-handler-refs`).
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep the ref pointing at the freshest callback without re-creating debounce.
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Clear any pending timer on unmount.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useMemo(() => {
    const debounced = (...args: Args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
    };
    debounced.flush = (...args: Args) => {
      clearTimeout(timerRef.current);
      callbackRef.current(...args);
    };
    return debounced;
  }, [delayMs]);
}
