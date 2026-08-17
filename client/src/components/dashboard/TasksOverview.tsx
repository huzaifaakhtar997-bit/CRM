import React from "react";
import { Link } from "react-router-dom";
import { Task } from "../../types/api.types";
import { ArrowRight, AlertCircle, CheckCircle2, Circle } from "lucide-react";

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
  return (
    <div className="bg-card border rounded-xl shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="font-semibold text-lg text-foreground">Pending Tasks</h3>
        <Link
          to="/tasks"
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center transition-colors"
        >
          View all <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="p-0 flex-1 overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-6 w-6 bg-accent rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-accent rounded w-1/3"></div>
                  <div className="h-3 bg-accent rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <AlertCircle className="w-8 h-8 text-destructive/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Unable to load pending tasks.</p>
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-sm text-muted-foreground">You're all caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No pending tasks assigned to you.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-accent/30 border-b hidden sm:table-header-group">
              <tr>
                <th className="px-6 py-3 font-medium">Task</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map((task) => {
                const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && !task.completed : false;
                return (
                  <tr key={task.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className={`font-medium ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {task.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {task.taskType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border
                        ${task.priority === 'HIGH' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                          task.priority === 'MEDIUM' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 
                          'bg-blue-500/10 text-blue-600 border-blue-500/20'}
                      `}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
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
