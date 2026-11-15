"use client";

import { type ReactNode, useEffect, useRef } from "react";

import {
  type ChaosPointer,
  chaosScale,
  chaosTransform,
  clampChaosBody,
  createChaosBodies,
  stepChaosBody,
} from "@/lib/chaos-physics";

/**
 * Animates every `[data-chaos-icon]` child: drift, wall bounce, rotation,
 * scale pulse and cursor repel. Pauses while off screen; under
 * `prefers-reduced-motion` the icons are placed once and stay still.
 */
export function ChaosAnimation({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;

    const elements = Array.from(box.querySelectorAll<HTMLElement>("[data-chaos-icon]"));
    const bounds = { width: box.clientWidth, height: box.clientHeight };
    const bodies = createChaosBodies(elements.length, bounds);
    const pointer: ChaosPointer = { x: 0, y: 0, active: false };

    const render = (time: number) => {
      bodies.forEach((body, i) => {
        elements[i].style.transform = chaosTransform(body, time === 0 ? 1 : chaosScale(body, time));
      });
    };

    render(0);
    box.dataset.ready = "";

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let visible = true;

    const tick = (time: number) => {
      if (!visible) {
        frame = 0;
        return;
      }
      bodies.forEach((body) => stepChaosBody(body, bounds, pointer));
      render(time);
      frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = box.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    const resizeObserver = new ResizeObserver(() => {
      bounds.width = box.clientWidth;
      bounds.height = box.clientHeight;
      bodies.forEach((body) => clampChaosBody(body, bounds));
    });

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    });

    box.addEventListener("pointermove", onPointerMove);
    box.addEventListener("pointerleave", onPointerLeave);
    resizeObserver.observe(box);
    visibilityObserver.observe(box);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      box.removeEventListener("pointermove", onPointerMove);
      box.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-chaos
      className="relative h-70 overflow-hidden rounded-xl border border-dashed border-zinc-700 bg-card bg-[radial-gradient(circle_at_30%_30%,color-mix(in_srgb,var(--color-type-image)_6%,transparent),transparent_60%),radial-gradient(circle_at_70%_70%,color-mix(in_srgb,var(--color-type-command)_6%,transparent),transparent_60%)] md:h-85"
    >
      {children}
    </div>
  );
}
