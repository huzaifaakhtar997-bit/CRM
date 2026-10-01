import React from "react";
import { RepReportItem } from "../../types/api.types";
import { Users, Filter } from "lucide-react";

interface RepPerformanceMatrixProps {
  repPerformance: RepReportItem[];
  onSelectRep: (repId: string) => void;
  loading: boolean;
}

export const RepPerformanceMatrix: React.FC<RepPerformanceMatrixProps> = ({
  repPerformance,
  onSelectRep,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-card border border-border/80 rounded-lg p-5 shadow-2xs animate-pulse space-y-4">
        <div className="h-5 bg-muted rounded w-1/4"></div>
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/40 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!repPerformance || repPerformance.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border/80 rounded-lg shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-border/80 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Sales Rep Performance Matrix
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comparative team revenue attribution, closing velocity, and portfolio sizes
          </p>
        </div>
        <span className="text-[11px] font-medium font-mono tabular-nums px-2 py-0.5 bg-muted/60 text-foreground border border-border/60 rounded self-start sm:self-auto">
          {repPerformance.length} Active Reps
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-[11px] uppercase font-semibold border-b border-border/80 tracking-wider">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Sales Rep</th>
              <th className="py-2.5 px-4 font-semibold text-right">Won Revenue</th>
              <th className="py-2.5 px-4 font-semibold text-right">Active Pipeline</th>
              <th className="py-2.5 px-4 font-semibold text-center">Win Rate</th>
              <th className="py-2.5 px-4 font-semibold text-center">Contacts</th>
              <th className="py-2.5 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {repPerformance.map((rep) => (
              <tr key={rep.userId} className="hover:bg-muted/40 transition-colors">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6.5 h-6.5 rounded-full bg-secondary border border-border/80 flex items-center justify-center text-foreground font-semibold text-xs shrink-0">
                      {rep.avatarUrl ? (
                        <img src={rep.avatarUrl} alt={rep.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        rep.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        {rep.name}
                        <span className="text-[10px] px-1 py-0.2 rounded font-medium bg-muted text-muted-foreground border border-border/60">
                          {rep.role.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                        {rep.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="font-bold font-mono tabular-nums text-xs text-emerald-600 dark:text-emerald-400">
                    ${rep.wonRevenue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {rep.wonDealsCount} {rep.wonDealsCount === 1 ? "deal" : "deals"} won
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="font-semibold font-mono tabular-nums text-xs text-foreground">
                    ${rep.pipelineValue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {rep.openDealsCount} in progress
                  </div>
                </td>
                <td className="py-2.5 px-4">
                  <div className="w-20 mx-auto">
                    <div className="flex justify-between text-[11px] font-mono tabular-nums font-medium text-foreground mb-0.5">
                      <span>{rep.winRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, rep.winRate)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-center font-semibold font-mono tabular-nums text-xs text-foreground">
                  {rep.totalContacts}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <button
                    onClick={() => onSelectRep(rep.userId)}
                    className="inline-flex items-center gap-1 h-7 px-2 text-xs font-medium rounded-md border border-border/80 hover:bg-muted text-foreground transition-colors"
                  >
                    <Filter className="w-3 h-3 text-muted-foreground" /> Filter Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
