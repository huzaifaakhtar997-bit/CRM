import React from "react";
import { Conversation, ConversationStatus } from "../../types/api.types";
import { User, Mail, MessageSquare, Clock, Megaphone, UserCheck } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
}) => {
  const contactName = conversation.contact
    ? `${conversation.contact.firstName} ${conversation.contact.lastName}`
    : "Unknown Contact";

  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case ConversationStatus.OPEN:
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300";
      case ConversationStatus.PENDING:
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300";
      case ConversationStatus.RESOLVED:
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300";
      case ConversationStatus.CLOSED:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 border-b border-border transition-colors hover:bg-accent/50 focus:outline-none",
        isSelected ? "bg-accent border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
      )}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2 max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            {conversation.contact?.avatarUrl ? (
              <img src={conversation.contact.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <span className="font-semibold text-sm text-foreground truncate" title={contactName}>
            {contactName}
          </span>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(conversation.lastMessageAt)}
        </span>
      </div>

      <div className="pl-10">
        <div className="text-sm font-medium text-foreground truncate" title={conversation.subject || "No Subject"}>
          {conversation.subject || "No Subject"}
        </div>
        {conversation.snippet && (
          <p className="text-xs text-muted-foreground truncate mt-0.5" title={conversation.snippet}>
            {conversation.snippet}
          </p>
        )}
        <div className="flex items-center justify-between mt-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full",
                getStatusColor(conversation.status)
              )}
            >
              {conversation.status}
            </span>
            {(conversation.isFromCampaign || (conversation as any).campaignName) && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 shadow-2xs">
                <Megaphone className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                (from campaign)
              </span>
            )}
            {conversation.assignedUser ? (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[100px]" title={`Assigned to ${conversation.assignedUser.name}`}>
                <UserCheck className="w-2.5 h-2.5 text-primary shrink-0" />
                <span className="truncate">{conversation.assignedUser.name.split(" ")[0]}</span>
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/60 italic">
                Unassigned
              </span>
            )}
          </div>
          <span title={conversation.channel === "EMAIL" ? "Email channel" : "Chat channel"}>
            {conversation.channel === "EMAIL" ? (
              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
          </span>
        </div>
      </div>
    </button>
  );
};
