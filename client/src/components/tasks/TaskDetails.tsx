import React from "react";
import { Task } from "../../types/api.types";
import { Button } from "../ui/button";
import { X, Calendar, User, FileText, CheckCircle2, Clock, Phone, Mail, Users, Flag, Building2, Briefcase } from "lucide-react";

interface TaskDetailsProps {
  task: Task | null;
  onClose: () => void;
  isOpen: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onToggleComplete?: (task: Task) => void;
  canEdit?: boolean;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({
  task,
  onClose,
  isOpen,
  onEdit,
  onDelete,
  onToggleComplete,
  canEdit = false,
}) => {
  if (!isOpen || !task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "text-red-600 bg-red-100";
      case "HIGH": return "text-orange-600 bg-orange-100";
      case "MEDIUM": return "text-blue-600 bg-blue-100";
      case "LOW": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "CALL": return <Phone className="w-5 h-5 text-emerald-600 mr-2 mt-0.5" />;
      case "EMAIL": return <Mail className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />;
      case "MEETING": return <Users className="w-5 h-5 text-purple-600 mr-2 mt-0.5" />;
      default: return <CheckCircle2 className="w-5 h-5 text-gray-600 mr-2 mt-0.5" />;
    }
  };

  const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && !task.completed : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md h-full border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Task Details</h2>
          <div className="flex items-center space-x-2">
            {canEdit && onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                <Flag className="w-3 h-3 mr-1" />
                {task.priority}
              </span>
              <span className="inline-flex items-center rounded-md bg-accent px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {task.taskType}
              </span>
            </div>
            
            <div className="flex items-start">
              {getTaskIcon(task.taskType)}
              <h3 className={`text-xl font-bold leading-tight ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {task.title}
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground border-b pb-2">
              Status & Timing
            </h4>
            
            <div className="space-y-3">
              {canEdit && onToggleComplete && (
                <div className="flex items-center bg-accent/20 p-3 rounded-lg border mb-4">
                  <Button 
                    variant={task.completed ? "default" : "outline"}
                    className="w-full"
                    onClick={() => onToggleComplete(task)}
                  >
                    {task.completed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Incomplete
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 border-2 border-current rounded-full mr-2" />
                        Mark as Completed
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Due Date</div>
                  <div className="text-sm text-muted-foreground">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                    {isOverdue && (
                      <span className="ml-2 text-destructive font-medium">(Overdue)</span>
                    )}
                  </div>
                </div>
              </div>

              {task.dueTime && (
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Time</div>
                    <div className="text-sm text-muted-foreground">
                      {task.dueTime}
                    </div>
                  </div>
                </div>
              )}

              {task.completed && task.completedAt && (
                <div className="flex items-start text-primary">
                  <CheckCircle2 className="w-5 h-5 mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Completed At</div>
                    <div className="text-sm opacity-80">
                      {new Date(task.completedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground border-b pb-2">
              Associations
            </h4>
            
            <div className="space-y-4">
              {task.contact ? (
                <div className="flex items-start bg-accent/20 p-3 rounded-lg border">
                  <User className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Contact</div>
                    <div className="text-sm text-primary font-medium">{task.contact.firstName} {task.contact.lastName}</div>
                    {task.contact.email && <div className="text-xs text-muted-foreground">{task.contact.email}</div>}
                  </div>
                </div>
              ) : null}

              {task.deal ? (
                <div className="flex items-start bg-accent/20 p-3 rounded-lg border">
                  <Briefcase className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Deal</div>
                    <div className="text-sm text-primary font-medium">{task.deal.title}</div>
                  </div>
                </div>
              ) : null}
              
              {task.companyName && !task.deal && !task.contact && (
                <div className="flex items-start bg-accent/20 p-3 rounded-lg border">
                  <Building2 className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Company</div>
                    <div className="text-sm text-foreground">{task.companyName}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start bg-accent/10 p-3 rounded-lg border border-accent">
                <User className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">Assigned User</div>
                  <div className="text-sm text-foreground">
                    {task.assignedUser ? task.assignedUser.name : "Unassigned"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {task.description && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider text-muted-foreground border-b pb-2">
                Description & Notes
              </h4>
              <div className="flex items-start bg-accent/10 p-4 rounded-lg border border-accent">
                <FileText className="w-4 h-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </div>
          )}
          
          {canEdit && onDelete && (
            <div className="pt-8 flex justify-center">
              <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-white border-destructive/30" onClick={() => onDelete(task)}>
                Delete Task
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
