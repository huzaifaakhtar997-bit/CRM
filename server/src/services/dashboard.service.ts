import { prisma } from "../config/database";
import { UserRole } from "@prisma/client";

export interface RepLeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  wonRevenue: number;
  wonDealsCount: number;
  pipelineValue: number;
  openDealsCount: number;
  winRate: number; // percentage 0-100
  completedTasksCount: number;
  activeChatsCount: number;
}

export interface CompanyKPISummary {
  totalWonRevenue: number;
  totalWonDeals: number;
  totalPipelineValue: number;
  totalOpenDeals: number;
  companyWinRate: number;
  overdueTasksCount: number;
  unassignedDealsCount: number;
  unassignedChatsCount: number;
}

export interface PersonalPerformance {
  wonRevenue: number;
  wonDealsCount: number;
  pipelineValue: number;
  openDealsCount: number;
  winRate: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
}

export interface DailyFocusTask {
  id: string;
  title: string;
  priority: string;
  taskType: string;
  dueDate: Date | null;
  isOverdue: boolean;
  contactName?: string | null;
  dealTitle?: string | null;
}

export interface DailyFocusConversation {
  id: string;
  subject: string;
  senderAddress: string | null;
  status: string;
  lastMessageAt: Date;
  contactName?: string | null;
}

export interface DashboardPerformanceData {
  isAdminOrManager: boolean;
  leaderboard?: RepLeaderboardEntry[];
  companyKPIs?: CompanyKPISummary;
  personal?: PersonalPerformance;
  focusTasks?: DailyFocusTask[];
  focusConversations?: DailyFocusConversation[];
}

export class DashboardService {
  async getPerformanceData(currentUser: { userId: string; role: string }): Promise<DashboardPerformanceData> {
    const isAdminOrManager = ["ADMIN", "MANAGER"].includes(currentUser.role);

    const now = new Date();

    if (isAdminOrManager) {
      // 1. Fetch all active users who can handle sales (SALES_REP, MANAGER, ADMIN)
      const users = await prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        orderBy: { name: "asc" },
      });

      // Fetch all deals with stages and contacts
      const allDeals = await prisma.deal.findMany({
        include: {
          stage: { select: { isWon: true, isLost: true } },
          contact: {
            select: {
              assignedUserId: true,
              conversations: { select: { assignedUserId: true } },
            },
          },
        },
      });

      // Fetch completed tasks grouped by user
      const completedTasks = await prisma.task.groupBy({
        by: ["assignedUserId"],
        where: { completed: true, assignedUserId: { not: null } },
        _count: { id: true },
      });
      const completedTaskMap = new Map<string, number>();
      completedTasks.forEach((t) => {
        if (t.assignedUserId) completedTaskMap.set(t.assignedUserId, t._count.id);
      });

      // Fetch active conversations grouped by user
      const activeChats = await prisma.conversation.groupBy({
        by: ["assignedUserId"],
        where: { status: { in: ["OPEN", "PENDING"] }, assignedUserId: { not: null } },
        _count: { id: true },
      });
      const activeChatMap = new Map<string, number>();
      activeChats.forEach((c) => {
        if (c.assignedUserId) activeChatMap.set(c.assignedUserId, c._count.id);
      });

      // Build rep entries
      const leaderboard: RepLeaderboardEntry[] = users.map((u) => {
        // Scoped deals for this user
        const repDeals = allDeals.filter(
          (d) =>
            d.assignedUserId === u.id ||
            d.contact?.assignedUserId === u.id ||
            d.contact?.conversations?.some((c) => c.assignedUserId === u.id)
        );

        let wonRevenue = 0;
        let wonDealsCount = 0;
        let pipelineValue = 0;
        let openDealsCount = 0;
        let lostDealsCount = 0;

        for (const deal of repDeals) {
          if (deal.stage?.isWon) {
            wonRevenue += deal.value || 0;
            wonDealsCount++;
          } else if (deal.stage?.isLost) {
            lostDealsCount++;
          } else {
            pipelineValue += deal.value || 0;
            openDealsCount++;
          }
        }

        const totalClosed = wonDealsCount + lostDealsCount;
        const winRate = totalClosed > 0 ? Math.round((wonDealsCount / totalClosed) * 100) : 0;

        return {
          userId: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl,
          wonRevenue,
          wonDealsCount,
          pipelineValue,
          openDealsCount,
          winRate,
          completedTasksCount: completedTaskMap.get(u.id) || 0,
          activeChatsCount: activeChatMap.get(u.id) || 0,
        };
      });

      // Sort leaderboard: primary by wonRevenue descending, secondary by wonDealsCount descending
      leaderboard.sort((a, b) => b.wonRevenue - a.wonRevenue || b.wonDealsCount - a.wonDealsCount);

      // Company-wide KPIs
      let totalWonRevenue = 0;
      let totalWonDeals = 0;
      let totalPipelineValue = 0;
      let totalOpenDeals = 0;
      let totalLostDeals = 0;
      let unassignedDealsCount = 0;

