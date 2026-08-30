import { useEffect, useState } from "react";
import { loadFlow, emptyFlow, FLOW_EVENT, type FlowState } from "@/lib/customer-flow";

export function useFlow(): FlowState {
  const [state, setState] = useState<FlowState>(() => emptyFlow());

  useEffect(() => {
    const sync = () => setState(loadFlow());
    sync();
    window.addEventListener(FLOW_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FLOW_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return state;
}

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
