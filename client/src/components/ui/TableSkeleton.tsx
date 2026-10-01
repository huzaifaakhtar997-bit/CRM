import React from "react";

interface TableSkeletonProps {
  columns?: number;
  cols?: number;
  rows?: number;
  className?: string;
  standalone?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns,
  cols,
  rows = 5,
  className = "",
  standalone,
}) => {
  const colCount = columns ?? cols ?? 5;
  const tbody = (
    <tbody className={`divide-y divide-border ${className}`}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse">
          {Array.from({ length: colCount }).map((_, cIdx) => (
            <td key={cIdx} className="px-6 py-4">
              <div
                className="h-4 bg-muted/70 rounded-md"
                style={{
                  width:
                    cIdx === 0
                      ? "65%"
                      : cIdx === colCount - 1
                      ? "40px"
                      : `${Math.max(40, 75 - cIdx * 10)}%`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  if (standalone || cols !== undefined) {
    return (
      <div className="bg-card border rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-sm text-left">
          {tbody}
        </table>
      </div>
    );
  }

  return tbody;
};
