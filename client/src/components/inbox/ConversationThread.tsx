import React, { useEffect, useRef } from "react";
import { Message, SenderType } from "../../types/api.types";
import { Shield } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ConversationThreadProps {
  messages: Message[];
  loading: boolean;
  contactName: string;
  contactAvatar: string | null;
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  messages,
  loading,
  contactName,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="animate-pulse text-muted-foreground text-sm">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 text-muted-foreground p-8">
        <MessageSquareIcon className="w-12 h-12 mb-4 text-border" />
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-6">
      {messages.map((message) => {
        const isCustomer = message.senderType === SenderType.CUSTOMER;
        const isInternalNote = message.isInternalNote;

        return (
          <div
            key={message.id}
            className={cn(
              "flex flex-col max-w-[85%]",
              isCustomer ? "items-start" : "items-end ml-auto"
            )}
          >
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <span className="text-xs font-semibold text-foreground">
                {isCustomer ? message.senderName || contactName : message.senderName || "You"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(message.createdAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div
              className={cn(
                "px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap relative group",
                isInternalNote
                  ? "bg-amber-50 text-amber-900 border border-amber-200 rounded-tr-sm"
                  : isCustomer
                  ? "bg-white border border-border text-foreground rounded-tl-sm shadow-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm shadow-sm"
              )}
            >
              {isInternalNote && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 mb-1.5 uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  Internal Note
                </div>
              )}
              {message.content}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};

// Temp icon for empty state
function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
