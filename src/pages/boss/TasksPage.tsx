import { useState } from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Calendar,
  User,
  MoreVertical,
  Flag,
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

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeRole: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "completed";
  dueDate: string;
  createdAt: string;
}

const tasks: Task[] = [
  { id: "1", title: "Prepare Q4 Financial Report", description: "Compile all financial data for Q4 board presentation", assignee: "Robert Taylor", assigneeRole: "Finance", priority: "urgent", status: "in-progress", dueDate: "Dec 12", createdAt: "Dec 5" },
  { id: "2", title: "Review Marketing Budget 2025", description: "Analyze and approve marketing department budget proposal", assignee: "Emily Davis", assigneeRole: "Marketing", priority: "high", status: "pending", dueDate: "Dec 15", createdAt: "Dec 8" },
  { id: "3", title: "Update Employee Handbook", description: "Review and update company policies in employee handbook", assignee: "Lisa Anderson", assigneeRole: "HR", priority: "medium", status: "in-progress", dueDate: "Dec 20", createdAt: "Dec 1" },
  { id: "4", title: "Product Launch Planning", description: "Coordinate with teams for upcoming product launch", assignee: "Sarah Johnson", assigneeRole: "Engineering", priority: "high", status: "pending", dueDate: "Dec 18", createdAt: "Dec 6" },
  { id: "5", title: "Vendor Contract Review", description: "Review and negotiate terms with key vendors", assignee: "James Wilson", assigneeRole: "Operations", priority: "medium", status: "completed", dueDate: "Dec 10", createdAt: "Nov 28" },
  { id: "6", title: "Team Building Event Planning", description: "Organize end of year team building event", assignee: "Lisa Anderson", assigneeRole: "HR", priority: "low", status: "pending", dueDate: "Dec 25", createdAt: "Dec 2" },
];

const priorityConfig = {
  low: { label: "Low", color: "bg-muted text-muted-foreground", icon: Circle },
  medium: { label: "Medium", color: "bg-primary/10 text-primary", icon: Circle },
  high: { label: "High", color: "bg-warning/10 text-warning", icon: Flag },
  urgent: { label: "Urgent", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
  "in-progress": { label: "In Progress", color: "bg-primary/10 text-primary" },
  completed: { label: "Completed", color: "bg-success/10 text-success" },
};

export default function TasksPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredTasks = tasks.filter((task) => {
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    return matchesPriority && matchesStatus;
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Task Management"
        description="Assign and track tasks across teams"
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                  <label className="text-sm font-medium mb-2 block">Task Title</label>
                  <Input placeholder="Enter task title..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea placeholder="Describe the task..." className="min-h-[100px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Assign To</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hr">HR Department</SelectItem>
                        <SelectItem value="finance">Finance Team</SelectItem>
                        <SelectItem value="engineering">Engineering Lead</SelectItem>
                        <SelectItem value="marketing">Marketing Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select defaultValue="medium">
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
                  <label className="text-sm font-medium mb-2 block">Due Date</label>
                  <Input type="date" />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Create Task</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Tasks" value={tasks.length.toString()} icon={CheckCircle} variant="primary" />
        <StatCard
          title="In Progress"
          value={tasks.filter((t) => t.status === "in-progress").length.toString()}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Completed"
          value={tasks.filter((t) => t.status === "completed").length.toString()}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Urgent"
          value={tasks.filter((t) => t.priority === "urgent").length.toString()}
          icon={AlertTriangle}
          variant="destructive"
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
        {filteredTasks.map((task) => {
          const priority = priorityConfig[task.priority];
          const status = statusConfig[task.status];
          const PriorityIcon = priority.icon;

          return (
            <div
              key={task.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={cn("p-2.5 rounded-lg", priority.color)}>
                    <PriorityIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{task.title}</h3>
                      <span className={cn("badge-status", priority.color)}>{priority.label}</span>
                      <span className={cn("badge-status", status.color)}>{status.label}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-1">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {task.assignee} ({task.assigneeRole})
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        Due: {task.dueDate}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Created: {task.createdAt}
                      </div>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Task</DropdownMenuItem>
                    <DropdownMenuItem>Mark as Complete</DropdownMenuItem>
                    <DropdownMenuItem>Reassign</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
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
                  <span className={cn("badge-status", priorityConfig[selectedTask.priority].color)}>
                    {priorityConfig[selectedTask.priority].label}
                  </span>
                  <span className={cn("badge-status", statusConfig[selectedTask.status].color)}>
                    {statusConfig[selectedTask.status].label}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <p className="text-sm">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Assigned To</h4>
                  <p className="font-medium">{selectedTask.assignee}</p>
                  <p className="text-sm text-muted-foreground">{selectedTask.assigneeRole}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h4>
                  <p className="font-medium">{selectedTask.dueDate}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Update Status</h4>
                <Select defaultValue={selectedTask.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button className="flex-1">Save Changes</Button>
                <Button variant="outline" className="flex-1">
                  Add Comment
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
