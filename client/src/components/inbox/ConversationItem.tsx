import React from "react";
import { Conversation, ConversationStatus } from "../../types/api.types";
import { User, Mail, MessageSquare, Clock, Megaphone, UserCheck, Trash2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: (conversation: Conversation) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
  onDelete,
}) => {
  const contactName = conversation.contact
    ? `${conversation.contact.firstName} ${conversation.contact.lastName}`
    : conversation.lead
    ? `${conversation.lead.firstName} ${conversation.lead.lastName || ""}`.trim()
    : "Unknown Contact";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "w-full text-left p-3 border-b border-border/60 transition-colors hover:bg-muted/40 focus:outline-none cursor-pointer group relative",
        isSelected ? "bg-muted/60 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2 max-w-[72%]">
          <div className="w-6.5 h-6.5 rounded-full bg-secondary text-foreground border border-border/70 flex items-center justify-center flex-shrink-0 text-[11px] font-semibold">
            {conversation.contact?.avatarUrl ? (
              <img src={conversation.contact.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : conversation.lead ? (
              <span>{conversation.lead.firstName.charAt(0).toUpperCase()}</span>
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="font-semibold text-xs text-foreground truncate" title={contactName}>
            {contactName}
          </span>
        </div>
        <span className="font-mono tabular-nums text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {formatDate(conversation.lastMessageAt)}
        </span>
      </div>

      <div className="pl-8.5">
        <div className="text-xs font-medium text-foreground truncate" title={conversation.subject || "No Subject"}>
          {conversation.subject || "No Subject"}
        </div>
        {conversation.snippet && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5 line-clamp-1" title={conversation.snippet}>
            {conversation.snippet}
          </p>
        )}
        <div className="flex items-center justify-between mt-1.5 pt-0.5">
          <div className="flex items-center gap-1 flex-wrap">
            <Badge
              variant={
                conversation.status === ConversationStatus.OPEN
                  ? "info"
                  : conversation.status === ConversationStatus.PENDING
                  ? "warning"
                  : conversation.status === ConversationStatus.RESOLVED
                  ? "success"
                  : "neutral"
              }
            >
              {conversation.status}
            </Badge>
            {conversation.lead && !conversation.contact && (
              <Badge variant="info">Lead</Badge>
            )}
            {(conversation.isFromCampaign || (conversation as any).campaignName) && (
              <Badge variant="purple" icon={Megaphone}>
                campaign
              </Badge>
            )}
            {conversation.assignedUser ? (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[90px]" title={`Assigned to ${conversation.assignedUser.name}`}>
                <UserCheck className="w-2.5 h-2.5 text-primary shrink-0" />
                <span className="truncate">{conversation.assignedUser.name.split(" ")[0]}</span>
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/50 italic">
                Unassigned
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conversation);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all focus:opacity-100"
                title="Delete conversation"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            <span title={conversation.channel === "EMAIL" ? "Email channel" : "Chat channel"}>
              {conversation.channel === "EMAIL" ? (
                <Mail className="w-3 h-3 text-muted-foreground/70 shrink-0" />
              ) : (
                <MessageSquare className="w-3 h-3 text-muted-foreground/70 shrink-0" />
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
