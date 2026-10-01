import React from "react";
import { Priority } from "../../types/api.types";
import { Search } from "lucide-react";
import { CRMUser } from "../../api/users.api";

export type TaskStatusFilter = "ALL" | "OPEN" | "COMPLETED";

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: TaskStatusFilter;
  onStatusChange: (status: TaskStatusFilter) => void;
  priorityFilter: string;
  onPriorityChange: (priority: string) => void;
  ownerFilter?: string;
  onOwnerFilterChange?: (owner: string) => void;
  users?: CRMUser[];
  currentUserRole?: string;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  ownerFilter = "all",
  onOwnerFilterChange,
  users = [],
  currentUserRole,
}) => {
  const isAdminOrManager = ["ADMIN", "MANAGER"].includes(currentUserRole || "");

  return (
    <div className="flex flex-col gap-3 bg-card p-3 rounded-lg border border-border/80 shadow-2xs">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between flex-wrap">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full flex h-8 rounded-md border border-input bg-background pl-8 pr-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto flex-wrap gap-y-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-0.5 bg-muted/50 p-0.5 rounded-md border border-border/60">
            <button
              onClick={() => onStatusChange("ALL")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${statusFilter === "ALL" ? 'bg-background shadow-2xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All
            </button>
            <button
              onClick={() => onStatusChange("OPEN")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${statusFilter === "OPEN" ? 'bg-background shadow-2xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Open
            </button>
            <button
              onClick={() => onStatusChange("COMPLETED")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${statusFilter === "COMPLETED" ? 'bg-background shadow-2xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Completed
            </button>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-muted-foreground font-medium"
          >
            <option value="">All Priorities</option>
            {Object.values(Priority).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Owner / Scope Filter */}
          {onOwnerFilterChange && (
            isAdminOrManager ? (
              <select
                value={ownerFilter}
                onChange={(e) => onOwnerFilterChange(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-medium"
              >
                <option value="all">All Tasks</option>
                <option value="announcements">Company Announcements</option>
                <option value="unassigned">Unassigned Tasks</option>
                {users.length > 0 && (
                  <optgroup label="Sales Reps">
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.replace("_", " ")})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            ) : (
              <div className="flex items-center space-x-0.5 bg-muted/50 p-0.5 rounded-md border border-border/60 text-xs font-medium">
                <button
                  onClick={() => onOwnerFilterChange("mine")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    ownerFilter === "mine" ? 'bg-background shadow-2xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My Tasks & Announcements
                </button>
                <button
                  onClick={() => onOwnerFilterChange("announcements")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    ownerFilter === "announcements" ? 'bg-background shadow-2xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Announcements
                </button>
                <button
                  onClick={() => onOwnerFilterChange("unassigned")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    ownerFilter === "unassigned" ? 'bg-background shadow-2xs text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Unassigned
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
