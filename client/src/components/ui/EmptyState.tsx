import React from "react";
import { Button } from "./button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`w-full bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-xs ${className}`}
    >
      <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 border border-primary/20 shadow-2xs">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} size="sm" className="gap-1.5 shadow-xs">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
