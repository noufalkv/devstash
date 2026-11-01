export function SidebarSkeleton() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border md:block">
      <div className="flex animate-pulse flex-col gap-2 p-4">
        <div className="mb-2 h-5 w-16 rounded-md bg-muted" />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="h-7 rounded-lg bg-muted" />
        ))}
        <div className="mt-4 mb-2 h-5 w-24 rounded-md bg-muted" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-7 rounded-lg bg-muted" />
        ))}
      </div>
    </aside>
  );
}
