import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { reportsApi } from "../api/reports.api";
import { usersApi, CRMUser } from "../api/users.api";
import { ReportAnalyticsData } from "../types/api.types";
import { ReportHeader } from "../components/reports/ReportHeader";
import { RevenueAnalytics } from "../components/reports/RevenueAnalytics";
import { LeadFunnelAnalytics } from "../components/reports/LeadFunnelAnalytics";
import { RepPerformanceMatrix } from "../components/reports/RepPerformanceMatrix";
import { useRefreshListener } from "../hooks/useRefreshListener";
import { AlertCircle } from "lucide-react";

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrManager = ["ADMIN", "MANAGER"].includes(user?.role || "");

  const [timeRange, setTimeRange] = useState<string>("all");
  const [repId, setRepId] = useState<string>("all");
  const [data, setData] = useState<ReportAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<CRMUser[]>([]);

  useEffect(() => {
    if (isAdminOrManager) {
      usersApi.getAllUsers().then(setUsers).catch(console.error);
    }
  }, [isAdminOrManager]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getReports({
        timeRange,
        repId: repId === "all" ? undefined : repId,
      });
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load report analytics.");
    } finally {
      setLoading(false);
    }
  }, [timeRange, repId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useRefreshListener(loadReports);

  // CSV Export Generation
  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `CRM Reports & Pipeline Intelligence Summary\n`;
    csvContent += `Timeframe,${data.timeRange}\n`;
    csvContent += `Scope,${data.isScopedToUser ? data.scopedUserName || "Personal Portfolio" : "Company-Wide"}\n`;
    csvContent += `Generated At,${new Date().toISOString()}\n\n`;

    // 1. Core KPIs
    csvContent += `KEY PERFORMANCE INDICATORS\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Total Won Revenue,$${data.totalWonRevenue}\n`;
    csvContent += `Won Deals Count,${data.wonDealsCount}\n`;
    csvContent += `Active Pipeline Value,$${data.totalPipelineValue}\n`;
    csvContent += `Active Open Deals,${data.openDealsCount}\n`;
    csvContent += `Average Deal Size,$${data.averageDealValue}\n`;
    csvContent += `Win Rate,${data.winRate}%\n`;
    csvContent += `Total Contacts Tracked,${data.totalContacts}\n\n`;

    // 2. Stage Breakdown
    csvContent += `PIPELINE STAGE DISTRIBUTION\n`;
    csvContent += `Stage,Deals Count,Total Value,Percentage\n`;
    data.dealsByStage.forEach((s) => {
      csvContent += `"${s.stageName}",${s.count},$${s.totalValue},${s.percentageOfTotal}%\n`;
    });
    csvContent += `\n`;

    // 3. Conversion Funnel
    csvContent += `LIFECYCLE CONVERSION FUNNEL\n`;
    csvContent += `Stage,Count,Conversion Rate\n`;
    data.lifecycleFunnel.forEach((f) => {
      csvContent += `"${f.label}",${f.count},${f.conversionRate}%\n`;
    });
    csvContent += `\n`;

    // 4. Acquisition Sources
    csvContent += `ACQUISITION SOURCES\n`;
    csvContent += `Channel,Leads Count,Share\n`;
    data.leadsBySource.forEach((src) => {
      csvContent += `"${src.label}",${src.count},${src.percentage}%\n`;
    });
    csvContent += `\n`;

    // 5. Rep Performance (if available)
    if (data.repPerformance && data.repPerformance.length > 0) {
      csvContent += `SALES REP PERFORMANCE\n`;
      csvContent += `Name,Email,Role,Won Revenue,Won Deals,Active Pipeline,Win Rate,Contacts\n`;
      data.repPerformance.forEach((r) => {
        csvContent += `"${r.name}","${r.email}","${r.role}",$${r.wonRevenue},${r.wonDealsCount},$${r.pipelineValue},${r.winRate}%,${r.totalContacts}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crm_report_${data.timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-bottom duration-500 pb-12">
      {/* Header with Filters & CSV Export */}
      <ReportHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        repId={repId}
        onRepIdChange={setRepId}
        users={users}
        isAdminOrManager={isAdminOrManager}
        isScopedToUser={data?.isScopedToUser || false}
        scopedUserName={data?.scopedUserName}
        onRefresh={loadReports}
        onExportCSV={handleExportCSV}
      />

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Revenue & Pipeline Analytics */}
      <RevenueAnalytics
        totalWonRevenue={data?.totalWonRevenue || 0}
        wonDealsCount={data?.wonDealsCount || 0}
        totalPipelineValue={data?.totalPipelineValue || 0}
        openDealsCount={data?.openDealsCount || 0}
        averageDealValue={data?.averageDealValue || 0}
        winRate={data?.winRate || 0}
        revenueTrend={data?.revenueTrend || []}
        dealsByStage={data?.dealsByStage || []}
        loading={loading}
      />

      {/* Lead Conversion Funnel & Acquisition Sources */}
      <LeadFunnelAnalytics
        totalContacts={data?.totalContacts || 0}
        lifecycleFunnel={data?.lifecycleFunnel || []}
        leadsBySource={data?.leadsBySource || []}
        loading={loading}
      />

      {/* Sales Rep Performance Matrix (Admins & Managers viewing all reps) */}
      {isAdminOrManager && data?.repPerformance && repId === "all" && (
        <RepPerformanceMatrix
          repPerformance={data.repPerformance}
          onSelectRep={(id) => setRepId(id)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default Reports;
