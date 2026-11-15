"use client";

import { type ReactNode, useSyncExternalStore } from "react";

const SCROLL_THRESHOLD = 20;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const getScrolled = () => window.scrollY > SCROLL_THRESHOLD;
const getServerScrolled = () => false;

/** Fixed header that turns more opaque once the page scrolls. */
export function HomeNavShell({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(subscribe, getScrolled, getServerScrolled);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-background/35 backdrop-blur-md transition-colors duration-250 data-scrolled:border-border data-scrolled:bg-background/90"
    >
      {children}
    </header>
  );
}