      for (const deal of allDeals) {
        if (deal.stage?.isWon) {
          totalWonRevenue += deal.value || 0;
          totalWonDeals++;
        } else if (deal.stage?.isLost) {
          totalLostDeals++;
        } else {
          totalPipelineValue += deal.value || 0;
          totalOpenDeals++;
        }
        if (!deal.assignedUserId && !deal.contact?.assignedUserId) {
          unassignedDealsCount++;
        }
      }

      const totalClosedCompany = totalWonDeals + totalLostDeals;
      const companyWinRate =
        totalClosedCompany > 0 ? Math.round((totalWonDeals / totalClosedCompany) * 100) : 0;

      const overdueTasksCount = await prisma.task.count({
        where: { completed: false, dueDate: { lt: now } },
      });

      const unassignedChatsCount = await prisma.conversation.count({
        where: { assignedUserId: null, status: { in: ["OPEN", "PENDING"] } },
      });

      const companyKPIs: CompanyKPISummary = {
        totalWonRevenue,
        totalWonDeals,
        totalPipelineValue,
        totalOpenDeals,
        companyWinRate,
        overdueTasksCount,
        unassignedDealsCount,
        unassignedChatsCount,
      };

      return {
        isAdminOrManager: true,
        leaderboard,
        companyKPIs,
      };
    } else {
      // SALES_REP personal focus view
      const userId = currentUser.userId;

      // 1. Fetch user's deals
      const userDeals = await prisma.deal.findMany({
        where: {
          OR: [
            { assignedUserId: userId },
            { contact: { assignedUserId: userId } },
            { contact: { conversations: { some: { assignedUserId: userId } } } },
          ],
        },
        include: {
          stage: { select: { isWon: true, isLost: true } },
        },
      });

      let wonRevenue = 0;
      let wonDealsCount = 0;
      let pipelineValue = 0;
      let openDealsCount = 0;
      let lostDealsCount = 0;

      for (const deal of userDeals) {
        if (deal.stage?.isWon) {
          wonRevenue += deal.value || 0;
          wonDealsCount++;
        } else if (deal.stage?.isLost) {
          lostDealsCount++;
        } else {
          pipelineValue += deal.value || 0;
          openDealsCount++;
        }
      }

      const totalClosed = wonDealsCount + lostDealsCount;
      const winRate = totalClosed > 0 ? Math.round((wonDealsCount / totalClosed) * 100) : 0;

      // 2. Tasks metrics & Actionable Focus Tasks
      const completedTasksCount = await prisma.task.count({
        where: { assignedUserId: userId, completed: true },
      });

      const pendingTasksCount = await prisma.task.count({
        where: {
          OR: [{ assignedUserId: userId }, { isAnnouncement: true }],
          completed: false,
        },
      });

      const overdueTasksCount = await prisma.task.count({
        where: {
          OR: [{ assignedUserId: userId }, { isAnnouncement: true }],
          completed: false,
          dueDate: { lt: now },
        },
      });

      // Top 5 urgent / overdue / due today tasks for this rep
      const focusTasksRaw = await prisma.task.findMany({
        where: {
          OR: [{ assignedUserId: userId }, { isAnnouncement: true }],
          completed: false,
        },
        include: {
          contact: { select: { firstName: true, lastName: true } },
          deal: { select: { title: true } },
        },
        orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
        take: 5,
      });

      const focusTasks: DailyFocusTask[] = focusTasksRaw.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        taskType: t.taskType,
        dueDate: t.dueDate,
        isOverdue: t.dueDate ? new Date(t.dueDate) < now : false,
        contactName: t.contact ? `${t.contact.firstName} ${t.contact.lastName}`.trim() : null,
        dealTitle: t.deal?.title || null,
      }));

      // Top 5 open/pending conversations assigned to this rep awaiting reply
      const focusConversationsRaw = await prisma.conversation.findMany({
        where: {
          assignedUserId: userId,
          status: { in: ["OPEN", "PENDING"] },
        },
        include: {
          contact: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { lastMessageAt: "desc" },
        take: 5,
      });

      const focusConversations: DailyFocusConversation[] = focusConversationsRaw.map((c) => ({
        id: c.id,
        subject: c.subject || "No Subject",
        senderAddress: c.contact?.email || null,
        status: c.status,
        lastMessageAt: c.lastMessageAt,
        contactName: c.contact ? `${c.contact.firstName} ${c.contact.lastName}`.trim() : null,
      }));

      const personal: PersonalPerformance = {
        wonRevenue,
        wonDealsCount,
        pipelineValue,
        openDealsCount,
        winRate,
        completedTasksCount,
        pendingTasksCount,
        overdueTasksCount,
      };

      return {
        isAdminOrManager: false,
        personal,
        focusTasks,
        focusConversations,
      };
    }
  }
}

export const dashboardService = new DashboardService();
