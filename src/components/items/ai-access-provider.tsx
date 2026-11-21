"use client";

import { createContext, useContext, useEffect, useState } from "react";

/** `unknown` until the session is read, `locked` for free users while Pro gating is on. */
export type AiAccess = "unknown" | "locked" | "allowed";

interface AiAccessContextValue {
  access: AiAccess;
  setAccess: (value: AiAccess) => void;
}

const AiAccessContext = createContext<AiAccessContextValue | null>(null);

// Starts as `unknown` and is set by `AiAccessHydrator` once the session is read,
// so AI controls never flash for free users. The server action enforces the gate.
export function AiAccessProvider({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<AiAccess>("unknown");
  return (
    <AiAccessContext.Provider value={{ access, setAccess }}>{children}</AiAccessContext.Provider>
  );
}

export function AiAccessHydrator({ access }: { access: AiAccess }) {
  const context = useContext(AiAccessContext);
  const setAccess = context?.setAccess;
  useEffect(() => {
    setAccess?.(access);
  }, [setAccess, access]);
  return null;
}

export function useAiAccess(): AiAccess {
  return useContext(AiAccessContext)?.access ?? "unknown";
}

export function useCanUseAi(): boolean {
  return useAiAccess() === "allowed";
}
