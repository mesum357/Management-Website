import { useState, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { attendanceAPI, departmentAPI } from "@/lib/api";
import * as XLSX from "xlsx";

interface AttendanceRecord {
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
  };
  date: string;
  checkIn?: {
    time: string;
    ipAddress?: string;
  };
  checkOut?: {
    time: string;
    ipAddress?: string;
  };
  status: "present" | "late" | "absent" | "early" | "overtime" | "clocked-out" | "half-day" | "on-leave";
  workingHours?: number;
  overtime?: number;
  breaks?: Array<{
    startTime: string;
    endTime?: string;
    duration?: number;
  }>;
}

interface Department {
  _id: string;
  name: string;
}

interface AttendanceStats {
  todayStats: { _id: string; count: number }[];
  monthlyStats: { _id: string; count: number }[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  present: { label: "Present", color: "bg-success/10 text-success", icon: CheckCircle },
  early: { label: "Early", color: "bg-primary/10 text-primary", icon: Clock },
  late: { label: "Late", color: "bg-warning/10 text-warning", icon: Clock },
  overtime: { label: "Overtime", color: "bg-warning/10 text-warning", icon: Clock },
  "clocked-out": { label: "Clocked Out", color: "bg-success/10 text-success", icon: CheckCircle },
  absent: { label: "Absent", color: "bg-destructive/10 text-destructive", icon: XCircle },
  "half-day": { label: "Half Day", color: "bg-info/10 text-info", icon: Clock },
  "on-leave": { label: "On Leave", color: "bg-muted text-muted-foreground", icon: Calendar },
};

export default function AttendancePage() {
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedDate, setSelectedDate] = useState("today");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedDepartment, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params: any = {};

