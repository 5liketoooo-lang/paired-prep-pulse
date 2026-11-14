export function PageSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
      <div className="h-96 animate-pulse rounded-3xl bg-muted" />
    </div>
  );
}
