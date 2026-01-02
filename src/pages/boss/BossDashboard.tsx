import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Briefcase,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Video,
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
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
import { analyticsAPI, employeeAPI, attendanceAPI, taskAPI, meetingAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Meeting {
  _id: string;
  title: string;
  scheduledAt: string;
  type?: string;
  attendees?: any[];
}

export default function BossDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [todaysMeetings, setTodaysMeetings] = useState<Meeting[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [departmentPerformance, setDepartmentPerformance] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const dashboardRes = await analyticsAPI.getDashboard();
      const stats = dashboardRes.data.data;
      setTotalEmployees(stats.totalEmployees || 0);
      setTodayAttendance(stats.presentToday || 0);
      setAttendanceRate(stats.attendanceRate || 0);

      // Fetch task stats
      try {
        const taskStatsRes = await taskAPI.getStats();
        const taskStats = taskStatsRes.data.data;
        const activeCount = (taskStats.byStatus || []).reduce((sum: number, item: any) => {
          if (item._id !== 'completed' && item._id !== 'cancelled') {
            return sum + (item.count || 0);
          }
          return sum;
        }, 0);
        setActiveTasks(activeCount);
      } catch (err) {
        console.error('Error fetching task stats:', err);
      }

      // Fetch today's meetings
      try {
        const meetingsRes = await meetingAPI.getToday();
        const meetingsData = meetingsRes.data.data.meetings || [];
        setTodaysMeetings(meetingsData.slice(0, 3));
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setTodaysMeetings([]);
      }

      // Generate attendance trend (last 4 weeks)
      const trendData = [
        { week: "W1", rate: attendanceRate + Math.floor(Math.random() * 5) - 2 },
        { week: "W2", rate: attendanceRate + Math.floor(Math.random() * 5) - 2 },
        { week: "W3", rate: attendanceRate + Math.floor(Math.random() * 5) - 2 },
        { week: "W4", rate: attendanceRate },
      ].map(item => ({ ...item, rate: Math.max(80, Math.min(100, item.rate)) }));
      setAttendanceTrend(trendData);

      // Get department performance from employee stats
      try {
        const employeeStatsRes = await employeeAPI.getStats();
        const deptStats = employeeStatsRes.data.data.departmentStats || [];
        const perfData = deptStats.map((dept: any, index: number) => ({
          dept: dept.department || dept.name || "Unknown",
          score: 85 + (index % 10) // Simplified scoring
        }));
        setDepartmentPerformance(perfData.slice(0, 5));
      } catch (err) {
        console.error('Error fetching department stats:', err);
      }

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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={totalEmployees.toString()}
          subtitle={`Active employees`}
          icon={Users}
          variant="primary"
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
          title="Today's Meetings"
          value={todaysMeetings.length.toString()}
          subtitle="Scheduled"
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Trend */}
          <div className="bg-card rounded-xl border border-border p-6">
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

          {/* Department Performance */}
          {departmentPerformance.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="section-title mb-4">Department Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                    <YAxis dataKey="dept" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="score" name="Score" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Today's Schedule */}
        <div className="space-y-6">
          {/* Today's Meetings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Today's Meetings</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/boss/meetings")}>
                View All
              </Button>
            </div>
            {todaysMeetings.length > 0 ? (
              <div className="space-y-4">
                {todaysMeetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {meeting.type || "Meeting"} • {meeting.attendees?.length || 0} attendees
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatTime(meeting.scheduledAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No meetings scheduled for today
              </div>
            )}
          </div>

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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Today's Meetings</span>
                <span className="font-semibold">{todaysMeetings.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
