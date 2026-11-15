"use client";

import { type ReactNode, useRef } from "react";

import { useReveal } from "@/hooks/use-reveal";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Animate on first paint from the server HTML (for content already on screen). */
  immediate?: boolean;
}

/**
 * Fades its children up once they scroll into view. The hidden and animated
 * states are styled by `[data-reveal]` rules in `globals.css`; without them, or
 * without JavaScript, the content is simply visible.
 */
export function FadeIn({ children, className, immediate = false }: FadeInProps) {
  if (immediate) {
    return (
      <div data-reveal="visible" className={className}>
        {children}
      </div>
    );
  }
  return <ScrollFadeIn className={className}>{children}</ScrollFadeIn>;
}

function ScrollFadeIn({ children, className }: Omit<FadeInProps, "immediate">) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useReveal(ref);

  return (
    <div ref={ref} data-reveal={state === "idle" ? undefined : state} className={className}>
      {children}
    </div>
  );
}
