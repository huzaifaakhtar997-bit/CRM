import React from "react";
import { Deal, PipelineStage } from "../../types/api.types";
import { DealCard } from "./DealCard";

interface DealColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onView: (deal: Deal) => void;
  onDragStart: (e: React.DragEvent, deal: Deal) => void;
  onDrop: (dealId: string, stageId: string) => void;
}

export const DealColumn: React.FC<DealColumnProps> = ({
  stage,
  deals,
  onView,
  onDragStart,
  onDrop,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    if (dealId) {
      onDrop(dealId, stage.id);
    }
  };

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div 
      className="flex flex-col bg-muted/25 rounded-lg w-[290px] min-w-[290px] max-w-[290px] h-full border border-border/80 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div 
        className="p-3 border-b border-border/70 bg-card flex flex-col space-y-1 relative overflow-hidden shadow-2xs"
      >
        <div 
          className="absolute top-0 left-0 w-full h-0.5" 
          style={{ backgroundColor: stage.color || '#94a3b8' }} 
        />
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center space-x-1.5 truncate pr-2">
            <span 
              className="w-2 h-2 rounded-full shrink-0" 
              style={{ backgroundColor: stage.color || '#94a3b8' }} 
            />
            <h3 className="font-semibold text-foreground text-xs tracking-tight truncate">
              {stage.name}
            </h3>
          </div>
          <span className="bg-muted text-muted-foreground text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border border-border/60">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
          <span className="font-mono tabular-nums font-semibold text-foreground text-[11px]">
            ${totalValue.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {stage.probability}% Win
          </span>
        </div>
      </div>

      {/* Column Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
        {deals.map(deal => (
          <DealCard 
            key={deal.id} 
            deal={deal} 
            onView={onView} 
            onDragStart={onDragStart} 
          />
        ))}
        {deals.length === 0 && (
          <div className="h-20 border border-dashed border-border/70 rounded-md flex items-center justify-center text-[11px] text-muted-foreground/70">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  );
};
