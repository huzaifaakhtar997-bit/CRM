import React, { useEffect, useRef, useState, useMemo } from "react";
import { Message, SenderType } from "../../types/api.types";
import { Shield, MoreHorizontal, Megaphone } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function stripHtml(html: string): string {
  if (!html) return "";
  let text = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");

  return text
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseEmailContent(raw: string): { cleanContent: string; quotedText?: string } {
  if (!raw) return { cleanContent: "" };

  // 1. Check for email quote boundaries (Gmail, Outlook, Apple Mail, standard blockquotes)
  const quotePattern =
    /(?:<div[^>]*class=["'][^"']*(?:gmail_quote|gmail_extra)[^"']*["'][^>]*>|<blockquote[^>]*>|<div[^>]*id=["'](?:divRplyFwdMsg|appendonsend)["'][^>]*>|(?:\r?\n|^)\s*(?:On\s+.*,\s+.*wrote:|On\s+.*wrote:|---+\s*Original Message\s*---+|From:\s*.*|Sent:\s*.*))[\s\S]*/i;

  const quoteMatch = raw.match(quotePattern);

  let cleanRaw = raw;
  let quotedRaw: string | undefined;

  if (quoteMatch && quoteMatch.index !== undefined && quoteMatch.index >= 0) {
    cleanRaw = raw.substring(0, quoteMatch.index);
    quotedRaw = raw.substring(quoteMatch.index);
  }

  const cleanContent = stripHtml(cleanRaw) || stripHtml(raw);
  const quotedText = quotedRaw ? stripHtml(quotedRaw) : undefined;

  return {
    cleanContent: cleanContent || raw,
    quotedText: quotedText && quotedText !== cleanContent ? quotedText : undefined,
  };
}

const MessageBubbleContent: React.FC<{ content: string; isCustomer: boolean }> = ({ content }) => {
  const [showQuote, setShowQuote] = useState(false);
  const { cleanContent, quotedText } = useMemo(() => parseEmailContent(content), [content]);

  return (
    <div className="space-y-2">
      <div className="whitespace-pre-wrap break-words leading-relaxed">{cleanContent}</div>
      {quotedText && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowQuote(!showQuote)}
            className="inline-flex items-center gap-1 text-[11px] font-medium opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
            title={showQuote ? "Hide quoted history" : "Show quoted email history"}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
            <span>{showQuote ? "Hide quote" : "Quoted text"}</span>
          </button>
          {showQuote && (
            <div className="mt-2 p-2.5 rounded-lg bg-black/5 dark:bg-black/20 text-xs opacity-75 border-l-2 border-current whitespace-pre-wrap max-h-56 overflow-y-auto font-mono text-[11px]">
              {quotedText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
            {/* Mention above for campaign replies */}
            {isCustomer && (message.isFromCampaign || (message as any).campaignName) && (
              <div className="mb-1 px-1 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-semibold tracking-tight shadow-2xs">
                  <Megaphone className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  (from campaign{(message as any).campaignName ? `: ${(message as any).campaignName}` : ""})
                </span>
              </div>
            )}

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
                "px-4 py-3 rounded-2xl text-sm relative group",
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
              <MessageBubbleContent content={message.content} isCustomer={isCustomer} />
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
