import { useEffect, useState, useCallback } from "react";
import { tasksApi } from "../api/tasks.api";
import { Task } from "../types/api.types";
import { TaskTable } from "../components/tasks/TaskTable";
import { TaskForm } from "../components/tasks/TaskForm";
import { TaskDetails } from "../components/tasks/TaskDetails";
import { TaskFilters, TaskStatusFilter } from "../components/tasks/TaskFilters";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { Plus, AlertCircle } from "lucide-react";

export default function Tasks() {
  const { user } = useAuth();
  
  // RBAC
  const canWrite = ["ADMIN", "MANAGER", "SALES_REP"].includes(user?.role || "");

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("OPEN");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Modals/Drawers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const completedParam = 
        statusFilter === "OPEN" ? false : 
        statusFilter === "COMPLETED" ? true : 
        undefined;

      const data = await tasksApi.getTasks({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        completed: completedParam,
        priority: priorityFilter || undefined,
      });
      setTasks(data.tasks || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, priorityFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handlers
  const handleCreateNew = () => {
    setSelectedTask(null);
    setIsFormOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  const handleView = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const handleDelete = async (task: Task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await tasksApi.deleteTask(task.id);
        setIsDetailsOpen(false);
        loadTasks();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete task.");
      }
    }
  };

  const handleSaveTask = async (data: Partial<Task>) => {
    if (selectedTask) {
      await tasksApi.updateTask(selectedTask.id, data);
    } else {
      await tasksApi.createTask(data);
    }
    loadTasks();
  };

  const handleToggleComplete = async (task: Task) => {
    const isCompleted = !task.completed;
    
    // Optimistic UI
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, completed: isCompleted } : t
    ));

    try {
      await tasksApi.updateTask(task.id, { completed: isCompleted });
      // Depending on filters, the task might disappear, so we should reload
      loadTasks();
    } catch (err: any) {
      alert("Failed to update task status.");
      // Rollback
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, completed: task.completed } : t
      ));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-bottom duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your daily action items, calls, and meetings.
          </p>
        </div>
        {canWrite && (
          <Button onClick={handleCreateNew} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <TaskFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={(status) => { setStatusFilter(status); setPage(1); }}
        priorityFilter={priorityFilter}
        onPriorityChange={(priority) => { setPriorityFilter(priority); setPage(1); }}
      />

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center justify-between border border-destructive/20">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadTasks} className="border-destructive/30 hover:bg-destructive hover:text-white">
            Retry
          </Button>
        </div>
      )}

      {/* Main Table */}
      <div className="min-h-[400px]">
        <TaskTable
          tasks={tasks}
          loading={loading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleComplete={handleToggleComplete}
        />
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedTask}
        onSave={handleSaveTask}
      />
      
      <TaskDetails
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
        onEdit={canWrite ? handleEdit : undefined}
        onDelete={canWrite ? handleDelete : undefined}
        onToggleComplete={canWrite ? handleToggleComplete : undefined}
        canEdit={canWrite}
      />

    </div>
  );
}
