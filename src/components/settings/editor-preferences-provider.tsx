"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { updateEditorPreferences } from "@/actions/settings";
import { DEFAULT_EDITOR_PREFERENCES, type EditorPreferences } from "@/lib/editor-preferences";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  updatePreferences: (patch: Partial<EditorPreferences>) => void;
  hydratePreferences: (preferences: EditorPreferences) => void;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

export function EditorPreferencesProvider({
  initialPreferences = DEFAULT_EDITOR_PREFERENCES,
  children,
}: {
  initialPreferences?: EditorPreferences;
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  // Mirrors `preferences` so a quick series of changes each builds on the previous one.
  const latestRef = useRef(initialPreferences);
  // The last value the server confirmed, used to roll back a failed save.
  const savedRef = useRef(initialPreferences);
  const requestRef = useRef(0);

  const apply = useCallback((next: EditorPreferences) => {
    latestRef.current = next;
    setPreferences(next);
  }, []);

  const hydratePreferences = useCallback(
    (next: EditorPreferences) => {
      savedRef.current = next;
      apply(next);
    },
    [apply],
  );

  const updatePreferences = useCallback(
    (patch: Partial<EditorPreferences>) => {
      const next = { ...latestRef.current, ...patch };
      apply(next);
      const request = ++requestRef.current;

      void updateEditorPreferences(next).then(
        (result) => {
          if (result.success && result.data) {
            savedRef.current = result.data;
            if (request === requestRef.current) toast.success("Editor preferences saved");
            return;
          }
          if (request === requestRef.current) apply(savedRef.current);
          toast.error(result.error ?? "Could not save editor preferences");
        },
        () => {
          if (request === requestRef.current) apply(savedRef.current);
          toast.error("Could not save editor preferences");
        },
      );
    },
    [apply],
  );

  const value = useMemo(
    () => ({ preferences, updatePreferences, hydratePreferences }),
    [preferences, updatePreferences, hydratePreferences],
  );

  return (
    <EditorPreferencesContext.Provider value={value}>{children}</EditorPreferencesContext.Provider>
  );
}

// Outside a provider (or before one exists) editors fall back to the defaults.
const FALLBACK: EditorPreferencesContextValue = {
  preferences: DEFAULT_EDITOR_PREFERENCES,
  updatePreferences: () => {},
  hydratePreferences: () => {},
};

export function useEditorPreferences(): EditorPreferencesContextValue {
  return useContext(EditorPreferencesContext) ?? FALLBACK;
}

// Rendered by a suspended server component once the saved preferences have loaded,
// so the provider can wrap prerendered content while the database read streams in.
export function EditorPreferencesHydrator({ preferences }: { preferences: EditorPreferences }) {
  const { hydratePreferences } = useEditorPreferences();
  const { fontSize, tabSize, wordWrap, minimap, theme } = preferences;

  useEffect(() => {
    hydratePreferences({ fontSize, tabSize, wordWrap, minimap, theme });
  }, [hydratePreferences, fontSize, tabSize, wordWrap, minimap, theme]);

  return null;
}