      // Date filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate === "today") {
        params.startDate = today.toISOString();
        params.endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
      } else if (selectedDate === "yesterday") {
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        params.startDate = yesterday.toISOString();
        params.endDate = today.toISOString();
      } else if (selectedDate === "this-week") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        params.startDate = startOfWeek.toISOString();
        params.endDate = new Date().toISOString();
      } else if (selectedDate === "this-month") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        params.startDate = startOfMonth.toISOString();
        params.endDate = new Date().toISOString();
      }

      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }

      // Fetch attendance, departments, and stats in parallel
      const [attendanceRes, deptRes, statsRes] = await Promise.all([
        attendanceAPI.getAll(params),
        departmentAPI.getAll(),
        attendanceAPI.getStats().catch(() => ({ data: { data: null } }))
      ]);

      setAttendanceRecords(attendanceRes.data.data.attendance || []);
      setDepartments(deptRes.data.data.departments || []);
      if (statsRes.data.data) {
        setStats(statsRes.data.data);
      }

    } catch (err: any) {
      console.error('Error fetching attendance data:', err);
      setError(err.response?.data?.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return "-";
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateWorkHours = (record: AttendanceRecord) => {
    if (record.workingHours !== undefined && record.workingHours !== null) {
      const hours = Math.floor(record.workingHours);
      const minutes = Math.round((record.workingHours - hours) * 60);
      return `${hours}h ${minutes}m`;
    }

    if (!record.checkIn?.time || !record.checkOut?.time) return "-";
    const inTime = new Date(record.checkIn.time);
    const outTime = new Date(record.checkOut.time);
    const diffMs = outTime.getTime() - inTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const calculateBreakTime = (record: AttendanceRecord) => {
    if (!record.breaks || record.breaks.length === 0) return "0m";
    const totalMinutes = record.breaks.reduce((total, b) => total + (b.duration || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getEmployeeDepartment = (employee: AttendanceRecord['employee']) => {
    if (typeof employee.department === 'object' && employee.department) {
      return employee.department.name;
    }
    return 'N/A';
  };

  // Filter by department on client side if needed
  const filteredRecords = selectedDepartment === "all"
    ? attendanceRecords
    : attendanceRecords.filter(record => {
      const dept = record.employee.department;
      if (typeof dept === 'object' && dept) {
        return dept._id === selectedDepartment;
      }
      return false;
    });

  // Render table content helper
  const renderTableContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (filteredRecords.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No attendance records found for the selected filters</p>
        </div>
      );
    }

    return (
      <div className="w-full">
        {/* Table View (Desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Break Time</th>
                <th>Overtime</th>
                <th>Work Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const config = statusConfig[record.status] || statusConfig.present;
                const Icon = config.icon;
                return (
                  <tr key={record._id}>
                    <td>
                      <div>
                        <p className="font-medium">
                          {record.employee.firstName} {record.employee.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.employee.employeeId}
                        </p>
                      </div>
                    </td>
                    <td>{getEmployeeDepartment(record.employee)}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <span className={record.status === "late" ? "text-warning font-medium" : ""}>
                        {formatTime(record.checkIn?.time)}
                      </span>
                    </td>
                    <td>{formatTime(record.checkOut?.time)}</td>
                    <td>{calculateBreakTime(record)}</td>
                    <td>{record.overtime ? `${Math.round(record.overtime)}h ${Math.round((record.overtime % 1) * 60)}m` : '-'}</td>
                    <td>{calculateWorkHours(record)}</td>
                    <td>
                      <span className={cn("badge-status flex items-center gap-1.5 w-fit", config.color)}>
                        <Icon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Card View (Mobile) */}
        <div className="grid grid-cols-1 gap-4 md:hidden p-4">
          {filteredRecords.map((record) => {
            const config = statusConfig[record.status] || statusConfig.present;
            const Icon = config.icon;
            return (
              <div key={record._id} className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {record.employee.firstName} {record.employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground pb-1">ID: {record.employee.employeeId}</p>
                    <p className="text-xs font-medium text-primary/80">{getEmployeeDepartment(record.employee)}</p>
                  </div>
                  <span className={cn("badge-status flex items-center gap-1.5 shrink-0 ml-2", config.color)}>
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-2 border-t border-border/50">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Date</p>
                    <p className="text-sm font-medium">{formatDate(record.date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Work Hours</p>
                    <p className="text-sm font-medium">{calculateWorkHours(record)}</p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded-lg">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Check In</p>
                    <p className={cn("text-sm font-medium", record.status === "late" && "text-warning")}>
                      {formatTime(record.checkIn?.time)}
                    </p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded-lg">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Check Out</p>
                    <p className="text-sm font-medium">{formatTime(record.checkOut?.time)}</p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded-lg col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Overtime</p>
                    <p className="text-sm font-medium">{record.overtime ? `${Math.round(record.overtime)}h ${Math.round((record.overtime % 1) * 60)}m` : '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Break duration: <span className="text-foreground/80 font-medium">{calculateBreakTime(record)}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Calculate stats from records
  const presentCount = filteredRecords.filter(r => ['present', 'early', 'clocked-out'].includes(r.status)).length;
  const lateCount = filteredRecords.filter(r => r.status === 'late').length;
  const overtimeCount = filteredRecords.filter(r => r.status === 'overtime').length;
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
  const totalCount = filteredRecords.length;

  // Export to Excel function
  const handleExportReport = () => {
    if (filteredRecords.length === 0) {
      alert('No records to export');
      return;
    }

    // Prepare data for export
    const exportData = filteredRecords.map(record => ({
      'Employee Name': `${record.employee.firstName} ${record.employee.lastName}`,
      'Employee ID': record.employee.employeeId,
      'Department': getEmployeeDepartment(record.employee),
      'Date': formatDate(record.date),
      'Check In': formatTime(record.checkIn?.time),
      'Check Out': formatTime(record.checkOut?.time),
      'Break Time': calculateBreakTime(record),
      'Overtime': record.overtime ? `${Math.round(record.overtime)}h ${Math.round((record.overtime % 1) * 60)}m` : '-',
      'Work Hours': calculateWorkHours(record),
      'Status': statusConfig[record.status]?.label || record.status
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Employee Name
      { wch: 15 }, // Employee ID
      { wch: 20 }, // Department
      { wch: 15 }, // Date
      { wch: 12 }, // Check In
      { wch: 12 }, // Check Out
      { wch: 12 }, // Work Hours
      { wch: 12 }, // Overtime
      { wch: 12 }, // Status
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

    // Generate filename with date and filters
    const today = new Date().toISOString().split('T')[0];
    const filterLabel = selectedDate === 'today' ? 'Today' :
      selectedDate === 'yesterday' ? 'Yesterday' :
        selectedDate === 'this-week' ? 'This_Week' :
          selectedDate === 'this-month' ? 'This_Month' : '';
    const deptLabel = selectedDepartment !== 'all'
      ? departments.find(d => d._id === selectedDepartment)?.name?.replace(/\s+/g, '_') || ''
      : 'All_Departments';
    const statusLabel = selectedStatus !== 'all' ? selectedStatus : 'All_Status';

    const filename = `Attendance_Report_${filterLabel}_${deptLabel}_${statusLabel}_${today}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="animate-fade-in max-w-full overflow-x-hidden">
      <PageHeader
        title="Attendance Management"
        description="Track and manage team attendance"
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className="shrink-0">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Button variant="outline" className="gap-2 flex-1 sm:flex-initial justify-center" onClick={handleExportReport} disabled={loading || filteredRecords.length === 0}>
              <Download className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Export Report</span>
              <span className="xs:hidden inline">Export</span>
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full min-w-0 pr-0.5">
        <StatCard
          title="Present Today"
          value={String(presentCount)}
          subtitle={totalCount > 0 ? `${Math.round((presentCount / totalCount) * 100)}% attendance` : "No records"}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Late Arrivals"
          value={String(lateCount)}
          subtitle="After 7:05 AM"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Absent Today"
          value={String(absentCount)}
          subtitle="Including leaves"
          icon={XCircle}
          variant="destructive"
        />
        <StatCard
          title="Total Records"
          value={String(totalCount)}
          subtitle="In selected period"
          icon={Users}
          variant="default"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6 w-full min-w-0">
        <div className="w-full overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="justify-start sm:justify-center w-fit min-w-full">
            <TabsTrigger value="overview">Team Overview</TabsTrigger>
            <TabsTrigger value="corrections">Pending Corrections</TabsTrigger>
            <TabsTrigger value="irregularities">Irregularities</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="early">Early</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="overtime">Overtime</SelectItem>
                  <SelectItem value="clocked-out">Clocked Out</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="table-container">
              {renderTableContent()}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="corrections">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="section-title mb-4">Manual Correction Requests</h3>
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending correction requests</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="irregularities">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="section-title mb-4">Attendance Irregularities</h3>
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No irregularities detected</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
