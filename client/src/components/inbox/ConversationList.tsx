import React from "react";
import { Conversation, ConversationStatus } from "../../types/api.types";
import { ConversationItem } from "./ConversationItem";
import { Search, Loader2 } from "lucide-react";

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: ConversationStatus | "ALL";
  onStatusChange: (status: ConversationStatus | "ALL") => void;
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
}) => {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-4 border-b border-border space-y-4">
        <h2 className="text-lg font-bold text-foreground">Inbox</h2>
        
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

        {/* Filters */}
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
