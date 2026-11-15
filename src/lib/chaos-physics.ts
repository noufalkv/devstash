/**
 * Physics for the homepage "chaos" panel: icons drift at a steady speed, bounce
 * off the walls, wobble in rotation and are pushed away by the cursor.
 */

export interface ChaosBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  phase: number;
}

export interface ChaosBounds {
  width: number;
  height: number;
}

export interface ChaosPointer {
  x: number;
  y: number;
  active: boolean;
}

export const CHAOS_ICON_SIZE = 52;
export const CHAOS_BASE_SPEED = 0.6;
export const CHAOS_MAX_SPEED = 6;
export const CHAOS_REPEL_RADIUS = 110;
export const CHAOS_REPEL_FORCE = 0.9;
export const CHAOS_MAX_ROTATION = 20;

const GRID_COLUMNS = 4;
const SPEED_DECAY = 0.97;

/** Places the bodies on a loose grid so they don't overlap at first. */
export function createChaosBodies(
  count: number,
  bounds: ChaosBounds,
  random: () => number = Math.random,
): ChaosBody[] {
  const rows = Math.max(Math.ceil(count / GRID_COLUMNS), 1);
  const cellW = bounds.width / GRID_COLUMNS;
  const cellH = bounds.height / rows;

  return Array.from({ length: count }, (_, i) => {
    const angle = random() * Math.PI * 2;
    return {
      x: (i % GRID_COLUMNS) * cellW + random() * Math.max(cellW - CHAOS_ICON_SIZE, 0),
      y: Math.floor(i / GRID_COLUMNS) * cellH + random() * Math.max(cellH - CHAOS_ICON_SIZE, 0),
      vx: Math.cos(angle) * CHAOS_BASE_SPEED,
      vy: Math.sin(angle) * CHAOS_BASE_SPEED,
      rotation: random() * 30 - 15,
      spin: (random() - 0.5) * 0.4,
      phase: random() * Math.PI * 2,
    };
  });
}

/** Advances one body by one frame. Mutates and returns it. */
export function stepChaosBody(
  body: ChaosBody,
  bounds: ChaosBounds,
  pointer: ChaosPointer,
): ChaosBody {
  if (pointer.active) {
    const dx = body.x + CHAOS_ICON_SIZE / 2 - pointer.x;
    const dy = body.y + CHAOS_ICON_SIZE / 2 - pointer.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < CHAOS_REPEL_RADIUS) {
      const push = ((CHAOS_REPEL_RADIUS - dist) / CHAOS_REPEL_RADIUS) * CHAOS_REPEL_FORCE;
      body.vx += (dx / dist) * push;
      body.vy += (dy / dist) * push;
    }
  }

  // Ease back towards the drifting speed after being pushed.
  const speed = Math.hypot(body.vx, body.vy) || 1;
  const target =
    speed > CHAOS_BASE_SPEED ? Math.max(CHAOS_BASE_SPEED, speed * SPEED_DECAY) : CHAOS_BASE_SPEED;
  const limited = Math.min(target, CHAOS_MAX_SPEED);
  body.vx = (body.vx / speed) * limited;
  body.vy = (body.vy / speed) * limited;

  body.x += body.vx;
  body.y += body.vy;

  const maxX = Math.max(bounds.width - CHAOS_ICON_SIZE, 0);
  const maxY = Math.max(bounds.height - CHAOS_ICON_SIZE, 0);
  if (body.x <= 0 || body.x >= maxX) {
    body.x = clamp(body.x, 0, maxX);
    body.vx *= -1;
    body.spin *= -1;
  }
  if (body.y <= 0 || body.y >= maxY) {
    body.y = clamp(body.y, 0, maxY);
    body.vy *= -1;
  }

  body.rotation += body.spin;
  if (Math.abs(body.rotation) > CHAOS_MAX_ROTATION) body.spin *= -1;

  return body;
}

/** Slow scale pulse between 0.94 and 1.06. */
export function chaosScale(body: ChaosBody, time: number): number {
  return 1 + Math.sin(time / 900 + body.phase) * 0.06;
}

/** Keeps a body inside the bounds, e.g. after the panel is resized. */
export function clampChaosBody(body: ChaosBody, bounds: ChaosBounds): ChaosBody {
  body.x = clamp(body.x, 0, Math.max(bounds.width - CHAOS_ICON_SIZE, 0));
  body.y = clamp(body.y, 0, Math.max(bounds.height - CHAOS_ICON_SIZE, 0));
  return body;
}

export function chaosTransform(body: ChaosBody, scale: number): string {
  return `translate(${body.x}px, ${body.y}px) rotate(${body.rotation}deg) scale(${scale})`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
