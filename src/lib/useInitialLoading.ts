import { useEffect, useState } from "react";

/**
 * Returns `true` for the first `durationMs` milliseconds after mount,
 * then switches to `false`.
 *
 * Used to show skeleton screens during the initial render cycle
 * while data and fonts settle, without a real async loading state.
 */
export function useInitialLoading(durationMs = 350): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return loading;
}
