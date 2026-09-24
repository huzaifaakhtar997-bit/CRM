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
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border rounded-2xl p-6 shadow-xs">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {isScopedToUser && !scopedUserName ? "My Sales & Pipeline Intelligence" : "Reports & Pipeline Intelligence"}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isScopedToUser
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
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
            <p className="text-xs text-muted-foreground mt-1">
              Live database analytics on revenue velocity, conversion funnels, and pipeline progression.
            </p>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <RefreshButton onRefresh={onRefresh} />

        {/* Time Range Selector */}
        <div className="relative">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="h-9 pl-8 pr-7 text-xs font-medium rounded-lg border border-input bg-background cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="12m">Past 12 Months</option>
            <option value="all">All Time</option>
          </select>
          <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Rep Filter (Only for Admins / Managers) */}
        {isAdminOrManager && (
          <div className="relative">
            <select
              value={repId}
              onChange={(e) => onRepIdChange(e.target.value)}
              className="h-9 pl-8 pr-7 text-xs font-medium rounded-lg border border-input bg-background cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            >
              <option value="all">All Sales Reps</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            <User className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* CSV Export Button */}
        <button
          onClick={onExportCSV}
          className="h-9 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>
    </div>
  );
};
