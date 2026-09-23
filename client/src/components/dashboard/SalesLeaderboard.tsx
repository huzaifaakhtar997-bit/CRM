import React, { useState } from "react";
import { RepLeaderboardEntry, CompanyKPISummary } from "../../types/api.types";
import { Trophy, TrendingUp, DollarSign, Target, MessageSquare, CheckCircle2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SalesLeaderboardProps {
  leaderboard: RepLeaderboardEntry[];
  companyKPIs?: CompanyKPISummary;
  loading: boolean;
}

export const SalesLeaderboard: React.FC<SalesLeaderboardProps> = ({
  leaderboard,
  companyKPIs,
  loading,
}) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"wonRevenue" | "pipelineValue" | "wonDealsCount">("wonRevenue");

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === "wonRevenue") return b.wonRevenue - a.wonRevenue || b.wonDealsCount - a.wonDealsCount;
    if (sortBy === "pipelineValue") return b.pipelineValue - a.pipelineValue;
    return b.wonDealsCount - a.wonDealsCount || b.wonRevenue - a.wonRevenue;
  });

  if (loading) {
    return (
      <div className="bg-card border rounded-xl p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 bg-accent rounded w-1/4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-accent/40 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <span className="text-xl" title="1st Place">??</span>;
      case 1:
        return <span className="text-xl" title="2nd Place">??</span>;
      case 2:
        return <span className="text-xl" title="3rd Place">??</span>;
      default:
        return (
          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
      {/* Header & KPI Summary */}
      <div className="p-6 border-b border-border bg-gradient-to-r from-accent/30 via-transparent to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Sales Rep Performance Leaderboard
              </h2>
              <p className="text-xs text-muted-foreground">
                Live rankings across closed revenue, deal flow, and customer responsiveness
              </p>
            </div>
          </div>

          {/* Quick Sort Options */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => setSortBy("wonRevenue")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                sortBy === "wonRevenue"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Won Revenue
            </button>
            <button
              onClick={() => setSortBy("pipelineValue")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                sortBy === "pipelineValue"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active Pipeline
            </button>
            <button
              onClick={() => setSortBy("wonDealsCount")}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                sortBy === "wonDealsCount"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Won Deals
            </button>
          </div>
        </div>

        {/* Company Quick Glance KPIs */}
        {companyKPIs && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-border/60">
            <div className="p-3 bg-background/60 border rounded-lg">
              <div className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-500" /> Total Won Revenue
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${companyKPIs.totalWonRevenue.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {companyKPIs.totalWonDeals} deals closed
              </div>
            </div>

            <div className="p-3 bg-background/60 border rounded-lg">
              <div className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-500" /> Active Pipeline
              </div>
              <div className="text-lg font-bold text-foreground mt-0.5">
                ${companyKPIs.totalPipelineValue.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {companyKPIs.totalOpenDeals} in-flight deals
              </div>
            </div>

            <div className="p-3 bg-background/60 border rounded-lg">
              <div className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                <Target className="w-3 h-3 text-purple-500" /> Team Win Rate
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {companyKPIs.companyWinRate}%
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                of closed opportunities
              </div>
            </div>

            <div className="p-3 bg-background/60 border rounded-lg">
              <div className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-amber-500" /> Action Required
              </div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {companyKPIs.overdueTasksCount} Overdue
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {companyKPIs.unassignedChatsCount} unassigned chats
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
            <tr>
              <th className="py-3 px-4 w-12 text-center">Rank</th>
              <th className="py-3 px-4">Sales Rep</th>
              <th className="py-3 px-4 text-right">Won Revenue</th>
              <th className="py-3 px-4 text-right">Active Pipeline</th>
              <th className="py-3 px-4 text-center">Win Rate</th>
              <th className="py-3 px-4 text-center">Tasks Done</th>
              <th className="py-3 px-4 text-center">Active Chats</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedLeaderboard.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground italic">
                  No active team members found.
                </td>
              </tr>
            ) : (
              sortedLeaderboard.map((rep, idx) => (
                <tr key={rep.userId} className="hover:bg-accent/20 transition-colors">
                  <td className="py-3.5 px-4 text-center font-bold">
                    {getRankBadge(idx)}
                  </td>
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
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
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
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {rep.completedTasksCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <MessageSquare className="w-3 h-3" />
                      {rep.activeChatsCount}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate("/deals")}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      View Deals <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
