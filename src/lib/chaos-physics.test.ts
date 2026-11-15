import { describe, expect, it } from "vitest";

import {
  CHAOS_BASE_SPEED,
  CHAOS_ICON_SIZE,
  CHAOS_MAX_ROTATION,
  CHAOS_MAX_SPEED,
  type ChaosBody,
  chaosScale,
  chaosTransform,
  clampChaosBody,
  createChaosBodies,
  stepChaosBody,
} from "@/lib/chaos-physics";

const bounds = { width: 400, height: 300 };
const idle = { x: 0, y: 0, active: false };

function body(overrides: Partial<ChaosBody> = {}): ChaosBody {
  return { x: 100, y: 100, vx: CHAOS_BASE_SPEED, vy: 0, rotation: 0, spin: 0.1, phase: 0, ...overrides };
}

describe("createChaosBodies", () => {
  it("creates bodies inside the bounds at the base speed", () => {
    const bodies = createChaosBodies(8, bounds, () => 0.99);
    expect(bodies).toHaveLength(8);
    for (const b of bodies) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(bounds.width - CHAOS_ICON_SIZE);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeLessThanOrEqual(bounds.height - CHAOS_ICON_SIZE);
      expect(Math.hypot(b.vx, b.vy)).toBeCloseTo(CHAOS_BASE_SPEED);
    }
  });

  it("spreads bodies over a four-column grid", () => {
    const bodies = createChaosBodies(5, bounds, () => 0);
    expect(bodies.map((b) => b.x)).toEqual([0, 100, 200, 300, 0]);
    expect(bodies[4].y).toBe(150);
  });
});

describe("stepChaosBody", () => {
  it("drifts at the base speed without a pointer", () => {
    const b = stepChaosBody(body(), bounds, idle);
    expect(b.x).toBeCloseTo(100 + CHAOS_BASE_SPEED);
    expect(b.y).toBe(100);
  });

  it("pushes the body away from a nearby pointer", () => {
    // Pointer just to the left of the body's centre.
    const pointer = { x: 100 + CHAOS_ICON_SIZE / 2 - 20, y: 100 + CHAOS_ICON_SIZE / 2, active: true };
    const b = stepChaosBody(body({ vx: 0, vy: CHAOS_BASE_SPEED }), bounds, pointer);
    expect(b.vx).toBeGreaterThan(0);
  });

  it("ignores a pointer outside the repel radius", () => {
    const pointer = { x: 390, y: 290, active: true };
    const b = stepChaosBody(body(), bounds, pointer);
    expect(Math.hypot(b.vx, b.vy)).toBeCloseTo(CHAOS_BASE_SPEED);
  });

  it("slows a pushed body back towards the base speed and caps it", () => {
    const fast = stepChaosBody(body({ vx: 100 }), bounds, idle);
    expect(Math.hypot(fast.vx, fast.vy)).toBeCloseTo(CHAOS_MAX_SPEED);

    const pushed = stepChaosBody(body({ vx: 2 }), bounds, idle);
    expect(pushed.vx).toBeCloseTo(2 * 0.97);
  });

  it("bounces off the walls and stays inside", () => {
    const maxX = bounds.width - CHAOS_ICON_SIZE;
    const b = stepChaosBody(body({ x: maxX - 0.1, spin: 0.1 }), bounds, idle);
    expect(b.x).toBe(maxX);
    expect(b.vx).toBeLessThan(0);
    expect(b.spin).toBeLessThan(0);

    const top = stepChaosBody(body({ y: 0.1, vx: 0, vy: -CHAOS_BASE_SPEED }), bounds, idle);
    expect(top.y).toBe(0);
    expect(top.vy).toBeGreaterThan(0);
  });

  it("reverses the spin past the rotation limit", () => {
    const b = stepChaosBody(body({ rotation: CHAOS_MAX_ROTATION, spin: 0.2 }), bounds, idle);
    expect(b.spin).toBe(-0.2);
  });
});

describe("clampChaosBody", () => {
  it("pulls a body back inside smaller bounds", () => {
    const b = clampChaosBody(body({ x: 500, y: -10 }), { width: 200, height: 200 });
    expect(b.x).toBe(200 - CHAOS_ICON_SIZE);
    expect(b.y).toBe(0);
  });
});

describe("chaosScale and chaosTransform", () => {
  it("pulses the scale within ±6%", () => {
    expect(chaosScale(body(), 0)).toBe(1);
    expect(chaosScale(body({ phase: Math.PI / 2 }), 0)).toBeCloseTo(1.06);
  });

  it("builds the CSS transform", () => {
    expect(chaosTransform(body({ x: 1, y: 2, rotation: 3 }), 1.5)).toBe(
      "translate(1px, 2px) rotate(3deg) scale(1.5)",
    );
  });
});
