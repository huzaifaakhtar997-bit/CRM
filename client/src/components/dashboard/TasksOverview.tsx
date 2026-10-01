import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Task } from "../../types/api.types";
import { ArrowRight, AlertCircle, CheckSquare, Clock } from "lucide-react";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";

interface TasksOverviewProps {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const TasksOverview: React.FC<TasksOverviewProps> = ({
  tasks,
  loading,
  error,
  onRetry,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border/80 rounded-lg shadow-2xs flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/70">
        <div>
          <h3 className="font-semibold text-sm text-foreground tracking-tight">Pending Tasks</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Upcoming team follow-ups</p>
        </div>
        <Link
          to="/tasks"
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
                <div className="h-4 w-4 bg-muted rounded shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3.5 bg-muted rounded w-2/5" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <AlertCircle className="w-7 h-7 text-rose-500/60 mb-2" />
            <p className="text-sm font-medium text-foreground">Unable to load pending tasks</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-3">{error}</p>
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-foreground hover:underline"
            >
              Try again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="All tasks completed!"
            description="You have no outstanding to-dos right now."
            actionLabel="New Task"
            onAction={() => navigate("/tasks")}
            className="border-0 shadow-none py-8"
          />
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b border-border/70">
              <tr>
                <th className="px-4 py-2 font-medium">Task</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Priority</th>
                <th className="px-4 py-2 font-medium text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {tasks.map((task) => {
                const isOverdue = task.dueDate
                  ? new Date(task.dueDate) < new Date() && !task.completed
                  : false;

                const priorityVariant =
                  task.priority === "HIGH"
                    ? "destructive"
                    : task.priority === "MEDIUM"
                    ? "warning"
                    : "neutral";

                return (
                  <tr
                    key={task.id}
                    onClick={() => navigate("/tasks")}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-xs text-foreground truncate group-hover:text-foreground transition-colors max-w-[180px]" title={task.title}>
                        {task.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground capitalize mt-0.5">
                        {task.taskType?.toLowerCase()}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <Badge variant={priorityVariant}>
                        {task.priority || "NORMAL"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 text-[11px] font-mono tabular-nums">
                        <Clock className={`w-3 h-3 ${isOverdue ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`} />
                        <span className={isOverdue ? "text-rose-600 dark:text-rose-400 font-medium" : "text-muted-foreground"}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "No date"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
