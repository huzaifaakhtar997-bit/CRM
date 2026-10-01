import React, { useState, useEffect } from "react";
import { CampaignStatus } from "../../types/api.types";
import { Search, Filter, X } from "lucide-react";

interface CampaignFiltersProps {
  onFilterChange: (filters: { search: string; status: CampaignStatus | "" }) => void;
}

export const CampaignFilters: React.FC<CampaignFiltersProps> = ({ onFilterChange }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "">("");

  const onFilterChangeRef = React.useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  // Debounce search and filter updates
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChangeRef.current({ search, status });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status]);

  const clearFilters = () => {
    setSearch("");
    setStatus("");
  };

  const hasActiveFilters = search || status;

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search campaigns by name, subject, or objective..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-8 pr-3 h-8 border border-input rounded-md bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
        />
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-44">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <Filter className="h-3 w-3 text-muted-foreground" />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CampaignStatus | "")}
            className="block w-full pl-8 pr-3 h-8 border border-input rounded-md bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          >
            <option value="">All Statuses</option>
            {Object.values(CampaignStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border/80 rounded-md transition-colors whitespace-nowrap flex items-center gap-1 font-medium"
            title="Clear filters"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
