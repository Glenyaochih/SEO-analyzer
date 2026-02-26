interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <Skeleton className="h-4 w-28 mb-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-56 mb-1" />
        <Skeleton className="h-3 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-10" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-12" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-16" />
      </td>
    </tr>
  );
}
