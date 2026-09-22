import React from "react";
import { Conversation, ConversationStatus } from "../../types/api.types";
import { CRMUser } from "../../api/users.api";
import { ConversationItem } from "./ConversationItem";
import { Search, Loader2 } from "lucide-react";
import { RefreshButton } from "../ui/RefreshButton";

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: ConversationStatus | "ALL";
  onStatusChange: (status: ConversationStatus | "ALL") => void;
  onRefresh?: () => void | Promise<void>;
  assigneeFilter: string;
  onAssigneeFilterChange: (filter: string) => void;
  users?: CRMUser[];
  isAdminOrManager?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onRefresh,
  assigneeFilter,
  onAssigneeFilterChange,
  users = [],
  isAdminOrManager = false,
}) => {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Inbox</h2>
          <RefreshButton onRefresh={onRefresh} variant="header" label="Refresh" />
        </div>

        {/* Ownership Scope Tabs */}
        <div className="flex bg-muted/60 p-1 rounded-lg gap-1 text-xs">
          {isAdminOrManager && (
            <button
              type="button"
              onClick={() => onAssigneeFilterChange("all")}
              className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
                assigneeFilter === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
          )}
          <button
            type="button"
            onClick={() => onAssigneeFilterChange("mine")}
            className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
              assigneeFilter === "mine"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Chats
          </button>
          <button
            type="button"
            onClick={() => onAssigneeFilterChange("unassigned")}
            className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
              assigneeFilter === "unassigned"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unassigned
          </button>
        </div>

        {/* For Admin/Manager: Rep filter dropdown if selecting a specific team member */}
        {isAdminOrManager && users.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">Filter Rep:</span>
            <select
              value={["all", "mine", "unassigned"].includes(assigneeFilter) ? "" : assigneeFilter}
              onChange={(e) => {
                if (e.target.value) onAssigneeFilterChange(e.target.value);
              }}
              className="w-full text-xs h-7 px-2 rounded border border-input bg-background text-foreground"
            >
              <option value="">Select Rep...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-accent/50 border border-input rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(["ALL", ...Object.values(ConversationStatus)] as Array<ConversationStatus | "ALL">).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent/80"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No conversations found.
          </div>
        ) : (
          <div className="flex flex-col">
            {conversations.map((convo) => (
              <ConversationItem
                key={convo.id}
                conversation={convo}
                isSelected={convo.id === selectedId}
                onClick={() => onSelect(convo.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
