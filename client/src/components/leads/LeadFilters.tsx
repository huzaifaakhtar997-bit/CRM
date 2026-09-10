import React, { useState, useEffect } from "react";
import { LeadStatus, LeadSource } from "../../types/api.types";
import { Search, Filter, X } from "lucide-react";

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
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search leads by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-40">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus | "")}
            className="block w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
          >
            <option value="">All Statuses</option>
            {Object.values(LeadStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-40">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as LeadSource | "")}
            className="block w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
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
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors whitespace-nowrap hidden sm:block"
            title="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
