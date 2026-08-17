import React from "react";
import { Deal } from "../../types/api.types";
import { DollarSign, Calendar, Building2, User } from "lucide-react";
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-100 text-red-800 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM": return "bg-blue-100 text-blue-800 border-blue-200";
      case "LOW": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isOverdue = new Date(deal.expectedCloseDate) < new Date() && !deal.closedAt;

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => canEdit && onDragStart(e, deal)}
      onClick={() => onView(deal)}
      className={`bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {deal.title}
        </h4>
      </div>
      
      <div className="flex items-center text-sm font-medium text-foreground mb-3">
        <DollarSign className="w-3.5 h-3.5 text-muted-foreground mr-0.5" />
        {deal.value.toLocaleString()} {deal.currency}
      </div>
      
      <div className="space-y-1.5 mb-3">
        {deal.company && (
          <div className="flex items-center text-xs text-muted-foreground line-clamp-1">
            <Building2 className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">{deal.company.name}</span>
          </div>
        )}
        
        {(!deal.company && deal.contact) && (
          <div className="flex items-center text-xs text-muted-foreground line-clamp-1">
            <User className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate">{deal.contact.firstName} {deal.contact.lastName}</span>
          </div>
        )}

        <div className={`flex items-center text-xs line-clamp-1 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
          <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          <span className="truncate">Closes {new Date(deal.expectedCloseDate).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t">
        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border uppercase tracking-wider ${getPriorityColor(deal.priority)}`}>
          {deal.priority}
        </span>
        
        {deal.assignedUser && (
          <div 
            className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary border border-primary/20"
            title={`Assigned to ${deal.assignedUser.name}`}
          >
            {deal.assignedUser.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};
