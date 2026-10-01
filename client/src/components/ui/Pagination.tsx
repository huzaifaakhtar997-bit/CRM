import React from "react";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  onPageChange: (newPage: number) => void;
  itemName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  itemName = "results",
}) => {
  if (totalPages <= 1 && !total) return null;

  const startRecord = limit ? (page - 1) * limit + 1 : 1;
  const endRecord = limit && total ? Math.min(page * limit, total) : total;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4">
      <div className="text-sm text-muted-foreground">
        {total !== undefined && limit ? (
          <>
            Showing <span className="font-medium text-foreground">{startRecord}</span> to{" "}
            <span className="font-medium text-foreground">{endRecord}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span> {itemName}
          </>
        ) : (
          <>
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{Math.max(1, totalPages)}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
          className="h-8 gap-1 px-2.5 text-xs font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="text-xs font-semibold px-2 py-1 rounded bg-muted text-foreground select-none">
          {page} / {Math.max(1, totalPages)}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="h-8 gap-1 px-2.5 text-xs font-medium"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
