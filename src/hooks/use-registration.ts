import { useEffect, useState, useCallback } from "react";
import {
  loadRegistration,
  saveRegistration,
  getInterested,
  type RegistrationState,
} from "@/lib/registration-store";

export function useRegistration() {
  const [state, setState] = useState<RegistrationState>(() => loadRegistration());

  useEffect(() => {
    const sync = () => setState(loadRegistration());
    window.addEventListener("scrapify:registration", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("scrapify:registration", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((patch: Partial<RegistrationState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveRegistration(next);
      return next;
    });
  }, []);

  return { state, update };
}

export function useInterested() {
  const [ids, setIds] = useState<string[]>(() => getInterested());
  useEffect(() => {
    const sync = () => setIds(getInterested());
    window.addEventListener("scrapify:interested", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("scrapify:interested", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return ids;
}