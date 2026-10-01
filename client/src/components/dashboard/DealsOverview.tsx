import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Deal } from "../../types/api.types";
import { ArrowRight, AlertCircle, Briefcase } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";

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
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border/80 rounded-lg shadow-2xs flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/70">
        <div>
          <h3 className="font-semibold text-sm text-foreground tracking-tight">Recent Deals</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active revenue pipeline</p>
        </div>
        <Link
          to="/deals"
          className="text-xs font-semibold text-foreground hover:text-muted-foreground inline-flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-0 flex-1 overflow-x-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3.5 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <AlertCircle className="w-7 h-7 text-rose-500/60 mb-2" />
            <p className="text-sm font-medium text-foreground">Unable to load recent deals</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">{error}</p>
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-foreground hover:underline"
            >
              Try again
            </button>
          </div>
        ) : deals.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No active deals"
            description="Create your first deal to track your sales pipeline."
            actionLabel="Add Deal"
            onAction={() => navigate("/deals")}
            className="border-0 shadow-none py-8"
          />
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border/70">
              <tr>
                <th className="px-4 py-2 font-medium">Deal</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Stage</th>
                <th className="px-4 py-2 font-medium text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  onClick={() => navigate("/deals")}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-xs text-foreground truncate group-hover:text-foreground transition-colors max-w-[170px]" title={deal.title}>
                      {deal.title}
                    </div>
                    {deal.company?.name && (
                      <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                        {deal.company.name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: deal.stage.color || "#94a3b8" }}
                      />
                      <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">
                        {deal.stage.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-semibold text-xs text-foreground font-mono tabular-nums">
                      ${Number(deal.value || 0).toLocaleString()}
                    </span>
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
