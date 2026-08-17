import React from "react";
import { Conversation } from "../../types/api.types";
import { User, Mail } from "lucide-react";
import { Link } from "react-router-dom";

interface ConversationDetailsProps {
  conversation: Conversation | null;
}

export const ConversationDetails: React.FC<ConversationDetailsProps> = ({ conversation }) => {
  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-card text-muted-foreground p-8 text-center text-sm border-l border-border">
        Select a conversation to view details
      </div>
    );
  }

  const { contact, assignedUser } = conversation;

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
            <div className="text-sm text-muted-foreground italic">No contact associated.</div>
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
    </div>
  );
};
