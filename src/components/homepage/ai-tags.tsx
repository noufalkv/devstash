"use client";

import { useEffect, useRef, useState } from "react";

import { useReveal } from "@/hooks/use-reveal";

const FIRST_TAG_DELAY = 500;
const TAG_INTERVAL = 220;

/**
 * Tags that pop in one by one, as if generated, once they scroll into view.
 * Tags already on screen at load, or under reduced motion, are just shown.
 */
export function AiTags({ tags }: { tags: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useReveal(ref);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (state !== "visible") return;
    const timers = tags.map((_, i) =>
      window.setTimeout(() => setShown(i + 1), FIRST_TAG_DELAY + i * TAG_INTERVAL),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [state, tags]);

  const tagState = (i: number) => {
    if (state === "idle") return undefined;
    return state === "visible" && i < shown ? "visible" : "pending";
  };

  return (
    <div ref={ref} className="flex flex-wrap gap-2">
      {tags.map((tag, i) => (
        <span
          key={tag}
          data-reveal-item={tagState(i)}
          className="rounded-full border border-type-prompt/40 bg-type-prompt/18 px-2.5 py-0.5 font-mono text-xs text-violet-200"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
