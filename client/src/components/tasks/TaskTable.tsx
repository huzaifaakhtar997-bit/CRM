import React from "react";
import { Task } from "../../types/api.types";
import { Edit, Trash2, Eye, Calendar, CheckSquare, Check, Clock, Phone, Mail, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "bg-red-100 text-red-800 border-red-200";
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200";
      case "MEDIUM": return "bg-blue-100 text-blue-800 border-blue-200";
      case "LOW": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "CALL": return <Phone className="w-4 h-4 text-emerald-600" />;
      case "EMAIL": return <Mail className="w-4 h-4 text-blue-600" />;
      case "MEETING": return <Users className="w-4 h-4 text-purple-600" />;
      default: return <CheckSquare className="w-4 h-4 text-gray-600" />;
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

  if (loading) {
    return (
      <div className="w-full bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-5 w-5 bg-accent rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-accent rounded w-1/3"></div>
                <div className="h-3 bg-accent rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="w-full bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <CheckSquare className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No tasks found</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          You don't have any tasks matching the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-accent/30 border-b">
            <tr>
              <th className="px-6 py-4 font-medium w-12">Status</th>
              <th className="px-6 py-4 font-medium">Task</th>
              <th className="px-6 py-4 font-medium hidden md:table-cell">Related To</th>
              <th className="px-6 py-4 font-medium hidden sm:table-cell">Due Date</th>
              <th className="px-6 py-4 font-medium hidden lg:table-cell">Priority</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((task) => {
              const overdue = !task.completed && isOverdue(task.dueDate, task.dueTime);
              return (
                <tr 
                  key={task.id} 
                  className={`hover:bg-accent/20 transition-colors ${task.completed ? 'opacity-60 bg-accent/10' : ''}`}
                >
                  <td className="px-6 py-4">
                    <button
                      onClick={() => canEdit && onToggleComplete(task)}
                      disabled={!canEdit}
                      className={`flex items-center justify-center w-5 h-5 rounded border transition-colors ${
                        task.completed 
                          ? 'bg-primary border-primary text-primary-foreground' 
                          : 'border-input hover:border-primary text-transparent'
                      } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </button>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {getTaskIcon(task.taskType)}
                      </div>
                      <div>
                        <div className={`font-medium text-foreground ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="space-y-1">
                      {task.contact && (
                        <div className="text-xs text-foreground font-medium">
                          {task.contact.firstName} {task.contact.lastName}
                        </div>
                      )}
                      {(task.deal || task.companyName) && (
                        <div className="text-xs text-muted-foreground">
                          {task.deal ? task.deal.title : task.companyName}
                        </div>
                      )}
                      {!task.contact && !task.deal && !task.companyName && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className={`flex items-center ${overdue ? 'text-destructive font-medium' : 'text-foreground'}`}>
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                    </div>
                    {task.dueTime && (
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3 mr-1.5" />
                        {task.dueTime}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(task)}
                        title="View Details"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(task)}
                            title="Edit"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(task)}
                            title="Delete"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
