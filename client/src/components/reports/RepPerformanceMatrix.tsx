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
      <div className="bg-card border rounded-2xl p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 bg-accent rounded w-1/4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-accent/40 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!repPerformance || repPerformance.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
      <div className="p-6 border-b border-border bg-gradient-to-r from-accent/20 via-transparent to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Sales Rep Performance Matrix
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Comparative team revenue attribution, closing velocity, and portfolio sizes
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-lg self-start sm:self-auto">
          {repPerformance.length} Active Reps
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
            <tr>
              <th className="py-3 px-4">Sales Rep</th>
              <th className="py-3 px-4 text-right">Won Revenue</th>
              <th className="py-3 px-4 text-right">Active Pipeline</th>
              <th className="py-3 px-4 text-center">Win Rate</th>
              <th className="py-3 px-4 text-center">Contacts</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {repPerformance.map((rep) => (
              <tr key={rep.userId} className="hover:bg-accent/20 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {rep.avatarUrl ? (
                        <img src={rep.avatarUrl} alt={rep.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        rep.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {rep.name}
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-muted text-muted-foreground">
                          {rep.role}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {rep.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    ${rep.wonRevenue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {rep.wonDealsCount} {rep.wonDealsCount === 1 ? "deal" : "deals"} won
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="font-semibold text-foreground">
                    ${rep.pipelineValue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {rep.openDealsCount} in progress
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="w-24 mx-auto">
                    <div className="flex justify-between text-[11px] font-medium text-foreground mb-1">
                      <span>{rep.winRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(100, rep.winRate)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center font-semibold text-foreground">
                  {rep.totalContacts}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => onSelectRep(rep.userId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-accent/60 hover:bg-accent text-foreground transition-colors"
                  >
                    <Filter className="w-3 h-3 text-primary" /> Filter Report
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
