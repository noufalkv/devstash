import { ChaosAnimation } from "@/components/homepage/chaos-animation";
import { CHAOS_ICONS } from "@/components/homepage/content";
import { cn } from "@/lib/utils";

export function ChaosPanel() {
  return (
    <div>
      <p className="mb-2.5 font-mono text-[13px] text-muted-foreground">Your knowledge today...</p>
      <ChaosAnimation>
        {CHAOS_ICONS.map((icon) => (
          <div
            key={icon.name}
            data-chaos-icon
            title={icon.name}
            className={cn(
              "absolute top-0 left-0 grid size-13 place-items-center rounded-xl border border-border bg-muted p-3 shadow-lg shadow-black/35 transition-opacity will-change-transform",
              icon.color,
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-full"
              aria-hidden="true"
            >
              {icon.paths.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
          </div>
        ))}
      </ChaosAnimation>
    </div>
  );
}
