"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * - `idle`: shown as rendered on the server, no animation
 * - `pending`: off screen, hidden until it scrolls into view
 * - `visible`: scrolled into view, plays its reveal animation
 */
export type RevealState = "idle" | "pending" | "visible";

/**
 * Hides an element that starts off screen and reveals it once it scrolls into
 * view. Content already on screen, and everything under
 * `prefers-reduced-motion`, stays `idle` so it never flashes or moves.
 */
export function useReveal(ref: RefObject<HTMLElement | null>): RevealState {
  const [state, setState] = useState<RevealState>("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // On screen at load: leave it as it is rather than replay it.
          if (!first) setState("visible");
          observer.disconnect();
        } else if (first) {
          setState("pending");
        }
        first = false;
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return state;
}
