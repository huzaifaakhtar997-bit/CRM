import React from "react";
import { PersonalPerformance, DailyFocusTask, DailyFocusConversation } from "../../types/api.types";
import { DollarSign, TrendingUp, Target, AlertTriangle, Calendar, MessageSquare, CheckCircle2, ArrowRight, Clock, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { tasksApi } from "../../api/tasks.api";

interface RepDailyFocusProps {
  personal?: PersonalPerformance;
  focusTasks?: DailyFocusTask[];
  focusConversations?: DailyFocusConversation[];
  loading: boolean;
  onRefresh?: () => void;
}

export const RepDailyFocus: React.FC<RepDailyFocusProps> = ({
  personal,
  focusTasks = [],
  focusConversations = [],
  loading,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [completingTaskId, setCompletingTaskId] = React.useState<string | null>(null);

  const handleQuickCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletingTaskId(taskId);
    try {
      await tasksApi.updateTask(taskId, { completed: true });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to mark task complete", err);
    } finally {
      setCompletingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border rounded-xl p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 bg-accent rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-accent/40 rounded-lg"></div>
          <div className="h-48 bg-accent/40 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Personal Performance Bar */}
      {personal && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-card border rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Won Revenue
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ${personal.wonRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {personal.wonDealsCount} {personal.wonDealsCount === 1 ? "deal" : "deals"} won
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-card border rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> My Active Pipeline
              </div>
              <div className="text-xl font-bold text-foreground mt-1">
                ${personal.pipelineValue.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {personal.openDealsCount} open {personal.openDealsCount === 1 ? "deal" : "deals"}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-card border rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-purple-500" /> My Win Rate
              </div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {personal.winRate}%
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                closing efficiency
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
              <Target className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-card border rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Overdue Tasks
              </div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {personal.overdueTasksCount}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {personal.pendingTasksCount} total to-dos
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Two Column Action Hub: Urgent Tasks & Awaiting Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Priority & Overdue Follow-ups */}
        <div className="bg-card border rounded-xl shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Priority Follow-up Tasks</h3>
              </div>
              <button
                onClick={() => navigate("/tasks")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-border/60 mt-2">
              {focusTasks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs italic">
                  ?? You are all caught up! No overdue tasks pending.
                </div>
              ) : (
                focusTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate("/tasks")}
                    className="py-3 flex items-start justify-between gap-3 hover:bg-accent/20 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={(e) => handleQuickCompleteTask(task.id, e)}
                        disabled={completingTaskId === task.id}
                        className="mt-0.5 text-muted-foreground hover:text-green-500 transition-colors shrink-0"
                        title="Mark complete"
                      >
                        <CheckCircle2 className={`w-4 h-4 ${completingTaskId === task.id ? "animate-spin" : ""}`} />
                      </button>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                          {task.contactName && (
                            <span className="font-medium text-foreground/80 truncate max-w-[120px]">
                              ?? {task.contactName}
                            </span>
                          )}
                          {task.dealTitle && (
                            <span className="truncate max-w-[120px]">
                              ?? {task.dealTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-[11px] font-semibold ${
                          task.isOverdue
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {task.isOverdue ? "Overdue" : task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
                      </div>
                      <span
                        className={`inline-block mt-0.5 text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                          task.priority === "URGENT"
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : task.priority === "HIGH"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-border/60">
            <button
              onClick={() => navigate("/deals")}
              className="w-full py-2 bg-muted/60 hover:bg-muted text-xs font-medium rounded-lg text-foreground flex items-center justify-center gap-1.5 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-primary" /> Open My Deals Pipeline
            </button>
          </div>
        </div>

        {/* 2. Customer Conversations Awaiting Reply */}
        <div className="bg-card border rounded-xl shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Conversations Requiring Response</h3>
              </div>
              <button
                onClick={() => navigate("/inbox")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Open Inbox <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-border/60 mt-2">
              {focusConversations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs italic">
                  ? No active customer chats waiting on your reply!
                </div>
              ) : (
                focusConversations.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => navigate("/inbox")}
                    className="py-3 flex items-start justify-between gap-3 hover:bg-accent/20 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {chat.subject || "Customer Inquiry"}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                        {chat.contactName && (
                          <span className="font-medium text-foreground/90">
                            {chat.contactName}
                          </span>
                        )}
                        {chat.senderAddress && (
                          <span className="truncate max-w-[140px] text-muted-foreground/70">
                            ({chat.senderAddress})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {new Date(chat.lastMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {chat.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-border/60">
            <button
              onClick={() => navigate("/inbox")}
              className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-xs font-semibold rounded-lg text-primary flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Launch Unified Inbox
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
