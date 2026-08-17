import React from "react";
import { Priority } from "../../types/api.types";
import { Search } from "lucide-react";

export type TaskStatusFilter = "ALL" | "OPEN" | "COMPLETED";

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: TaskStatusFilter;
  onStatusChange: (status: TaskStatusFilter) => void;
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm flex-wrap">
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full flex h-10 rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <div className="flex items-center space-x-1 bg-accent/30 p-1 rounded-lg border">
          <button
            onClick={() => onStatusChange("ALL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === "ALL" ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All
          </button>
          <button
            onClick={() => onStatusChange("OPEN")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === "OPEN" ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Open
          </button>
          <button
            onClick={() => onStatusChange("COMPLETED")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === "COMPLETED" ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Completed
          </button>
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-muted-foreground"
        >
          <option value="">All Priorities</option>
          {Object.values(Priority).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
