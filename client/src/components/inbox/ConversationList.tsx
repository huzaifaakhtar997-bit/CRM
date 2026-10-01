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
    <div className="flex flex-col h-full bg-card border-r border-border/80">
      <div className="p-3 border-b border-border/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground uppercase">Inbox</h2>
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
              {conversations.length}
            </span>
          </div>
          <RefreshButton onRefresh={onRefresh} variant="header" label="Refresh" />
        </div>

        {/* Ownership Scope Tabs */}
        <div className="flex bg-muted/50 p-0.5 rounded-md border border-border/60 gap-0.5 text-xs">
          {isAdminOrManager && (
            <button
              type="button"
              onClick={() => onAssigneeFilterChange("all")}
              className={`flex-1 py-1 px-2 rounded font-medium text-center transition-all text-xs ${
                assigneeFilter === "all"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
          )}
          <button
            type="button"
            onClick={() => onAssigneeFilterChange("mine")}
            className={`flex-1 py-1 px-2 rounded font-medium text-center transition-all text-xs ${
              assigneeFilter === "mine"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Chats
          </button>
          <button
            type="button"
            onClick={() => onAssigneeFilterChange("unassigned")}
            className={`flex-1 py-1 px-2 rounded font-medium text-center transition-all text-xs ${
              assigneeFilter === "unassigned"
                ? "bg-background text-foreground shadow-2xs font-semibold"
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
              className="w-full text-xs h-7 px-2 rounded-md border border-input bg-background text-foreground"
            >
              <option value="">Select Rep...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-background border border-input rounded-md pl-8 pr-3 h-8 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {(["ALL", ...Object.values(ConversationStatus)] as Array<ConversationStatus | "ALL">).map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/70"
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
