import { PREVIEW_CARDS, PREVIEW_TYPES, TYPE_ACCENT } from "@/components/homepage/content";
import { cn } from "@/lib/utils";

export function DashboardPreview() {
  return (
    <div>
      <p className="mb-2.5 font-mono text-[13px] text-muted-foreground">...with DevStash</p>
      <div
        aria-hidden="true"
        className="flex h-70 overflow-hidden rounded-xl border border-border bg-card text-xs md:h-85"
      >
        <aside className="w-30 shrink-0 border-r border-border bg-background/60 px-3 py-3.5">
          <div className={cn("mb-3.5 flex items-center gap-2 font-bold", TYPE_ACCENT.snippet)}>
            <Dot />
            DevStash
          </div>
          <ul className="grid gap-1 text-muted-foreground">
            {PREVIEW_TYPES.map(({ label, type }, i) => (
              <li
                key={type}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1.5 py-1",
                  TYPE_ACCENT[type],
                  i === 0 && "bg-muted text-foreground",
                )}
              >
                <Dot />
                {label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 p-3.5">
          <div className="mb-3.5 flex items-center justify-between rounded-md border border-border px-2.5 py-1.5 text-muted-foreground">
            <span>Search items...</span>
            <kbd className="rounded border border-border px-1.5 font-mono text-[10px]">⌘K</kbd>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {PREVIEW_CARDS.map(({ title, type }) => (
              <div
                key={title}
                className={cn(
                  "grid gap-1.5 rounded-lg border border-t-3 border-border border-t-(--c) bg-muted p-2.5",
                  TYPE_ACCENT[type],
                )}
              >
                <span className="truncate font-semibold">{title}</span>
                <span className="block h-1.25 rounded-full bg-zinc-700/60" />
                <span className="block h-1.25 w-3/5 rounded-full bg-zinc-700/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="size-2 shrink-0 rounded-full bg-(--c)" />;
}
