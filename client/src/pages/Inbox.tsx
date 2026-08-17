import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { conversationsApi } from "../api/conversations.api";
import { Conversation, Message, ConversationStatus, SenderType } from "../types/api.types";
import { ConversationList } from "../components/inbox/ConversationList";
import { ConversationThread } from "../components/inbox/ConversationThread";
import { MessageComposer } from "../components/inbox/MessageComposer";
import { ConversationDetails } from "../components/inbox/ConversationDetails";


export default function Inbox() {
  const { user } = useAuth();
  
  const canSend = ["ADMIN", "MANAGER", "SUPPORT"].includes(user?.role || "");

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "ALL">("ALL");


  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Conversations
  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await conversationsApi.getConversations({
        limit: 50,
        search: debouncedSearch || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingList(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load Messages when a conversation is selected
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    const fetchMessages = async () => {
      setLoadingThread(true);
      try {
        const data = await conversationsApi.getMessages(selectedId, { limit: 100 });
        if (isMounted) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (isMounted) setLoadingThread(false);
      }
    };

    fetchMessages();
    return () => { isMounted = false; };
  }, [selectedId]);

  // Real-time Socket Updates
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleMessageReceive = (data: { message: Message; conversation: Conversation }) => {
      // 1. Update the conversation list
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === data.conversation.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = data.conversation;
          // Bubble to top
          return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        }
        // If not in list, just trigger a reload to ensure proper filtering/pagination
        loadConversations();
        return prev;
      });

      // 2. Append message if it belongs to the currently open thread
      if (selectedId === data.conversation.id) {
        setMessages((prev) => {
          // Avoid duplicates (in case of double emit or optimistic match)
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    };

    socket.on("message:receive", handleMessageReceive);

    // Lightweight sidebar refresh when an inbound message arrived on an assigned
    // conversation that belongs to another user. No message body is sent here.
    const handleConversationUpdated = (data: { conversation: Conversation }) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === data.conversation.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = data.conversation;
          return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        }
        // New conversation not yet in list — reload
        loadConversations();
        return prev;
      });
    };

    socket.on("conversation:updated", handleConversationUpdated);

    return () => {
      socket.off("message:receive", handleMessageReceive);
      socket.off("conversation:updated", handleConversationUpdated);
    };
  }, [socket, selectedId, loadConversations]);

  const handleSendMessage = async (content: string, isInternalNote: boolean) => {
    if (!selectedId || !user) return;

    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const newMessage: Message = {
        id: tempId,
        content,
        senderType: SenderType.USER,
        senderName: user.name,
        senderEmail: user.email,
        isInternalNote,
        createdAt: new Date().toISOString(),
        conversationId: selectedId,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Call API
      const created = await conversationsApi.createMessage(selectedId, {
        content,
        senderType: SenderType.USER,
        isInternalNote,
        senderName: user.name,
        senderEmail: user.email,
      });

      // Replace temp with real
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? created : msg)));

      // Refresh list to bump lastMessageAt
      loadConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      // Revert on failure (reload thread)
      const data = await conversationsApi.getMessages(selectedId, { limit: 100 });
      setMessages(data.messages || []);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedId) || null;

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 flex overflow-hidden bg-background">
      {/* Left Pane: List */}
      <div className="w-1/3 min-w-[300px] max-w-[400px] flex-shrink-0">
        <ConversationList
          conversations={conversations}
          loading={loadingList}
          selectedId={selectedId}
          onSelect={setSelectedId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {/* Middle Pane: Thread */}
      <div className="flex-1 flex flex-col min-w-[400px]">
        {selectedId ? (
          <>
            <div className="p-4 border-b border-border bg-card flex items-center justify-between shadow-sm z-10">
              <div>
                <h3 className="font-semibold text-foreground">
                  {selectedConversation?.subject || "Conversation"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation?.contact
                    ? `${selectedConversation.contact.firstName} ${selectedConversation.contact.lastName}`
                    : "Unknown Contact"}
                </p>
              </div>
            </div>
            <ConversationThread
              messages={messages}
              loading={loadingThread}
              contactName={
                selectedConversation?.contact
                  ? `${selectedConversation.contact.firstName} ${selectedConversation.contact.lastName}`
                  : "Customer"
              }
              contactAvatar={selectedConversation?.contact?.avatarUrl || null}
            />
            {canSend ? (
              <MessageComposer onSend={handleSendMessage} disabled={loadingThread} />
            ) : (
              <div className="p-4 bg-muted text-center text-sm text-muted-foreground border-t">
                You do not have permission to reply to conversations.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 text-muted-foreground">
            <div className="w-16 h-16 bg-white border rounded-full flex items-center justify-center shadow-sm mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground">Your Unified Inbox</h3>
            <p className="text-sm">Select a conversation from the list to get started.</p>
          </div>
        )}
      </div>

      {/* Right Pane: Details */}
      <div className="w-72 flex-shrink-0 hidden lg:block">
        <ConversationDetails conversation={selectedConversation} />
      </div>
    </div>
  );
}
