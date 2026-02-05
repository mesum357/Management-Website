import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Grid,
  List,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  Snowflake,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { employeeAPI } from "@/lib/api";

interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  designation: string;
  dateOfJoining: string;
  gender?: string;
  status: "pending" | "active" | "on-leave" | "terminated" | "resigned" | "rejected";
  attendanceStatus?: "clocked-in" | "clocked-out" | "on-break" | "inactive";
  isActive?: boolean;
  avatar?: string;
  documents?: Array<{
    name: string;
    url: string;
    uploadedAt: string;
  }>;
}

interface PendingRegistration {
  userId: string;
  email: string;
  createdAt: string;
  employee: Employee;
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

export default function EmployeesPage() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("employees");

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog states
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null
  });
  const [rejectReason, setRejectReason] = useState("");
  const [freezeDialog, setFreezeDialog] = useState<{ open: boolean; employeeId: string | null; isFrozen: boolean }>({
    open: false,
    employeeId: null,
    isFrozen: false
  });
  const [terminateDialog, setTerminateDialog] = useState<{ open: boolean; employeeId: string | null }>({
    open: false,
    employeeId: null
  });
  const [unterminateDialog, setUnterminateDialog] = useState<{ open: boolean; employeeId: string | null }>({
    open: false,
    employeeId: null
  });
  const [editDialog, setEditDialog] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch employees with verified accounts (hasAccount=true) and real-time status
      const [employeesRes, pendingRes, deptRes] = await Promise.all([
        employeeAPI.getWithStatus({ hasAccount: 'true' }),
        api.get('/auth/pending-registrations'),
        api.get('/departments')
      ]);

      setEmployees(employeesRes.data.data.employees || []);
      setPendingRegistrations(pendingRes.data.data.pendingRegistrations || []);
      setDepartments(deptRes.data.data.departments || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setIsProcessing(true);
    try {
      await api.put(`/auth/approve/${userId}`);
      toast({
        title: "Approved!",
        description: "Employee registration has been approved successfully.",
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to approve registration",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.userId) return;

    setIsProcessing(true);
    try {
      await api.put(`/auth/reject/${rejectDialog.userId}`, {
        reason: rejectReason || "Registration rejected by administrator"
      });
      toast({
        title: "Rejected",
        description: "Employee registration has been rejected.",
      });
      setRejectDialog({ open: false, userId: null });
      setRejectReason("");
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject registration",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFreeze = async () => {
    if (!freezeDialog.employeeId) return;

    setIsProcessing(true);
    try {
      await employeeAPI.freeze(freezeDialog.employeeId, !freezeDialog.isFrozen);
      toast({
        title: freezeDialog.isFrozen ? "Unfrozen" : "Frozen",
        description: `Employee account has been ${freezeDialog.isFrozen ? 'unfrozen' : 'frozen'} successfully.`,
      });
      setFreezeDialog({ open: false, employeeId: null, isFrozen: false });
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to freeze/unfreeze employee",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTerminate = async () => {
    if (!terminateDialog.employeeId) return;

    setIsProcessing(true);
    try {
      await employeeAPI.terminate(terminateDialog.employeeId);
      toast({
        title: "Terminated",
        description: "Employee has been terminated successfully.",
      });
      setTerminateDialog({ open: false, employeeId: null });
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to terminate employee",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnterminate = async () => {
    if (!unterminateDialog.employeeId) return;

    setIsProcessing(true);
    try {
      await employeeAPI.unterminate(unterminateDialog.employeeId);
      toast({
        title: "Unterminated",
        description: "Employee has been unterminated successfully.",
      });
      setUnterminateDialog({ open: false, employeeId: null });
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to unterminate employee",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };



  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" || emp.department?._id === selectedDepartment;
    const matchesStatus =
      selectedStatus === "all" || emp.status === selectedStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const pendingCount = pendingRegistrations.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Employee Management"
        description="Manage employees with verified accounts"
        actions={
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Employee
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="w-4 h-4" />
            All Employees
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2 relative">
            <Clock className="w-4 h-4" />
            Pending Requests
            {pendingCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Employees Tab */}
        <TabsContent value="employees" className="mt-6">
          {/* Filters */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === "table" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Employee List */}
          {filteredEmployees.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No employees found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try adjusting your search" : "No employees match the selected filters"}
              </p>
            </div>
          ) : viewMode === "table" ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp._id}
                      className="cursor-pointer"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {getInitials(emp.firstName, emp.lastName)}
                          </div>
                          <div>
                            <p className="font-medium">{emp.fullName}</p>
                            <p className="text-sm text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>{emp.department?.name || 'N/A'}</td>
                      <td>{emp.designation}</td>
                      <td>{formatDate(emp.dateOfJoining)}</td>
                      <td>
                        <StatusBadge status={emp.status === 'terminated' ? 'terminated' : (emp.attendanceStatus || emp.status)} />
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {emp.status === 'terminated' ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUnterminateDialog({ open: true, employeeId: emp._id });
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Unterminate Employee
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFreezeDialog({
                                      open: true,
                                      employeeId: emp._id,
                                      isFrozen: emp.isActive === false
                                    });
                                  }}
                                >
                                  <Snowflake className="w-4 h-4 mr-2" />
                                  {emp.isActive === false ? 'Unfreeze Account' : 'Freeze Account'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTerminateDialog({ open: true, employeeId: emp._id });
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Terminate Employee
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp._id}
                  className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedEmployee(emp)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {getInitials(emp.firstName, emp.lastName)}
                      </div>
                      <div>
                        <p className="font-semibold">{emp.fullName}</p>
                        <p className="text-sm text-muted-foreground">{emp.designation}</p>
                      </div>
                    </div>
                    <StatusBadge status={emp.status === 'terminated' ? 'terminated' : (emp.attendanceStatus || emp.status)} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="w-4 h-4" />
                      {emp.department?.name || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {emp.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="flex-1">
                          <MoreVertical className="w-4 h-4 mr-2" />
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {emp.status === 'terminated' ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setUnterminateDialog({ open: true, employeeId: emp._id });
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Unterminate Employee
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setFreezeDialog({
                                  open: true,
                                  employeeId: emp._id,
                                  isFrozen: emp.isActive === false
                                });
                              }}
                            >
                              <Snowflake className="w-4 h-4 mr-2" />
                              {emp.isActive === false ? 'Unfreeze Account' : 'Freeze Account'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setTerminateDialog({ open: true, employeeId: emp._id });
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Terminate Employee
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="pending" className="mt-6">
          {pendingRegistrations.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No pending requests</h3>
              <p className="text-muted-foreground">
                All employee registrations have been processed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRegistrations.map((reg) => (
                <div
                  key={reg.userId}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {reg.employee?.firstName} {reg.employee?.lastName}
                          </h3>
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Pending Verification
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{reg.email}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {reg.employee?.department?.name || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {reg.employee?.designation}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {reg.employee?.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:flex-col lg:flex-row">
                      <p className="text-xs text-muted-foreground">
                        Applied: {formatDate(reg.createdAt)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-2 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(reg.userId)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-2"
                          onClick={() => setRejectDialog({ open: true, userId: reg.userId })}
                          disabled={isProcessing}
                        >
                          <UserX className="w-4 h-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Freeze Confirmation Dialog */}
      <Dialog open={freezeDialog.open} onOpenChange={(open) => setFreezeDialog({ open, employeeId: null, isFrozen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{freezeDialog.isFrozen ? 'Unfreeze' : 'Freeze'} Employee Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to {freezeDialog.isFrozen ? 'unfreeze' : 'freeze'} this employee's account?
              {!freezeDialog.isFrozen && ' The employee will not be able to log in until the account is unfrozen.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeDialog({ open: false, employeeId: null, isFrozen: false })}>
              Cancel
            </Button>
            <Button onClick={handleFreeze} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                freezeDialog.isFrozen ? 'Unfreeze' : 'Freeze'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Confirmation Dialog */}
      <Dialog open={terminateDialog.open} onOpenChange={(open) => setTerminateDialog({ open, employeeId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to terminate this employee? This will set their status to "terminated" and deactivate their account. The employee record will be kept for historical purposes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateDialog({ open: false, employeeId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleTerminate} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Terminating...
                </>
              ) : (
                'Terminate Employee'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unterminate Confirmation Dialog */}
      <Dialog open={unterminateDialog.open} onOpenChange={(open) => setUnterminateDialog({ open, employeeId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unterminate Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to unterminate this employee? Their status will be set back to "active" and their user account will be reactivated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnterminateDialog({ open: false, employeeId: null })}>
              Cancel
            </Button>
            <Button onClick={handleUnterminate} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unterminating...
                </>
              ) : (
                'Unterminate Employee'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Employee Detail Sheet */}
      <Sheet open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Employee Details</SheetTitle>
          </SheetHeader>
          {selectedEmployee && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-medium text-primary">
                  {getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedEmployee.fullName}</h3>
                  <p className="text-muted-foreground">{selectedEmployee.designation}</p>
                  <StatusBadge status={selectedEmployee.status} className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Employee ID</p>
                  <p className="font-medium">{selectedEmployee.employeeId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Department</p>
                  <p className="font-medium">{selectedEmployee.department?.name || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Join Date</p>
                  <p className="font-medium">{formatDate(selectedEmployee.dateOfJoining)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Gender</p>
                  <p className="font-medium capitalize">{selectedEmployee.gender || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {selectedEmployee.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {selectedEmployee.phone}
                  </div>
                </div>
              </div>

              {selectedEmployee.documents && selectedEmployee.documents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Employee Documents</h4>
                  <div className="space-y-2">
                    {selectedEmployee.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-destructive" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions removed to match "only terminate and freeze" requirement */}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, userId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Reject Registration
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this employee registration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for rejection (optional)</label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, userId: null })}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Registration'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </div >
  );
}
