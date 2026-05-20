import { ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
}

// Base skeleton block — chalk-faint background with shimmer.
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-white/[0.05] rounded ${className}`} />;
}

interface ListProps {
  count?: number;
  children: ReactNode;
}

// Renders the same skeleton row N times. Use for table/list pages.
export function SkeletonList({ count = 4, children }: ListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{children}</div>
      ))}
    </>
  );
}

// Skeleton matching a 2-column KPI card (BrandDashboard overview / Payments).
export function KpiCardSkeleton() {
  return (
    <div className="bento-card p-5">
      <Skeleton className="h-7 w-7 mb-3" />
      <Skeleton className="h-7 w-20 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// Skeleton row for the brand campaigns table.
export function TableRowSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <Skeleton className={`h-4 ${i === 0 ? 'w-40' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

// Skeleton row for transaction / wallet history surfaces.
export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  );
}

// Skeleton for an account-style form row (label + value).
export function FormRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}
