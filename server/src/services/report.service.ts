import { prisma } from "../config/database";

export interface RevenueTrendItem {
  period: string; // e.g. "Week 1", "Sep 2026"
  wonRevenue: number;
  dealsCount: number;
}

export interface StageBreakdownItem {
  stageId: string;
  stageName: string;
  color: string | null;
  isWon: boolean;
  isLost: boolean;
  order: number;
  count: number;
  totalValue: number;
  percentageOfTotal: number;
}

export interface LifecycleFunnelStep {
  stage: string;
  label: string;
  count: number;
  conversionRate: number; // Conversion rate to this stage
  dropOffRate: number;
}

export interface SourceBreakdownItem {
  source: string;
  label: string;
  count: number;
  percentage: number;
}

export interface RepReportItem {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  wonRevenue: number;
  wonDealsCount: number;
  pipelineValue: number;
  openDealsCount: number;
  winRate: number;
  totalContacts: number;
}

export interface ReportAnalyticsData {
  timeRange: string;
  isScopedToUser: boolean;
  scopedUserName?: string;
  
  // Revenue & Pipeline Metrics
  totalWonRevenue: number;
  wonDealsCount: number;
  totalPipelineValue: number;
  openDealsCount: number;
  averageDealValue: number;
  winRate: number;
  revenueTrend: RevenueTrendItem[];
  dealsByStage: StageBreakdownItem[];

  // Lead & Conversion Funnel
  totalContacts: number;
  lifecycleFunnel: LifecycleFunnelStep[];
  leadsBySource: SourceBreakdownItem[];

  // Rep Comparisons (Only for Admins/Managers viewing all reps)
  repPerformance?: RepReportItem[];
}

