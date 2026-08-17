import React from "react";
import { Link } from "react-router-dom";
import { Deal } from "../../types/api.types";
import { ArrowRight, AlertCircle, DollarSign } from "lucide-react";

interface DealsOverviewProps {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const DealsOverview: React.FC<DealsOverviewProps> = ({
  deals,
  loading,
  error,
  onRetry,
}) => {
  return (
    <div className="bg-card border rounded-xl shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="font-semibold text-lg text-foreground">Recent Deals</h3>
        <Link
          to="/deals"
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center transition-colors"
        >
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="p-0 flex-1 overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-10 w-10 bg-accent rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-accent rounded w-1/3"></div>
                  <div className="h-3 bg-accent rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <AlertCircle className="w-8 h-8 text-destructive/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Unable to load recent deals.</p>
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-sm text-muted-foreground">No active deals.</p>
            <p className="text-xs text-muted-foreground mt-1">Start by creating your first deal.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-accent/30 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Deal Title</th>
                <th className="px-6 py-3 font-medium">Value</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-accent/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{deal.title}</div>
                    {deal.expectedCloseDate && (
                      <div className="text-xs text-muted-foreground">
                        Closes: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center font-medium text-foreground">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground mr-0.5" />
                      {deal.value.toLocaleString()} {deal.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: deal.stage.color || '#94a3b8' }}
                      ></div>
                      <span className="text-sm text-muted-foreground">{deal.stage.name}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
