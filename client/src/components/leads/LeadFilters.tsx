import React, { useState, useEffect } from "react";
import { LeadStatus, LeadSource } from "../../types/api.types";
import { Search, X } from "lucide-react";

interface LeadFiltersProps {
  onFilterChange: (filters: { search: string; status: LeadStatus | ""; source: LeadSource | "" }) => void;
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({ onFilterChange }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [source, setSource] = useState<LeadSource | "">("");

  const onFilterChangeRef = React.useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  // Debounce search and filter updates
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChangeRef.current({ search, status, source });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status, source]);

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setSource("");
  };

  const hasActiveFilters = search || status || source;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-lg border border-border/80 shadow-2xs w-full">
      <div className="relative w-full sm:max-w-xs">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search name, email, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-8 pr-3 py-1.5 h-8 border border-border/80 rounded-md bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
        />
      </div>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-36">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus | "")}
            className="block w-full pl-2.5 pr-7 h-8 border border-border/80 rounded-md bg-background text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          >
            <option value="">All Statuses</option>
            {Object.values(LeadStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-36">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as LeadSource | "")}
            className="block w-full pl-2.5 pr-7 h-8 border border-border/80 rounded-md bg-background text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          >
            <option value="">All Sources</option>
            {Object.values(LeadSource).map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-8 px-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-border/80 rounded-md hover:bg-muted/40 transition-colors whitespace-nowrap"
            title="Clear filters"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
