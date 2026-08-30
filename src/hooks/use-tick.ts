import { useEffect, useState } from "react";

/** Re-renders the component every `ms` milliseconds. Use for countdowns. */
export function useTick(ms = 1000): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return n;
}