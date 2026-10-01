import React from "react";
import { CRMUser } from "../../api/users.api";
import { BarChart3, Download, Calendar, User, ShieldCheck } from "lucide-react";
import { RefreshButton } from "../ui/RefreshButton";

interface ReportHeaderProps {
  timeRange: string;
  onTimeRangeChange: (val: string) => void;
  repId: string;
  onRepIdChange: (val: string) => void;
  users: CRMUser[];
  isAdminOrManager: boolean;
  isScopedToUser: boolean;
  scopedUserName?: string;
  onRefresh: () => void;
  onExportCSV: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  timeRange,
  onTimeRangeChange,
  repId,
  onRepIdChange,
  users,
  isAdminOrManager,
  isScopedToUser,
  scopedUserName,
  onRefresh,
  onExportCSV,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card border border-border/80 rounded-lg p-4 shadow-2xs">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-secondary text-foreground border border-border/80 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {isScopedToUser && !scopedUserName ? "My Sales & Pipeline Intelligence" : "Reports & Pipeline Intelligence"}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border ${
                  isScopedToUser
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                {isScopedToUser
                  ? scopedUserName
                    ? `Filtered: ${scopedUserName}`
                    : "Personal Portfolio View"
                  : "Company-Wide Overview"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live database analytics on revenue velocity, conversion funnels, and pipeline progression.
            </p>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <RefreshButton onRefresh={onRefresh} />

        {/* Time Range Selector */}
        <div className="relative">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="h-8 pl-7 pr-6 text-xs font-medium rounded-md border border-input bg-background cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-ring text-foreground shadow-2xs"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="12m">Past 12 Months</option>
            <option value="all">All Time</option>
          </select>
          <Calendar className="w-3 h-3 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Rep Filter (Only for Admins / Managers) */}
        {isAdminOrManager && (
          <div className="relative">
            <select
              value={repId}
              onChange={(e) => onRepIdChange(e.target.value)}
              className="h-8 pl-7 pr-6 text-xs font-medium rounded-md border border-input bg-background cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-ring text-foreground shadow-2xs"
            >
              <option value="all">All Sales Reps</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace("_", " ")})
                </option>
              ))}
            </select>
            <User className="w-3 h-3 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* CSV Export Button */}
        <button
          onClick={onExportCSV}
          className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
    </div>
  );
};
