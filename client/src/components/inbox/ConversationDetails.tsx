import React, { useState, useEffect } from "react";
import { Conversation, Message, Contact, SenderType } from "../../types/api.types";
import { contactsApi } from "../../api/contacts.api";
import { conversationsApi } from "../../api/conversations.api";
import { Button } from "../ui/button";
import { User, Mail, UserPlus, Link as LinkIcon, Loader2, Check, X, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface ConversationDetailsProps {
  conversation: Conversation | null;
  messages?: Message[];
  onConversationUpdated?: () => void;
}

export const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
  messages = [],
  onConversationUpdated,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Create Contact form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Link Existing Contact state
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Extract sender details from the thread messages
  const customerMsg = messages.find(
    (m) => m.senderType === SenderType.CUSTOMER && m.senderEmail
  );
  const detectedEmail = customerMsg?.senderEmail || "";
  const rawSenderName = customerMsg?.senderName || detectedEmail.split("@")[0] || "";

  useEffect(() => {
    if (detectedEmail) {
      const parts = rawSenderName.trim().split(/\s+/);
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setEmail(detectedEmail);
    }
  }, [detectedEmail, rawSenderName]);

  // Load contacts list for linking
  useEffect(() => {
    if (showLinkModal) {
      contactsApi.getContacts({ limit: 100 }).then((res) => {
        setAllContacts(res.contacts || []);
      }).catch(console.error);
    }
  }, [showLinkModal]);

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-card text-muted-foreground p-8 text-center text-sm border-l border-border">
        Select a conversation to view details
      </div>
    );
  }

  const { contact, assignedUser } = conversation;

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setCreateError("First name is required.");
      return;
    }
    setCreating(true);
    setCreateError(null);

    try {
      // 1. Create Contact
      const newContact = await contactsApi.createContact({
        firstName: firstName.trim(),
        lastName: lastName.trim() || "",
        email: email.trim().toLowerCase(),
      });

      // 2. Link conversation to newly created contact
      await conversationsApi.updateConversation(conversation.id, {
        contactId: newContact.id,
      });

      setShowCreateModal(false);
      if (onConversationUpdated) onConversationUpdated();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || err.message || "Failed to create contact.");
    } finally {
      setCreating(false);
    }
  };

  const handleLinkContact = async (contactId: string) => {
    if (!contactId) return;
    setLinking(true);
    setLinkError(null);

    try {
      await conversationsApi.updateConversation(conversation.id, {
        contactId,
      });

      setShowLinkModal(false);
      if (onConversationUpdated) onConversationUpdated();
    } catch (err: any) {
      setLinkError(err.response?.data?.message || err.message || "Failed to link contact.");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Conversation Details</h3>
      </div>

      <div className="p-6 space-y-8">
        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Contact
          </h4>
          {contact ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {contact.avatarUrl ? (
                    <img src={contact.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {contact.firstName} {contact.lastName}
                  </div>
                  <Link
                    to="/contacts"
                    className="text-xs text-primary hover:underline"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
              
              <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate" title={contact.email}>{contact.email}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 bg-accent/30 rounded-xl border border-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Unregistered Sender</span>
                </div>

                <div>
                  <div className="font-medium text-sm text-foreground">
                    {rawSenderName || "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground break-all">
                    {detectedEmail || "No email address found"}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Button
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add as Contact
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5 font-medium"
                    onClick={() => setShowLinkModal(true)}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Link to Existing
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assignment Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Assignment
          </h4>
          {assignedUser ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {assignedUser.avatarUrl ? (
                  <img src={assignedUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{assignedUser.name.charAt(0)}</span>
                )}
              </div>
              <div className="text-sm">
                <div className="font-medium text-foreground">{assignedUser.name}</div>
                <div className="text-xs text-muted-foreground">{assignedUser.email}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">Unassigned</div>
          )}
        </div>

        {/* Thread Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Thread Data
          </h4>
          <div className="text-sm space-y-2 text-muted-foreground">
            <div className="flex justify-between">
              <span>Channel:</span>
              <span className="font-medium text-foreground">{conversation.channel}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium text-foreground">{conversation.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Created:</span>
              <span className="font-medium text-foreground">
                {new Date(conversation.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Contact Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-xl border shadow-xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-sm text-foreground">Add as Contact</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateContact} className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating} className="gap-1.5">
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save & Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Existing Contact Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-xl border shadow-xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-sm text-foreground">Link Existing Contact</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {linkError && (
              <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{linkError}</span>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-sm"
              />

              <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-border">
                {allContacts
                  .filter((c) =>
                    `${c.firstName} ${c.lastName} ${c.email || ""}`
                      .toLowerCase()
                      .includes(contactSearch.toLowerCase())
                  )
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={linking}
                      onClick={() => handleLinkContact(c.id)}
                      className="w-full text-left p-2 hover:bg-accent rounded transition-colors text-xs space-y-0.5"
                    >
                      <div className="font-medium text-foreground">{c.firstName} {c.lastName}</div>
                      <div className="text-muted-foreground">{c.email || "No email"}</div>
                    </button>
                  ))}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowLinkModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

