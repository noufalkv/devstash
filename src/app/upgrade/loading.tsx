export default function UpgradeLoading() {
  return (
    <div className="flex animate-pulse flex-col items-center gap-6">
      <div className="h-9 w-64 rounded-md bg-muted" />
      <div className="h-5 w-80 max-w-full rounded-md bg-muted" />
      <div className="h-6 w-56 rounded-md bg-muted" />
      <div className="grid w-full max-w-196 gap-6 md:grid-cols-2">
        <div className="h-112 rounded-xl bg-muted" />
        <div className="h-112 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
