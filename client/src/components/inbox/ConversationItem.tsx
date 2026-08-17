import React from "react";
import { Conversation, ConversationStatus } from "../../types/api.types";
import { User, Mail, MessageSquare, Clock } from "lucide-react";
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
        return "bg-blue-100 text-blue-700";
      case ConversationStatus.PENDING:
        return "bg-amber-100 text-amber-700";
      case ConversationStatus.RESOLVED:
        return "bg-emerald-100 text-emerald-700";
      case ConversationStatus.CLOSED:
        return "bg-gray-100 text-gray-700";
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
        <div className="text-sm font-medium text-foreground truncate mb-1" title={conversation.subject || "No Subject"}>
          {conversation.subject || "No Subject"}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span
            className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full",
              getStatusColor(conversation.status)
            )}
          >
            {conversation.status}
          </span>
          {conversation.channel === "EMAIL" ? (
            <Mail className="w-3 h-3 text-muted-foreground" />
          ) : (
            <MessageSquare className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      </div>
    </button>
  );
};
