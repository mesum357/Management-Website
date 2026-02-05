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
  Settings,
  Save,
  Edit,
  Trash2,
  FileText,
  Image as ImageIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { leaveAPI, departmentAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
  attachments?: Array<{ name: string; url: string }>;
  isRead?: boolean;
}

interface Department {
  _id: string;
  name: string;
}

interface LeavePolicy {
  _id: string;
  leaveType: string;
  yearlyLimit: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function LeavesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Leave Policy state
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [policyForm, setPolicyForm] = useState({
    leaveType: '',
    yearlyLimit: 0,
    description: ''
  });
  const [policyLoading, setPolicyLoading] = useState(false);

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
    fetchLeavePolicies();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    const handleRefresh = () => fetchData();
    window.addEventListener('refreshLeaves', handleRefresh);
    return () => window.removeEventListener('refreshLeaves', handleRefresh);
  }, []);

  // Mark pending leaves as read when the list is fetched or tab changes
  useEffect(() => {
    const markAllAsRead = async () => {
      const unreadPending = pendingRequests.filter(r => !r.isRead);
      if (unreadPending.length > 0) {
        try {
          await Promise.all(unreadPending.map(r => leaveAPI.markAsRead(r._id)));
          // Refresh count in sidebar
          window.dispatchEvent(new CustomEvent('refreshLeaveCount'));
        } catch (err) {
          console.error('Error marking leaves as read:', err);
        }
      }
    };

    if (pendingRequests.length > 0) {
      markAllAsRead();
    }
  }, [pendingRequests]);

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

  const getEmployeeDepartment = (employee: LeaveRequest['employee']) => {
    if (typeof employee.department === 'object' && employee.department) {
      return employee.department.name;
    }
    return 'N/A';
  };

  const fetchLeavePolicies = async () => {
    try {
      setPolicyLoading(true);
      const response = await leaveAPI.getPolicies();
      console.log('[LeavesPage] Leave policies response:', response.data);
      const policies = response.data?.data?.policies || [];
      setLeavePolicies(policies);

      if (policies.length === 0) {
        console.log('[LeavesPage] No leave policies found - this is normal for first time setup');
      }
    } catch (err: any) {
      console.error('[LeavesPage] Error fetching leave policies:', err);
      console.error('[LeavesPage] Error response:', err.response?.data);

      // If it's a 500 error, it might be a backend issue - show a more helpful message
      if (err.response?.status === 500) {
        toast({
          title: "Server Error",
          description: err.response?.data?.message || "Failed to load leave policies. Please check the server logs.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: err.response?.data?.message || "Failed to load leave policies",
          variant: "destructive"
        });
      }

      // Set empty array on error so UI doesn't break
      setLeavePolicies([]);
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!policyForm.leaveType || policyForm.yearlyLimit < 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setPolicyLoading(true);
      await leaveAPI.createPolicy(policyForm);
      toast({
        title: "Success",
        description: "Leave policy saved successfully"
      });
      setEditingPolicy(null);
      setPolicyForm({ leaveType: '', yearlyLimit: 0, description: '' });
      fetchLeavePolicies();
    } catch (err: any) {
      console.error('Error saving leave policy:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to save leave policy",
        variant: "destructive"
      });
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleEditPolicy = (policy: LeavePolicy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      leaveType: policy.leaveType,
      yearlyLimit: policy.yearlyLimit,
      description: policy.description || ''
    });
  };

  const handleUpdatePolicy = async () => {
    if (!editingPolicy || policyForm.yearlyLimit < 0) {
      return;
    }

    try {
      setPolicyLoading(true);
      await leaveAPI.updatePolicy(editingPolicy._id, {
        yearlyLimit: policyForm.yearlyLimit,
        description: policyForm.description
      });
      toast({
        title: "Success",
        description: "Leave policy updated successfully"
      });
      setEditingPolicy(null);
      setPolicyForm({ leaveType: '', yearlyLimit: 0, description: '' });
      fetchLeavePolicies();
    } catch (err: any) {
      console.error('Error updating leave policy:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update leave policy",
        variant: "destructive"
      });
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this leave policy?')) {
      return;
    }

    try {
      setPolicyLoading(true);
      await leaveAPI.deletePolicy(id);
      toast({
        title: "Success",
        description: "Leave policy deleted successfully"
      });
      fetchLeavePolicies();
    } catch (err: any) {
      console.error('Error deleting leave policy:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete leave policy",
        variant: "destructive"
      });
    } finally {
      setPolicyLoading(false);
    }
  };

  const formatLeaveType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + ' Leave';
  };

  // Render All Requests helper
  const renderAllRequests = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (filteredRequests.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No leave requests found</p>
        </div>
      );
    }

    return (
      <div className="w-full">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
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
                        {request.status === 'pending' && !request.isRead && (
                          <span className="ml-2 w-2 h-2 rounded-full bg-blue-500 inline-block shadow-pulse-blue" title="Unread" />
                        )}
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
                    {request.attachments && request.attachments.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {request.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={att.name}
                          >
                            <ImageIcon className="w-4 h-4 text-primary hover:text-primary-dark" />
                          </a>
                        ))}
                      </div>
                    )}
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
        </div>

        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-4 md:hidden p-4">
          {filteredRequests.map((request) => {
            return (
              <div key={request._id} className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <p className="font-semibold text-foreground">
                        {request.employee.firstName} {request.employee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getEmployeeDepartment(request.employee)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={request.status} />
                    {!request.isRead && request.status === 'pending' && (
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">New</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Type</p>
                    <p className="font-medium text-foreground">{formatLeaveType(request.leaveType)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Duration</p>
                    <p className="font-medium text-foreground">{request.totalDays} Day{request.totalDays > 1 ? 's' : ''}</p>
                  </div>
                  <div className="col-span-2 space-y-1 border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Dates</p>
                    <p className="font-medium text-foreground italic">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {request.reason && (
                  <div className="space-y-1 border-l-2 border-primary/20 pl-3">
                    <p className="text-xs text-muted-foreground font-bold uppercase">Reason</p>
                    <p className="text-sm text-foreground italic leading-relaxed">{request.reason}</p>
                  </div>
                )}

                {request.attachments && request.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {request.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{att.name}</span>
                      </a>
                    ))}
                  </div>
                )}

                {request.status === "pending" && (
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      className="flex-1 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border-none"
                      variant="outline"
                      onClick={() => openRejectDialog(request._id)}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1 rounded-xl bg-success text-white hover:bg-success/90 shadow-lg shadow-success/20"
                      onClick={() => handleApprove(request._id)}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
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
    <div className="animate-fade-in max-w-full overflow-x-hidden">
      <PageHeader
        title="Leave Management"
        description="Review and manage employee leave requests"
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedRequests.length > 0 && (
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Button variant="outline" size="sm" onClick={() => setSelectedRequests([])} className="h-9">
                  Clear
                </Button>
                <Button size="sm" onClick={handleBulkApprove} disabled={actionLoading} className="h-9">
                  Approve ({selectedRequests.length})
                </Button>
              </div>
            )}
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className="shrink-0 h-9 w-9">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Button variant="outline" className="gap-2 h-9">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Pending Requests" value={String(pendingCount)} icon={Clock} variant="warning" />
        <StatCard title="Approved" value={String(approvedCount)} icon={CheckCircle} variant="success" />
        <StatCard title="Rejected" value={String(rejectedCount)} icon={XCircle} variant="destructive" />
        <StatCard title="Total Requests" value={String(leaveRequests.length)} icon={Users} variant="default" />
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <div className="w-full overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="justify-start sm:justify-center w-fit min-w-full">
            <TabsTrigger value="requests">All Requests</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="calendar">Leave Calendar</TabsTrigger>
            <TabsTrigger value="policy">
              <Settings className="w-4 h-4 mr-1" />
              Policy
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="requests">
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
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
                <SelectTrigger className="w-full sm:w-[150px]">
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
                <SelectTrigger className="w-full sm:w-[180px]">
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
            {renderAllRequests()}
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
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center relative">
                          <span className="font-medium text-primary">
                            {request.employee.firstName[0]}{request.employee.lastName[0]}
                          </span>
                          {!request.isRead && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-background animate-pulse" />
                          )}
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
                            <div className="mt-2 text-sm text-foreground bg-secondary/20 p-2 rounded-md border border-border">
                              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reason</p>
                              {request.reason}
                            </div>
                          )}
                          {request.attachments && request.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {request.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-md transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  {att.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => openRejectDialog(request._id)}
                          disabled={actionLoading}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="w-full sm:w-auto"
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

        <TabsContent value="policy">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Leave Policy Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure yearly leave limits for each leave type
                </p>
              </div>
              {!editingPolicy && (
                <Button onClick={() => setEditingPolicy({} as LeavePolicy)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Add New Policy
                </Button>
              )}
            </div>

            {editingPolicy && (
              <div className="bg-muted/50 rounded-lg p-6 mb-6 border border-border">
                <h4 className="font-semibold mb-4">
                  {editingPolicy._id ? 'Edit Leave Policy' : 'Create New Leave Policy'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <Select
                      value={policyForm.leaveType}
                      onValueChange={(value) => setPolicyForm({ ...policyForm, leaveType: value })}
                      disabled={!!editingPolicy._id}
                    >
                      <SelectTrigger id="leaveType">
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                        <SelectItem value="other">Other Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="yearlyLimit">Yearly Limit (Days)</Label>
                    <Input
                      id="yearlyLimit"
                      type="number"
                      min="0"
                      value={policyForm.yearlyLimit}
                      onChange={(e) => setPolicyForm({ ...policyForm, yearlyLimit: parseInt(e.target.value) || 0 })}
                      placeholder="Enter yearly limit"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={policyForm.description}
                      onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                      placeholder="Enter policy description..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    onClick={editingPolicy._id ? handleUpdatePolicy : handleSavePolicy}
                    disabled={policyLoading || !policyForm.leaveType || policyForm.yearlyLimit < 0}
                  >
                    {policyLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingPolicy._id ? 'Update Policy' : 'Save Policy'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingPolicy(null);
                      setPolicyForm({ leaveType: '', yearlyLimit: 0, description: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {policyLoading && !editingPolicy ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : leavePolicies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No leave policies configured</p>
                <p className="text-sm mt-1">Click "Add New Policy" to create one</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leavePolicies.map((policy) => (
                  <div
                    key={policy._id}
                    className="bg-muted/30 rounded-lg p-4 border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-foreground">
                            {formatLeaveType(policy.leaveType)}
                          </h4>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            {policy.yearlyLimit} days/year
                          </span>
                        </div>
                        {policy.description && (
                          <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(policy.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPolicy(policy)}
                          disabled={policyLoading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePolicy(policy._id)}
                          disabled={policyLoading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
