import React, { useState } from "react";
import { Deal, PipelineStage } from "../../types/api.types";
import { DealColumn } from "./DealColumn";
import { AlertCircle } from "lucide-react";

interface DealBoardProps {
  stages: PipelineStage[];
  deals: Deal[];
  loading: boolean;
  onView: (deal: Deal) => void;
  onMoveStage: (dealId: string, newStageId: string) => Promise<void>;
}

export const DealBoard: React.FC<DealBoardProps> = ({
  stages,
  deals,
  loading,
  onView,
  onMoveStage,
}) => {
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals);
  const [isDragging, setIsDragging] = useState(false);

  // Sync local state when props change (unless dragging to prevent flicker)
  React.useEffect(() => {
    if (!isDragging) {
      setLocalDeals(deals);
    }
  }, [deals, isDragging]);

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", deal.id);
    e.dataTransfer.effectAllowed = "move";
    
    // Optional: add a ghost image or styling
  };

  const handleDrop = async (dealId: string, newStageId: string) => {
    setIsDragging(false);
    const deal = localDeals.find(d => d.id === dealId);
    
    if (!deal || deal.stageId === newStageId) return;

    // Optimistic UI update
    const previousDeals = [...localDeals];
    setLocalDeals(prev => prev.map(d => 
      d.id === dealId ? { ...d, stageId: newStageId } : d
    ));

    try {
      await onMoveStage(dealId, newStageId);
      // Actual state will be synced from parent shortly
    } catch (err) {
      // Revert optimistic update
      setLocalDeals(previousDeals);
    }
  };

  if (loading && stages.length === 0) {
    return (
      <div className="flex space-x-6 overflow-x-auto pb-4 h-[600px]">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex flex-col bg-accent/20 rounded-xl w-[320px] min-w-[320px] border">
            <div className="p-3 border-b bg-card"><div className="h-5 bg-accent animate-pulse rounded w-1/2"></div></div>
            <div className="p-3 space-y-3">
              {[1, 2].map(j => <div key={j} className="h-32 bg-card animate-pulse rounded-lg border"></div>)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="w-full bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground">No Pipeline Stages Found</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          Please configure pipeline stages in the backend to display the Kanban board.
        </p>
      </div>
    );
  }

  return (
    <div className="flex space-x-6 overflow-x-auto pb-4 h-[calc(100vh-280px)] min-h-[500px]">
      {stages.map(stage => (
        <DealColumn
          key={stage.id}
          stage={stage}
          deals={localDeals.filter(d => d.stageId === stage.id)}
          onView={onView}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
};
