"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

import {
  ItemDrawer,
  type DrawerState,
  type ItemDetailJson,
} from "@/components/items/item-drawer";

interface ItemDrawerContextValue {
  openItem: (id: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer(): ItemDrawerContextValue {
  const context = useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return context;
}

export function ItemDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<DrawerState>({ status: "loading" });
  const controllerRef = useRef<AbortController | null>(null);

  const openItem = useCallback(async (id: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState({ status: "loading" });
    setOpen(true);

    try {
      const response = await fetch(`/api/items/${encodeURIComponent(id)}`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(
          response.status === 404 ? "Item not found." : "Could not load item.",
        );
      }
      const { item } = (await response.json()) as { item: ItemDetailJson };
      setState({ status: "ready", item });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Could not load item.",
      });
    }
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) controllerRef.current?.abort();
  }

  return (
    <ItemDrawerContext.Provider value={{ openItem }}>
      {children}
      <ItemDrawer
        open={open}
        state={state}
        onOpenChange={handleOpenChange}
        onItemUpdated={(item) => setState({ status: "ready", item })}
      />
    </ItemDrawerContext.Provider>
  );
}
