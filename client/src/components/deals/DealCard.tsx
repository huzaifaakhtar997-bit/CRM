import React from "react";
import { Deal } from "../../types/api.types";
import { Badge } from "../ui/Badge";
import { Calendar, Building2, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface DealCardProps {
  deal: Deal;
  onView: (deal: Deal) => void;
  onDragStart: (e: React.DragEvent, deal: Deal) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onView, onDragStart }) => {
  const { user } = useAuth();
  
  // Can only drag if they have write permission
  const canEdit = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");

  const getPriorityVariant = (priority: string): "destructive" | "warning" | "info" | "neutral" => {
    switch (priority) {
      case "URGENT": return "destructive";
      case "HIGH": return "warning";
      case "MEDIUM": return "info";
      case "LOW": return "neutral";
      default: return "neutral";
    }
  };

  const isOverdue = new Date(deal.expectedCloseDate) < new Date() && !deal.closedAt;

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => canEdit && onDragStart(e, deal)}
      onClick={() => onView(deal)}
      className={`bg-card border border-border/80 rounded-md p-3 shadow-2xs hover:border-foreground/30 hover:shadow-subtle transition-all cursor-pointer group select-none ${
        canEdit ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug transition-colors">
          {deal.title}
        </h4>
      </div>
      
      <div className="flex items-center text-xs font-bold text-foreground mb-2.5 font-mono tabular-nums">
        ${deal.value.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground ml-1">{deal.currency}</span>
      </div>
      
      <div className="space-y-1 mb-2.5">
        {deal.company && (
          <div className="flex items-center text-[11px] text-muted-foreground line-clamp-1">
            <Building2 className="w-3 h-3 mr-1.5 flex-shrink-0 text-muted-foreground/70" />
            <span className="truncate">{deal.company.name}</span>
          </div>
        )}
        
        {(!deal.company && deal.contact) && (
          <div className="flex items-center text-[11px] text-muted-foreground line-clamp-1">
            <User className="w-3 h-3 mr-1.5 flex-shrink-0 text-muted-foreground/70" />
            <span className="truncate">{deal.contact.firstName} {deal.contact.lastName}</span>
          </div>
        )}

        <div className={`flex items-center text-[11px] line-clamp-1 font-mono tabular-nums ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-muted-foreground'}`}>
          <Calendar className="w-3 h-3 mr-1.5 flex-shrink-0 text-muted-foreground/70" />
          <span className="truncate">Closes {new Date(deal.expectedCloseDate).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
        <Badge variant={getPriorityVariant(deal.priority)}>
          {deal.priority}
        </Badge>
        
        {deal.assignedUser && (
          <div 
            className="h-5 w-5 rounded-md bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground border border-border/70"
            title={`Assigned to ${deal.assignedUser.name}`}
          >
            {deal.assignedUser.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};
