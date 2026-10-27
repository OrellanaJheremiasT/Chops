import type { CSSProperties } from "react";
import "./Skeleton.css";

type SkeletonProps = {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: CSSProperties["borderRadius"];
  className?: string;
};

/** Single placeholder block. Decorative: hidden from assistive tech. */
export function Skeleton({
  width = "100%",
  height = 14,
  radius,
  className = "",
}: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/** Table-shaped placeholder: header + N rows. */
export function SkeletonTable({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      {Array.from({ length: rows + 1 }, (_, r) => (
        <div
          key={r}
          className={r === 0 ? "skeleton-row is-head" : "skeleton-row"}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} height={r === 0 ? 10 : 12} width={c === 0 ? "80%" : "60%"} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Whole-page placeholder: title, stat cards and a table. */
export function PageSkeleton() {
  return (
    <div className="skeleton-page" aria-hidden="true">
      <div className="skeleton-title">
        <Skeleton width={180} height={22} />
        <Skeleton width={"min(320px, 70%)"} height={12} />
      </div>
      <div className="skeleton-stats">
        {Array.from({ length: 4 }, (_, i) => (
          <div className="skeleton-card" key={i}>
            <Skeleton width={90} height={10} />
            <Skeleton width={70} height={24} />
          </div>
        ))}
      </div>
      <div className="skeleton-card">
        <SkeletonTable />
      </div>
    </div>
  );
}
