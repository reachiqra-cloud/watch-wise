export default function SkeletonCard() {
  return (
    <div className="flex h-full animate-pulse flex-col justify-between rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div>
        <div className="mb-3 h-5 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-2 h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-3 flex gap-2">
          <div className="h-5 w-14 rounded-md bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-5 w-14 rounded-md bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-5 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-8 w-16 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}