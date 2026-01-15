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
  const [latestTicketNumber, setLatestTicketNumber] = useState<string | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  
  // Modal state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [inactiveEmployees, setInactiveEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Prepare dates
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Fetch all data in parallel for better performance
      const [dashboardRes, taskStatsRes, ticketsStatsRes, attendanceTrendRes, employeeStatsRes, attendanceDeptRes] = await Promise.all([
        analyticsAPI.getDashboard().catch(() => ({ data: { data: {} } })),
        taskAPI.getStats().catch(() => ({ data: { data: { byStatus: [] } } })),
        ticketAPI.getStats().catch(() => ({ data: { data: { total: 0, latestTicketNumber: null } } })),
        analyticsAPI.getAttendanceReport({
          startDate: fourWeeksAgo.toISOString(),
          endDate: new Date().toISOString()
        }).catch(() => ({ data: { data: { dailyAttendance: [] } } })),
        employeeAPI.getStats().catch(() => ({ data: { data: { departmentStats: [] } } })),
        analyticsAPI.getAttendanceReport({
          startDate: thirtyDaysAgo.toISOString(),
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

      // Process attendance trend data
      const dailyData = attendanceTrendRes.data.data.dailyAttendance || [];
      
      // Group by week
      const weeklyData: any = {};
      dailyData.forEach((day: any) => {
        const date = new Date(day._id);
        const weekNum = Math.floor((new Date().getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weekNum < 4) {
          const weekKey = `W${4 - weekNum}`;
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { present: 0, total: 0 };
          }
          weeklyData[weekKey].present += day.present || 0;
          weeklyData[weekKey].total += (day.present || 0) + (day.absent || 0) + (day.onLeave || 0);
        }
      });
      
      const trendData = ['W1', 'W2', 'W3', 'W4'].map(week => {
        const weekData = weeklyData[week] || { present: 0, total: 0 };
        const rate = weekData.total > 0 
          ? Math.round((weekData.present / weekData.total) * 100)
          : attendanceRate;
        return { week, rate: Math.max(80, Math.min(100, rate)) };
      });
      setAttendanceTrend(trendData);

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
          title="Tickets"
          value={latestTicketNumber || totalTickets.toString()}
          subtitle={latestTicketNumber ? `Latest: ${latestTicketNumber}` : `${totalTickets} total tickets`}
          icon={Ticket}
          variant="default"
          onClick={() => navigate("/hr/tickets")}
          clickable
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Attendance Trend */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="section-title">Weekly Attendance Trend</h3>
                <p className="text-sm text-muted-foreground">4-week overview</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/boss/analytics")}>
                View Analytics
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            {attendanceTrend.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[80, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="rate" name="Attendance %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Status</DialogTitle>
            <DialogDescription>
              View active (clocked in) and inactive (not clocked in) employees
            </DialogDescription>
          </DialogHeader>

          {loadingEmployees ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Active Employees */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-lg">Active Employees</h3>
                  <span className="text-sm text-muted-foreground">({activeEmployees.length})</span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {activeEmployees.length > 0 ? (
                    activeEmployees.map((employee: any) => (
                      <div
                        key={employee._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee.employeeId} • {employee.department?.name || 'N/A'} • {employee.designation || 'N/A'}
                          </p>
                          {employee.checkInTime && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Clocked in: {formatTime(employee.checkInTime)}
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

              {/* Inactive Employees */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-lg">Inactive Employees</h3>
                  <span className="text-sm text-muted-foreground">({inactiveEmployees.length})</span>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {inactiveEmployees.length > 0 ? (
                    inactiveEmployees.map((employee: any) => (
                      <div
                        key={employee._id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {employee.employeeId} • {employee.department?.name || 'N/A'} • {employee.designation || 'N/A'}
                          </p>
                          {employee.isCheckedIn && (
                            <p className="text-xs text-orange-500 mt-1">
                              {employee.isCheckedOut ? 'Clocked out' : 'Status unknown'}
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
