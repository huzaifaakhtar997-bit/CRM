import React, { useState, useEffect } from "react";
import { Contact, ConversationChannel, SenderType } from "../../types/api.types";
import { conversationsApi } from "../../api/conversations.api";
import { Button } from "../ui/button";
import { X, Mail, Send, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SendEmailModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  contact,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubject("");
      setContent("");
      setError(null);
      setSentSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !contact) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.email) {
      setError("This contact does not have a valid email address.");
      return;
    }
    if (!subject.trim()) {
      setError("Please provide an email subject line.");
      return;
    }
    if (!content.trim()) {
      setError("Please write a message to send.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      // 1. Create conversation linked to this contact
      const conversation = await conversationsApi.createConversation({
        subject: subject.trim(),
        channel: ConversationChannel.EMAIL,
        contactId: contact.id,
      });

      // 2. Create the first outbound message (triggers Resend sending via backend)
      await conversationsApi.createMessage(conversation.id, {
        content: content.trim(),
        senderType: SenderType.USER,
      });

      setSentSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to send email. Please check your email configuration."
      );
    } finally {
      setSending(false);
    }
  };

  const handleGoToInbox = () => {
    onClose();
    navigate("/inbox");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Mail className="w-5 h-5 text-primary" />
            <span>Send Email to Contact</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        {sentSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Email Sent Successfully!</h3>
            <p className="text-sm text-muted-foreground">
              Your message was sent to <strong className="text-foreground">{contact.email}</strong> and a new conversation thread was created in your Unified Inbox.
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
              <Button onClick={handleGoToInbox} className="gap-2">
                View in Inbox <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4">
            {/* Recipient info */}
            <div className="p-3 bg-accent/40 rounded-lg border flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-muted-foreground font-medium">To:</span>
                <span className="font-semibold text-foreground truncate">
                  {contact.firstName} {contact.lastName}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  ({contact.email || "No email"})
                </span>
              </div>
            </div>

            {!contact.email && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  This contact does not have an email address. Edit the contact to add one before sending.
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Subject</label>
              <input
                type="text"
                required
                placeholder="e.g. Following up on our meeting"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending || !contact.email}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Message</label>
              <textarea
                required
                rows={5}
                placeholder="Write your email message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={sending || !contact.email}
                className="w-full p-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sending || !contact.email || !subject.trim() || !content.trim()}
                className="gap-2"
              >
                {sending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Email
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