export class ReportService {
  async getReportAnalytics(
    currentUser: { userId: string; role: string },
    query: { timeRange?: string; repId?: string }
  ): Promise<ReportAnalyticsData> {
    const isAdminOrManager = ["ADMIN", "MANAGER"].includes(currentUser.role);
    const timeRange = query.timeRange || "30d";

    // 1. Determine Scoping
    let effectiveRepId: string | undefined = undefined;
    let scopedUserName: string | undefined = undefined;

    if (!isAdminOrManager) {
      effectiveRepId = currentUser.userId;
    } else if (query.repId && query.repId !== "all") {
      effectiveRepId = query.repId;
      const targetUser = await prisma.user.findUnique({
        where: { id: effectiveRepId },
        select: { name: true },
      });
      scopedUserName = targetUser?.name || undefined;
    }

    // 2. Determine Date Boundary
    const now = new Date();
    let startDate: Date | null = null;
    if (timeRange === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "90d") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timeRange === "12m") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } // "all" leaves startDate as null

    // 3. Fetch Pipeline Stages
    const stages = await prisma.pipelineStage.findMany({
      orderBy: { order: "asc" },
    });

    // 4. Build Deals Where Clause
    const dealWhere: any = {};
    if (effectiveRepId) {
      dealWhere.OR = [
        { assignedUserId: effectiveRepId },
        { contact: { assignedUserId: effectiveRepId } },
        { contact: { conversations: { some: { assignedUserId: effectiveRepId } } } },
      ];
    }
    if (startDate) {
      dealWhere.createdAt = { gte: startDate };
    }

    const deals = await prisma.deal.findMany({
      where: dealWhere,
      include: {
        stage: true,
        contact: {
          select: {
            assignedUserId: true,
            conversations: { select: { assignedUserId: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 5. Aggregate Deal Metrics
    let totalWonRevenue = 0;
    let wonDealsCount = 0;
    let totalPipelineValue = 0;
    let openDealsCount = 0;
    let lostDealsCount = 0;

    const stageCountMap = new Map<string, { count: number; totalValue: number }>();
    stages.forEach((s) => stageCountMap.set(s.id, { count: 0, totalValue: 0 }));

    // Trend grouping: map period keys to { wonRevenue, dealsCount }
    const trendMap = new Map<string, { wonRevenue: number; dealsCount: number }>();

    for (const deal of deals) {
      const isWon = deal.stage?.isWon ?? false;
      const isLost = deal.stage?.isLost ?? false;
      const val = deal.value || 0;

      if (isWon) {
        totalWonRevenue += val;
        wonDealsCount++;

        // Add to trend by date
        const d = new Date(deal.closedAt || deal.createdAt);
        const periodKey =
          timeRange === "7d" || timeRange === "30d"
            ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

        const existingTrend = trendMap.get(periodKey) || { wonRevenue: 0, dealsCount: 0 };
        existingTrend.wonRevenue += val;
        existingTrend.dealsCount += 1;
        trendMap.set(periodKey, existingTrend);
      } else if (isLost) {
        lostDealsCount++;
      } else {
        totalPipelineValue += val;
        openDealsCount++;
      }

      if (deal.stageId && stageCountMap.has(deal.stageId)) {
        const stageStat = stageCountMap.get(deal.stageId)!;
        stageStat.count += 1;
        stageStat.totalValue += val;
      }
    }

    const totalClosed = wonDealsCount + lostDealsCount;
    const winRate = totalClosed > 0 ? Math.round((wonDealsCount / totalClosed) * 100) : 0;
    const averageDealValue = wonDealsCount > 0 ? Math.round(totalWonRevenue / wonDealsCount) : 0;

    const totalDealsCount = deals.length;
    const dealsByStage: StageBreakdownItem[] = stages.map((s) => {
      const stat = stageCountMap.get(s.id) || { count: 0, totalValue: 0 };
      return {
        stageId: s.id,
        stageName: s.name,
        color: s.color,
        isWon: s.isWon,
        isLost: s.isLost,
        order: s.order,
        count: stat.count,
        totalValue: stat.totalValue,
        percentageOfTotal: totalDealsCount > 0 ? Math.round((stat.count / totalDealsCount) * 100) : 0,
      };
    });

    const revenueTrend: RevenueTrendItem[] = Array.from(trendMap.entries()).map(([period, data]) => ({
      period,
      wonRevenue: data.wonRevenue,
      dealsCount: data.dealsCount,
    }));

    // 6. Build Contacts Where Clause & Funnel
    const contactWhere: any = {};
    if (effectiveRepId) {
      contactWhere.OR = [
        { assignedUserId: effectiveRepId },
        { conversations: { some: { assignedUserId: effectiveRepId } } },
      ];
    }
    if (startDate) {
      contactWhere.createdAt = { gte: startDate };
    }

    const contacts = await prisma.contact.findMany({
      where: contactWhere,
      select: {
        id: true,
        lifecycleStage: true,
        leadSource: true,
        createdAt: true,
      },
    });

    const totalContacts = contacts.length;

    // Funnel stages definition
    const funnelKeys = ["LEAD", "MQL", "SQL", "OPPORTUNITY", "CUSTOMER"] as const;
    const funnelLabels: Record<string, string> = {
      LEAD: "Lead",
      MQL: "Marketing Qualified (MQL)",
      SQL: "Sales Qualified (SQL)",
      OPPORTUNITY: "Opportunity",
      CUSTOMER: "Customer",
      CHURNED: "Churned",
    };

    const stageCounts: Record<string, number> = {
      LEAD: 0,
      MQL: 0,
      SQL: 0,
      OPPORTUNITY: 0,
      CUSTOMER: 0,
      CHURNED: 0,
    };

    const sourceCounts: Record<string, number> = {};

    for (const c of contacts) {
      if (c.lifecycleStage && stageCounts[c.lifecycleStage] !== undefined) {
        stageCounts[c.lifecycleStage]++;
      }
      const src = c.leadSource || "DIRECT";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    }

    // Build cumulative / progressive conversion funnel
    // In CRM sales funnel: A Customer also passed through Lead, MQL, SQL, Opportunity
    const cumulativeFunnel: LifecycleFunnelStep[] = [];
    let previousCount = totalContacts;

    for (let i = 0; i < funnelKeys.length; i++) {
      const key = funnelKeys[i];
      // Count who reached this stage or beyond
      let stageCount = 0;
      for (let j = i; j < funnelKeys.length; j++) {
        stageCount += stageCounts[funnelKeys[j]] || 0;
      }

      const conversionRate = previousCount > 0 ? Math.round((stageCount / previousCount) * 100) : 0;
      const dropOffRate = 100 - conversionRate;

      cumulativeFunnel.push({
        stage: key,
        label: funnelLabels[key] || key,
        count: stageCount,
        conversionRate,
        dropOffRate: dropOffRate > 0 ? dropOffRate : 0,
      });

      previousCount = stageCount;
    }

    // Lead Sources breakdown
    const sourceLabels: Record<string, string> = {
      ORGANIC_SEARCH: "Organic Search",
      PAID_SEARCH: "Paid Search",
      SOCIAL_MEDIA: "Social Media",
      REFERRAL: "Referral",
      DIRECT: "Direct Traffic",
      OFFLINE: "Offline / Events",
      OTHER: "Other",
    };

    const leadsBySource: SourceBreakdownItem[] = Object.entries(sourceCounts).map(([src, count]) => ({
      source: src,
      label: sourceLabels[src] || src,
      count,
      percentage: totalContacts > 0 ? Math.round((count / totalContacts) * 100) : 0,
    }));
    leadsBySource.sort((a, b) => b.count - a.count);

    // 7. Rep Performance Matrix (For Admins/Managers viewing all reps)
    let repPerformance: RepReportItem[] | undefined = undefined;

    if (isAdminOrManager && !effectiveRepId) {
      const activeUsers = await prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        orderBy: { name: "asc" },
      });

      // Group all deals and contacts by rep
      repPerformance = activeUsers.map((u) => {
        const uDeals = deals.filter(
          (d) =>
            d.assignedUserId === u.id ||
            d.contact?.assignedUserId === u.id ||
            d.contact?.conversations?.some((c) => c.assignedUserId === u.id)
        );

        let wonRev = 0;
        let wonCount = 0;
        let openPipe = 0;
        let openCount = 0;
        let lostCount = 0;

        for (const d of uDeals) {
          if (d.stage?.isWon) {
            wonRev += d.value || 0;
            wonCount++;
          } else if (d.stage?.isLost) {
            lostCount++;
          } else {
            openPipe += d.value || 0;
            openCount++;
          }
        }

        const closed = wonCount + lostCount;
        const repWinRate = closed > 0 ? Math.round((wonCount / closed) * 100) : 0;

        const uContacts = contacts.filter((c: any) => c.assignedUserId === u.id);

        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl,
          wonRevenue: wonRev,
          wonDealsCount: wonCount,
          pipelineValue: openPipe,
          openDealsCount: openCount,
          winRate: repWinRate,
          totalContacts: uContacts.length,
        };
      });

      repPerformance.sort((a, b) => b.wonRevenue - a.wonRevenue || b.pipelineValue - a.pipelineValue);
    }

    return {
      timeRange,
      isScopedToUser: Boolean(effectiveRepId),
      scopedUserName,
      totalWonRevenue,
      wonDealsCount,
      totalPipelineValue,
      openDealsCount,
      averageDealValue,
      winRate,
      revenueTrend,
      dealsByStage,
      totalContacts,
      lifecycleFunnel: cumulativeFunnel,
      leadsBySource,
      repPerformance,
    };
  }
}

export const reportService = new ReportService();
