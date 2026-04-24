export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
