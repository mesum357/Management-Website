import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  RefreshCw,
  AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { leaveAPI, departmentAPI } from "@/lib/api";

interface LeaveRequest {
  _id: string;
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
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason?: string;
  reviewerComments?: string;
  reviewedBy?: string;
  reviewedOn?: string;
  createdAt: string;
}

interface Department {
  _id: string;
  name: string;
}

export default function LeavesPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.leaveType = typeFilter;

      const [leavesRes, pendingRes, deptRes] = await Promise.all([
        leaveAPI.getAll(params),
        leaveAPI.getPending(),
        departmentAPI.getAll()
      ]);

      setLeaveRequests(leavesRes.data.data.leaves || []);
      setPendingRequests(pendingRes.data.data.leaves || []);
      setDepartments(deptRes.data.data.departments || []);

    } catch (err: any) {
      console.error('Error fetching leave data:', err);
      setError(err.response?.data?.message || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      setActionLoading(true);
      setError(null);

      await leaveAPI.approve(leaveId);
      
      setSuccessMessage('Leave request approved successfully');
      fetchData();
      setSelectedRequests(prev => prev.filter(id => id !== leaveId));
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error approving leave:', err);
      setError(err.response?.data?.message || 'Failed to approve leave request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingLeaveId) return;

    try {
      setActionLoading(true);
      setError(null);

      await leaveAPI.reject(rejectingLeaveId, rejectReason);
      
      setSuccessMessage('Leave request rejected');
      setRejectDialogOpen(false);
      setRejectingLeaveId(null);
      setRejectReason("");
      fetchData();
      setSelectedRequests(prev => prev.filter(id => id !== rejectingLeaveId));
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error rejecting leave:', err);
      setError(err.response?.data?.message || 'Failed to reject leave request');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (leaveId: string) => {
    setRejectingLeaveId(leaveId);
    setRejectDialogOpen(true);
  };

  const handleBulkApprove = async () => {
    for (const id of selectedRequests) {
      await handleApprove(id);
    }
    setSelectedRequests([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLeaveType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + ' Leave';
  };

  const getEmployeeDepartment = (employee: LeaveRequest['employee']) => {
    if (typeof employee.department === 'object' && employee.department) {
      return employee.department.name;
    }
    return 'N/A';
  };

  // Filter by department on client side
  const filteredRequests = departmentFilter === "all"
    ? leaveRequests
    : leaveRequests.filter(req => {
        const dept = req.employee.department;
        if (typeof dept === 'object' && dept) {
          return dept._id === departmentFilter;
        }
        return false;
      });

  // Stats
  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;
  const approvedCount = leaveRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = leaveRequests.filter(r => r.status === 'rejected').length;

  // Calendar
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return daysInMonth;
  };

  const getLeavesForDay = (day: number) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
    return leaveRequests.filter(leave => {
      if (leave.status !== 'approved') return false;
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return checkDate >= start && checkDate <= end;
    }).length;
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave Management"
        description="Review and manage employee leave requests"
        actions={
          <div className="flex items-center gap-3">
            {selectedRequests.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedRequests([])}>
                  Clear ({selectedRequests.length})
                </Button>
                <Button size="sm" onClick={handleBulkApprove} disabled={actionLoading}>
                  Approve Selected
                </Button>
              </div>
            )}
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-success/10 border border-success/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-success" />
          <p className="text-success">{successMessage}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pending Requests" value={String(pendingCount)} icon={Clock} variant="warning" />
        <StatCard title="Approved This Month" value={String(approvedCount)} icon={CheckCircle} variant="success" />
        <StatCard title="Rejected" value={String(rejectedCount)} icon={XCircle} variant="destructive" />
        <StatCard title="Total Requests" value={String(leaveRequests.length)} icon={Users} variant="default" />
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">All Requests</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="calendar">Leave Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No leave requests found</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selectedRequests.length === pendingRequests.length && pendingRequests.length > 0}
                        onChange={() =>
                          setSelectedRequests(
                            selectedRequests.length === pendingRequests.length
                              ? []
                              : pendingRequests.map((r) => r._id)
                          )
                        }
                      />
                    </th>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request._id}>
                      <td>
                        {request.status === "pending" && (
                          <input
                            type="checkbox"
                            className="rounded border-border"
                            checked={selectedRequests.includes(request._id)}
                            onChange={() => toggleSelect(request._id)}
                          />
                        )}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">
                            {request.employee.firstName} {request.employee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getEmployeeDepartment(request.employee)}
                          </p>
                        </div>
                      </td>
                      <td>{formatLeaveType(request.leaveType)}</td>
                      <td>
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </td>
                      <td>{request.totalDays}</td>
                      <td className="max-w-[200px] truncate text-muted-foreground">
                        {request.reason || '-'}
                      </td>
                      <td>
                        <StatusBadge status={request.status} />
                      </td>
                      <td>
                        {request.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 text-destructive hover:text-destructive"
                              onClick={() => openRejectDialog(request._id)}
                              disabled={actionLoading}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 text-success hover:text-success"
                              onClick={() => handleApprove(request._id)}
                              disabled={actionLoading}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending leave requests</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingRequests.map((request) => (
                  <div key={request._id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-medium text-primary">
                            {request.employee.firstName[0]}{request.employee.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {request.employee.firstName} {request.employee.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getEmployeeDepartment(request.employee)} • {request.employee.designation || 'Employee'}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="font-medium">{formatLeaveType(request.leaveType)}</span>
                            <span className="text-muted-foreground">
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </span>
                            <span className="text-muted-foreground">
                              ({request.totalDays} day{request.totalDays > 1 ? 's' : ''})
                            </span>
                          </div>
                          {request.reason && (
                            <p className="mt-2 text-sm text-muted-foreground italic">
                              "{request.reason}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => openRejectDialog(request._id)}
                          disabled={actionLoading}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleApprove(request._id)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Approve'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="section-title">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for first day offset */}
              {[...Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay())].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {[...Array(getDaysInMonth())].map((_, i) => {
                const day = i + 1;
                const leaves = getLeavesForDay(day);
                const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
                
                return (
                  <div
                    key={day}
                    className={cn(
                      "aspect-square p-2 rounded-lg border border-border text-center cursor-pointer hover:bg-muted/50 transition-colors relative",
                      isToday && "ring-2 ring-primary"
                    )}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {leaves > 0 && (
                      <div
                        className={cn(
                          "absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-full",
                          leaves <= 2 && "bg-success",
                          leaves > 2 && leaves <= 5 && "bg-warning",
                          leaves > 5 && "bg-destructive"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-6 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 rounded-full bg-success" />
                Low (1-2)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 rounded-full bg-warning" />
                Medium (3-5)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 rounded-full bg-destructive" />
                High (6+)
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
