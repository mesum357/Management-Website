import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Loader2,
  Ticket,
  CheckCircle2,
  XCircle,
  Coffee,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { analyticsAPI, employeeAPI, attendanceAPI, taskAPI, ticketAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";


export default function BossDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [unresolvedTickets, setUnresolvedTickets] = useState(0);
  const [latestTicketNumber, setLatestTicketNumber] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  // Modal state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [onBreakEmployees, setOnBreakEmployees] = useState<any[]>([]);
  const [inactiveEmployees, setInactiveEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time refresh listener
  useEffect(() => {
    const handleRefresh = () => {
      fetchDashboardData();
    };

    window.addEventListener('refreshTickets', handleRefresh);
    return () => {
      window.removeEventListener('refreshTickets', handleRefresh);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Prepare date for attendance report (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Fetch all data in parallel for better performance
      const [dashboardRes, taskStatsRes, ticketsStatsRes, attendanceReportRes] = await Promise.all([
        analyticsAPI.getDashboard().catch(() => ({ data: { data: {} } })),
        taskAPI.getStats().catch(() => ({ data: { data: { byStatus: [] } } })),
        ticketAPI.getStats().catch(() => ({ data: { data: { total: 0, latestTicketNumber: null } } })),
        analyticsAPI.getAttendanceReport({
          startDate: weekAgo.toISOString(),
          endDate: new Date().toISOString()
        }).catch(() => ({ data: { data: { dailyAttendance: [] } } }))
      ]);

      // Process dashboard stats
      const stats = dashboardRes.data.data;
      const totalEmployees = stats.totalEmployees || 0;
      const attendanceRate = stats.attendanceRate || 0;
      setTotalEmployees(totalEmployees);
      setTodayAttendance(stats.presentToday || 0);
      setAttendanceRate(attendanceRate);

      // Process ticket stats
      const ticketStats = ticketsStatsRes.data.data;
      setTotalTickets(ticketStats.total || 0);
      setUnresolvedTickets((ticketStats.open || 0) + (ticketStats.inProgress || 0));
      setLatestTicketNumber(ticketStats.latestTicketNumber || null);

      // Process task stats
      const taskStats = taskStatsRes.data.data;
      const activeCount = (taskStats.byStatus || []).reduce((sum: number, item: any) => {
        if (item._id !== 'completed' && item._id !== 'cancelled') {
          return sum + (item.count || 0);
        }
        return sum;
      }, 0);
      setActiveTasks(activeCount);

      // Process attendance data for weekly chart (like HR Dashboard)
      const dailyData = attendanceReportRes.data.data.dailyAttendance || [];
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      // Map daily data to week days
      const weekData = weekDays.map((day, index) => {
        const dayDate = new Date();
        dayDate.setDate(dayDate.getDate() - (dayDate.getDay() - 1 - index));
        const dateStr = dayDate.toISOString().split('T')[0];

        const dayData = dailyData.find((d: any) => d._id === dateStr);
        if (dayData) {
          return {
            name: day,
            present: dayData.present || 0,
            absent: (dayData.absent || 0) + (dayData.onLeave || 0)
          };
        }

        // If no data for this day, use 0
        return {
          name: day,
          present: 0,
          absent: 0
        };
      });
      setAttendanceData(weekData);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmployeeModal = async () => {
    setIsEmployeeModalOpen(true);
    setLoadingEmployees(true);

    try {
      const response = await attendanceAPI.getTodayPresence();
      const data = response.data.data;
      setActiveEmployees(data.active || []);
      setOnBreakEmployees(data.onBreak || []);
      setInactiveEmployees(data.inactive || []);
    } catch (error: any) {
      console.error('Error fetching employee presence data:', error);
      toast({
        title: "Error",
        description: "Failed to load employee presence data",
        variant: "destructive"
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatBreakType = (reason: string) => {
    if (!reason) return 'Break';
    // Capitalize first letter and handle common break types
    const formatted = reason.charAt(0).toUpperCase() + reason.slice(1).toLowerCase();
    return formatted.replace(/_/g, ' ');
  };

  const formatBreakTime = (minutes: number) => {
    if (!minutes || minutes === 0) return null;
    if (minutes < 60) return `${minutes}m break`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m break` : `${hours}h break`;
  };

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
        title="Executive Dashboard"
        description="Good morning! Here's your company overview for today."
      />

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={totalEmployees.toString()}
          icon={Users}
          variant="primary"
          onClick={handleOpenEmployeeModal}
          clickable
        />
        <StatCard
          title="Active Tasks"
          value={activeTasks.toString()}
          subtitle="In progress"
          icon={Briefcase}
          variant="default"
        />
        <StatCard
          title="Today's Attendance"
          value={`${attendanceRate}%`}
          subtitle={`${todayAttendance} present`}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Unresolved Tickets"
          value={unresolvedTickets.toString()}
          subtitle={`${totalTickets} total tickets`}
          icon={Ticket}
          variant={unresolvedTickets > 0 ? "warning" : "default"}
          onClick={() => navigate("/hr/tickets")}
          clickable
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Weekly Attendance Chart */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="section-title">Weekly Attendance</h3>
                <p className="text-sm text-muted-foreground">Employee attendance overview</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/boss/analytics")}>
                View Analytics
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            {attendanceData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="present"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPresent)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No attendance data available
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Quick Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="section-title mb-4">Quick Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Employees</span>
                <span className="font-semibold">{totalEmployees}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active Tasks</span>
                <span className="font-semibold">{activeTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Today's Attendance</span>
                <span className="font-semibold text-success">{attendanceRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Modal */}
      <Dialog open={isEmployeeModalOpen} onOpenChange={setIsEmployeeModalOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attendance Status</DialogTitle>
            <DialogDescription>
              Today's real-time employee status - active, on break, and inactive
            </DialogDescription>
          </DialogHeader>

          {loadingEmployees ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              {/* Active Employees (Working) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-lg">Active</h3>
                  <span className="text-sm text-muted-foreground">({activeEmployees.length})</span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {activeEmployees.length > 0 ? (
                    activeEmployees.map((employee: any) => (
                      <div
                        key={employee._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee.employeeId} • {employee.department?.name || 'N/A'}
                          </p>
                          {employee.checkInTime && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Clocked in: {formatTime(employee.checkInTime)}
                            </p>
                          )}
                          {employee.totalBreakTime > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              {formatBreakTime(employee.totalBreakTime)}
                            </p>
                          )}
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No active employees
                    </div>
                  )}
                </div>
              </div>

              {/* On Break Employees */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Coffee className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-lg">On Break</h3>
                  <span className="text-sm text-muted-foreground">({onBreakEmployees.length})</span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {onBreakEmployees.length > 0 ? (
                    onBreakEmployees.map((employee: any) => (
                      <div
                        key={employee._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee.employeeId} • {employee.department?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                            {formatBreakType(employee.breakReason)}
                          </p>
                          {employee.breakStartTime && (
                            <p className="text-xs text-muted-foreground">
                              Since: {formatTime(employee.breakStartTime)}
                            </p>
                          )}
                        </div>
                        <Coffee className="w-5 h-5 text-amber-500 flex-shrink-0 ml-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No employees on break
                    </div>
                  )}
                </div>
              </div>

              {/* Inactive Employees */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-lg">Inactive</h3>
                  <span className="text-sm text-muted-foreground">({inactiveEmployees.length})</span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {inactiveEmployees.length > 0 ? (
                    inactiveEmployees.map((employee: any) => (
                      <div
                        key={employee._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee.employeeId} • {employee.department?.name || 'N/A'}
                          </p>
                          {employee.isCheckedIn && (
                            <p className="text-xs text-orange-500 mt-1">
                              {employee.isCheckedOut ? 'Clocked out' : 'Status unknown'}
                            </p>
                          )}
                          {employee.totalBreakTime > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              {formatBreakTime(employee.totalBreakTime)}
                            </p>
                          )}
                        </div>
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No inactive employees
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
