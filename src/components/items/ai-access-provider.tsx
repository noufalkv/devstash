"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface AiAccessContextValue {
  canUseAi: boolean;
  setCanUseAi: (value: boolean) => void;
}

const AiAccessContext = createContext<AiAccessContextValue | null>(null);

// Starts hidden and is switched on by `AiAccessHydrator` once the session is read,
// so AI controls never flash for free users. The server action enforces the gate.
export function AiAccessProvider({ children }: { children: React.ReactNode }) {
  const [canUseAi, setCanUseAi] = useState(false);
  return (
    <AiAccessContext.Provider value={{ canUseAi, setCanUseAi }}>{children}</AiAccessContext.Provider>
  );
}

export function AiAccessHydrator({ canUseAi }: { canUseAi: boolean }) {
  const context = useContext(AiAccessContext);
  const setCanUseAi = context?.setCanUseAi;
  useEffect(() => {
    setCanUseAi?.(canUseAi);
  }, [setCanUseAi, canUseAi]);
  return null;
}

export function useCanUseAi(): boolean {
  return useContext(AiAccessContext)?.canUseAi ?? false;
}
