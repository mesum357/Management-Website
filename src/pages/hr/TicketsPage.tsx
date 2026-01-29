import { useState, useEffect } from "react";
import {
  Ticket as TicketIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ticketAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Ticket {
  _id: string;
  ticketNumber: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: {
      _id: string;
      name: string;
    } | string;
    designation?: string;
  };
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  resolvedBy?: {
    _id: string;
    email: string;
  };
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TicketsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    latestTicketNumber: null as string | null,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Resolve dialog
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // View ticket dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [statusFilter, categoryFilter, priorityFilter]);

  // Real-time refresh listener
  useEffect(() => {
    const handleRefresh = () => {
      fetchData();
      fetchStats();
    };

    window.addEventListener('refreshTickets', handleRefresh);
    return () => {
      window.removeEventListener('refreshTickets', handleRefresh);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;

      const ticketsRes = await ticketAPI.getAll(params);

      setTickets(ticketsRes.data.data.tickets || []);

    } catch (err: any) {
      console.error("Error fetching tickets:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsRes = await ticketAPI.getStats();
      const statsData = statsRes.data.data;
      setStats({
        total: statsData.total || 0,
        open: statsData.open || 0,
        inProgress: statsData.inProgress || 0,
        resolved: statsData.resolved || 0,
        latestTicketNumber: statsData.latestTicketNumber || null,
      });
    } catch (err: any) {
      console.error("Error fetching ticket stats:", err);
    }
  };

  const handleResolve = (ticket: Ticket) => {
    setResolvingTicketId(ticket._id);
    setResolutionNotes("");
    setResolveDialogOpen(true);
  };

  const confirmResolve = async () => {
    if (!resolvingTicketId) return;

    try {
      setActionLoading(true);
      await ticketAPI.resolve(resolvingTicketId, resolutionNotes);

      toast({
        title: "Success",
        description: "Ticket resolved successfully",
      });

      setResolveDialogOpen(false);
      setResolvingTicketId(null);
      setResolutionNotes("");
      await fetchData();
      await fetchStats();
    } catch (err: any) {
      console.error("Error resolving ticket:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to resolve ticket",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setViewDialogOpen(true);
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      setActionLoading(true);
      await ticketAPI.updateStatus(ticketId, newStatus);

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });

      await fetchData();
      await fetchStats();
    } catch (err: any) {
      console.error("Error updating ticket status:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update ticket status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive/10 text-destructive";
      case "high":
        return "bg-destructive-light text-destructive";
      case "medium":
        return "bg-warning-light text-warning";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-warning-light text-warning";
      case "in-progress":
        return "bg-primary-light text-primary";
      case "resolved":
        return "bg-success-light text-success";
      case "closed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatStatus = (status: string) => {
    return status.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const getEmployeeDepartment = (employee: Ticket["employee"]) => {
    if (typeof employee.department === "object" && employee.department) {
      return employee.department.name;
    }
    return "N/A";
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (categoryFilter !== "all" && ticket.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
    return true;
  });

  const categories = Array.from(new Set(tickets.map((t) => t.category)));

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
        title="Ticket Management"
        description="View and manage employee support tickets"
        actions={
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Tickets"
          value={stats.total.toString()}
          subtitle="All tickets"
          icon={TicketIcon}
          variant="primary"
        />
        <StatCard
          title="Open"
          value={stats.open.toString()}
          subtitle="Awaiting action"
          icon={AlertCircle}
          variant="warning"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress.toString()}
          subtitle="Being worked on"
          icon={Clock}
          variant="default"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved.toString()}
          subtitle="Completed tickets"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
                setPriorityFilter("all");
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ticket #
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <TicketIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No tickets found</p>
                    {statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all" ? (
                      <p className="text-sm mt-2">Try adjusting your filters</p>
                    ) : null}
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => handleViewTicket(ticket)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium">{ticket.ticketNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">
                          {ticket.employee.firstName} {ticket.employee.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getEmployeeDepartment(ticket.employee)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium max-w-[200px] truncate">{ticket.subject}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{ticket.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getPriorityColor(ticket.priority))}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(ticket.status))}>
                          {formatStatus(ticket.status)}
                        </span>
                        {ticket.status === "resolved" && ticket.resolutionNotes && (
                          <span className="text-xs text-muted-foreground italic truncate max-w-[120px]" title={ticket.resolutionNotes}>
                            (Has notes)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {ticket.status !== "resolved" && ticket.status !== "closed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolve(ticket)}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                        {ticket.status === "open" && (
                          <Select
                            value={ticket.status}
                            onValueChange={(value) => handleStatusChange(ticket._id, value)}
                          >
                            <SelectTrigger className="w-[140px]" onClick={(e) => e.stopPropagation()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolve</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TicketIcon className="w-5 h-5" />
              {selectedTicket?.ticketNumber}
            </DialogTitle>
            <DialogDescription>{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Employee</Label>
                  <p className="font-medium">
                    {selectedTicket.employee.firstName} {selectedTicket.employee.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedTicket.employee.employeeId}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{getEmployeeDepartment(selectedTicket.employee)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedTicket.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <span className={cn("inline-block px-2 py-1 rounded-full text-xs font-medium", getPriorityColor(selectedTicket.priority))}>
                    {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                  </span>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <span className={cn("inline-block px-2 py-1 rounded-full text-xs font-medium", getStatusColor(selectedTicket.status))}>
                    {formatStatus(selectedTicket.status)}
                  </span>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{formatDateTime(selectedTicket.createdAt)}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {selectedTicket.resolvedAt && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <Label className="text-success font-medium">Resolution Details</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Resolved by</Label>
                      <p className="text-sm font-medium">{selectedTicket.resolvedBy?.email || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Resolved at</Label>
                      <p className="text-sm font-medium">{formatDateTime(selectedTicket.resolvedAt)}</p>
                    </div>
                  </div>
                  {selectedTicket.resolutionNotes && (
                    <div className="bg-success/5 border border-success/20 rounded-lg p-4 mt-3">
                      <Label className="text-muted-foreground text-xs block mb-2">Resolution Notes</Label>
                      <p className="text-sm whitespace-pre-wrap">{selectedTicket.resolutionNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedTicket && selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
              <Button onClick={() => {
                setViewDialogOpen(false);
                handleResolve(selectedTicket);
              }}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve Ticket
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Ticket</DialogTitle>
            <DialogDescription>
              Mark this ticket as resolved. You can add resolution notes below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="resolutionNotes">Resolution Notes (Optional)</Label>
              <Textarea
                id="resolutionNotes"
                placeholder="Add any notes about how this ticket was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="min-h-[100px] mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveDialogOpen(false);
                setResolutionNotes("");
                setResolvingTicketId(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={confirmResolve} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolve Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
