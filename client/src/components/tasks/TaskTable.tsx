import React from "react";
import { Task } from "../../types/api.types";
import { Edit, Trash2, Eye, Calendar, CheckSquare, Check, Clock, Phone, Mail, Users, Megaphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Badge, BadgeVariant } from "../ui/Badge";
import { TableSkeleton } from "../ui/TableSkeleton";
import { EmptyState } from "../ui/EmptyState";

interface TaskTableProps {
  tasks: Task[];
  loading: boolean;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  loading,
  onView,
  onEdit,
  onDelete,
  onToggleComplete,
}) => {
  const { user } = useAuth();
  const canEdit = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");

  const getPriorityVariant = (priority: string): BadgeVariant => {
    switch (priority) {
      case "URGENT": return "destructive";
      case "HIGH": return "warning";
      case "MEDIUM": return "info";
      case "LOW": return "neutral";
      default: return "neutral";
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "CALL": return <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "EMAIL": return <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "MEETING": return <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default: return <CheckSquare className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const isOverdue = (date: string | null, time: string | null) => {
    if (!date) return false;
    const taskDate = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':');
      taskDate.setHours(parseInt(hours), parseInt(minutes));
    }
    return taskDate < new Date();
  };

  return (
    <div className="w-full bg-card border border-border/80 rounded-lg overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 border-b border-border/80">
            <tr>
              <th className="px-4 py-2.5 font-semibold w-10">Status</th>
              <th className="px-4 py-2.5 font-semibold">Task</th>
              <th className="px-4 py-2.5 font-semibold hidden md:table-cell">Related To</th>
              <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Due Date</th>
              <th className="px-4 py-2.5 font-semibold hidden xl:table-cell">Assignee</th>
              <th className="px-4 py-2.5 font-semibold hidden lg:table-cell">Priority</th>
              <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <TableSkeleton columns={7} rows={5} />
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState
                    icon={CheckSquare}
                    title="No tasks found"
                    description="You don't have any tasks matching the current filters. Create a new task to get started."
                  />
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const overdue = !task.completed && isOverdue(task.dueDate, task.dueTime);
                return (
                  <tr 
                    key={task.id} 
                    onClick={() => onView(task)}
                    className={`hover:bg-muted/40 transition-colors cursor-pointer group ${task.completed ? 'opacity-60 bg-muted/15' : ''}`}
                  >
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => canEdit && onToggleComplete(task)}
                      disabled={!canEdit}
                      className={`flex items-center justify-center w-4 h-4 rounded border transition-colors ${
                        task.completed 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-input hover:border-primary text-transparent'
                      } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </button>
                  </td>
                  
                  <td className="px-4 py-2.5">
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5">
                        {getTaskIcon(task.taskType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold text-foreground ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </span>
                          {task.isAnnouncement && (
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Megaphone className="w-2.5 h-2.5" /> Announcement
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 max-w-md">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <div className="space-y-0.5">
                      {task.contact && (
                        <div className="text-xs text-foreground font-medium">
                          {task.contact.firstName} {task.contact.lastName}
                        </div>
                      )}
                      {(task.deal || task.companyName) && (
                        <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                          {task.deal ? task.deal.title : task.companyName}
                        </div>
                      )}
                      {!task.contact && !task.deal && !task.companyName && (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    <div className={`flex items-center font-mono tabular-nums text-xs ${overdue ? 'text-destructive font-medium' : 'text-foreground'}`}>
                      <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                    </div>
                    {task.dueTime && (
                      <div className="flex items-center font-mono tabular-nums text-[11px] text-muted-foreground mt-0.5">
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        {task.dueTime}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-2.5 hidden xl:table-cell">
                    {task.isAnnouncement ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                        <Megaphone className="w-3 h-3 text-amber-600" />
                        All Team
                      </span>
                    ) : task.assignedUser ? (
                      <div className="flex items-center space-x-1.5">
                        <div className="h-5 w-5 rounded-full bg-secondary text-foreground border border-border/80 flex items-center justify-center text-[10px] font-semibold shrink-0">
                          {task.assignedUser.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="text-foreground text-xs font-medium truncate max-w-[110px]" title={task.assignedUser.name}>
                          {task.assignedUser.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-xs italic">Unassigned</span>
                    )}
                  </td>
                  
                  <td className="px-4 py-2.5 hidden lg:table-cell">
                    <Badge variant={getPriorityVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                  </td>
                  
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(task)}
                        title="View Details"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(task)}
                            title="Edit"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(task)}
                            title="Delete"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
