export default function ProfileLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      <div className="h-9 w-40 rounded-md bg-muted" />
      <div className="h-28 rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted" />
      <div className="h-36 rounded-xl bg-muted" />
    </div>
  );
}
