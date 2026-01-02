import { useState, useEffect } from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  User,
  MoreVertical,
  Flag,
  Loader2,
  Trash2,
  Edit,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { taskAPI, employeeAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: Array<{ _id: string; firstName: string; lastName: string; employeeId?: string }>;
  assignedBy?: { email: string };
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "under-review" | "completed" | "cancelled" | "on-hold";
  dueDate: string;
  createdAt: string;
  completedDate?: string;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  designation?: string;
}

const priorityConfig = {
  low: { label: "Low", color: "bg-muted text-muted-foreground", icon: Circle },
  medium: { label: "Medium", color: "bg-primary/10 text-primary", icon: Circle },
  high: { label: "High", color: "bg-warning/10 text-warning", icon: Flag },
  urgent: { label: "Urgent", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
  "in-progress": { label: "In Progress", color: "bg-primary/10 text-primary" },
  "under-review": { label: "Under Review", color: "bg-warning/10 text-warning" },
  completed: { label: "Completed", color: "bg-success/10 text-success" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive" },
  "on-hold": { label: "On Hold", color: "bg-muted text-muted-foreground" },
};

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: [] as string[],
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    dueDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, employeesRes] = await Promise.all([
        taskAPI.getAll(),
        employeeAPI.getAll({ status: "active" }),
      ]);
      
      const fetchedTasks = tasksRes.data.data.tasks || [];
      // Filter tasks created by current user
      const userTasks = fetchedTasks.filter(
        (task: Task) => task.assignedBy?._id === user?.id || task.assignedBy?.email === user?.email
      );
      setTasks(userTasks);
      
      const fetchedEmployees = employeesRes.data.data.employees || [];
      setEmployees(fetchedEmployees);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignedTo: [],
      priority: "medium",
      dueDate: "",
    });
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }

    if (formData.assignedTo.length === 0) {
      toast({
        title: "Error",
        description: "Please assign the task to at least one employee",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const taskData = {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        priority: formData.priority,
        dueDate: formData.dueDate,
        status: "pending",
      };

      const response = await taskAPI.create(taskData);

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Task created successfully",
        });
        setIsCreateOpen(false);
        resetForm();
        await fetchData();
      }
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await taskAPI.update(taskId, { status: newStatus });
      toast({
        title: "Success",
        description: "Task status updated",
      });
      await fetchData();
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskAPI.delete(taskId);
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    return matchesPriority && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAssigneeNames = (task: Task) => {
    return task.assignedTo
      .map((emp) => `${emp.firstName} ${emp.lastName}`)
      .join(", ");
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Task Management"
        description="Assign and track tasks across teams"
        actions={
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Assign a new task to team members.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Task Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter task title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    placeholder="Describe the task..."
                    className="min-h-[100px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Assign To <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={formData.assignedTo[0] || ""}
                      onValueChange={(value) => {
                        if (value && !formData.assignedTo.includes(value)) {
                          setFormData({
                            ...formData,
                            assignedTo: [...formData.assignedTo, value],
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp._id} value={emp._id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.assignedTo.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.assignedTo.map((empId) => {
                          const emp = employees.find((e) => e._id === empId);
                          return (
                            <div
                              key={empId}
                              className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                            >
                              <span>
                                {emp?.firstName} {emp?.lastName}
                              </span>
                              <button
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    assignedTo: formData.assignedTo.filter((id) => id !== empId),
                                  });
                                }}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Due Date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Task"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Tasks"
          value={tasks.length.toString()}
          icon={CheckCircle}
          variant="primary"
        />
        <StatCard
          title="Pending"
          value={pendingTasks.length.toString()}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="In Progress"
          value={inProgressTasks.length.toString()}
          icon={Clock}
          variant="default"
        />
        <StatCard
          title="Completed"
          value={completedTasks.length.toString()}
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-muted-foreground">
              {tasks.length === 0
                ? "Create your first task to get started"
                : "No tasks match the selected filters"}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const priority = priorityConfig[task.priority];
            const status = statusConfig[task.status] || statusConfig.pending;
            const PriorityIcon = priority.icon;

            return (
              <div
                key={task._id}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={cn("p-2.5 rounded-lg", priority.color)}>
                      <PriorityIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{task.title}</h3>
                        <span className={cn("badge-status", priority.color)}>
                          {priority.label}
                        </span>
                        <span className={cn("badge-status", status.color)}>{status.label}</span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {task.description || "No description"}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {getAssigneeNames(task)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Due: {formatDate(task.dueDate)}
                        </div>
                        {task.completedDate && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            Completed: {formatDate(task.completedDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedTask(task)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(task._id, "in-progress")}
                        disabled={task.status === "in-progress"}
                      >
                        Mark as In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(task._id, "completed")}
                        disabled={task.status === "completed"}
                      >
                        Mark as Completed
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteTask(task._id)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Detail Sheet */}
      <Sheet open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>
          {selectedTask && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={cn(
                      "badge-status",
                      priorityConfig[selectedTask.priority].color
                    )}
                  >
                    {priorityConfig[selectedTask.priority].label}
                  </span>
                  <span className={cn("badge-status", statusConfig[selectedTask.status]?.color || statusConfig.pending.color)}>
                    {statusConfig[selectedTask.status]?.label || "Pending"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <p className="text-sm">{selectedTask.description || "No description"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Assigned To</h4>
                  <p className="font-medium">{getAssigneeNames(selectedTask)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h4>
                  <p className="font-medium">{formatDate(selectedTask.dueDate)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Update Status</h4>
                <Select
                  value={selectedTask.status}
                  onValueChange={(value) => handleUpdateStatus(selectedTask._id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    handleDeleteTask(selectedTask._id);
                    setSelectedTask(null);
                  }}
                >
                  Delete Task
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
