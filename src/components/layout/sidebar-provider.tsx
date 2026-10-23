"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarContextValue {
  /** Whether the sidebar column is expanded on desktop. */
  open: boolean;
  /** Whether the sidebar drawer is open on mobile. */
  openMobile: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  setOpenMobile: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(true);
  const [openMobile, setOpenMobile] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((value) => !value);
    } else {
      setOpen((value) => !value);
    }
  }, [isMobile]);

  const value = useMemo(
    () => ({ open, openMobile, isMobile, toggleSidebar, setOpenMobile }),
    [open, openMobile, isMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
