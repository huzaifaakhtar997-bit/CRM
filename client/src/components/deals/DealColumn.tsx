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
      className="flex flex-col bg-accent/20 rounded-xl w-[320px] min-w-[320px] max-w-[320px] h-full border overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div 
        className="p-3 border-b bg-card flex flex-col space-y-1 relative overflow-hidden shadow-sm"
      >
        <div 
          className="absolute top-0 left-0 w-full h-1" 
          style={{ backgroundColor: stage.color || '#94a3b8' }} 
        />
        <div className="flex items-center justify-between mt-1">
          <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider truncate pr-2">
            {stage.name}
          </h3>
          <span className="bg-accent text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>${totalValue.toLocaleString()}</span>
          <span>{stage.probability}% Win</span>
        </div>
      </div>

      {/* Column Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {deals.map(deal => (
          <DealCard 
            key={deal.id} 
            deal={deal} 
            onView={onView} 
            onDragStart={onDragStart} 
          />
        ))}
        {deals.length === 0 && (
          <div className="h-24 border-2 border-dashed border-accent rounded-lg flex items-center justify-center text-xs text-muted-foreground">
            Drop deals here
          </div>
        )}
      </div>
    </div>
  );
};
