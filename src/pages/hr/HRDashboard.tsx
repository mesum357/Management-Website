import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Clock,
  AlertTriangle,
  Briefcase,
  Megaphone,
  TrendingUp,
  ArrowRight,
  Loader2,
  CalendarCheck,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { QuickActionCard } from "@/components/shared/QuickActionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { analyticsAPI, employeeAPI, leaveAPI, attendanceAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface LeaveRequest {
  _id: string;
  employee: {
    firstName: string;
    lastName: string;
  };
  leaveType: string;
  totalDays: number;
  status: string;
  startDate: string;
  endDate: string;
}

export default function HRDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [newHires, setNewHires] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [recentLeaveRequests, setRecentLeaveRequests] = useState<LeaveRequest[]>([]);

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
      setPendingLeaves(stats.pendingLeaves || 0);

      // Fetch employee stats for new hires (this month)
      const employeeStatsRes = await employeeAPI.getStats();
      const employeeStats = employeeStatsRes.data.data;
      
      // Calculate new hires this month (simplified)
      setNewHires(0); // Would need historical data for accurate count

      // Fetch pending leave requests
      const leavesRes = await leaveAPI.getPending();
      const pendingLeavesData = leavesRes.data.data.leaves || [];
      setRecentLeaveRequests(
        pendingLeavesData.slice(0, 3).map((leave: any) => ({
          _id: leave._id,
          employee: leave.employee,
          leaveType: leave.leaveType,
          totalDays: leave.totalDays,
          status: leave.status,
          startDate: leave.startDate,
          endDate: leave.endDate,
        }))
      );

      // Fetch real weekly attendance data
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const attendanceReportRes = await analyticsAPI.getAttendanceReport({
          startDate: weekAgo.toISOString(),
          endDate: new Date().toISOString()
        });
        
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
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        // Fallback to empty data
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        setAttendanceData(weekDays.map(day => ({ name: day, present: 0, absent: 0 })));
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

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
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
        title="HR Dashboard"
        description="Welcome back! Here's what's happening today."
        actions={
          <Button onClick={() => navigate("/hr/employees")} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Employee
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={totalEmployees.toString()}
          subtitle={`Active employees`}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="New Hires"
          value={newHires.toString()}
          subtitle="This month"
          icon={UserPlus}
          variant="success"
        />
        <StatCard
          title="Leave Requests"
          value={pendingLeaves.toString()}
          subtitle="Awaiting approval"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Chart */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="section-title">Weekly Attendance</h3>
                <p className="text-sm text-muted-foreground">Employee attendance overview</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/hr/attendance")}>
                View Details
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

          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="section-title mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <QuickActionCard
                title="Add Employee"
                description="Create new employee profile"
                icon={UserPlus}
                onClick={() => navigate("/hr/employees")}
                variant="primary"
              />
              <QuickActionCard
                title="Post Notice"
                description="Publish company announcement"
                icon={Megaphone}
                onClick={() => navigate("/hr/notices")}
              />
              <QuickActionCard
                title="View Analytics"
                description="HR performance metrics"
                icon={TrendingUp}
                onClick={() => navigate("/hr/analytics")}
              />
              <QuickActionCard
                title="Leave Management"
                description="Manage employee leave requests"
                icon={Clock}
                onClick={() => navigate("/hr/leaves")}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Lists */}
        <div className="space-y-6">
          {/* Pending Leave Requests */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Leave Requests</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/hr/leaves")}>
                View All
              </Button>
            </div>
            {recentLeaveRequests.length > 0 ? (
              <div className="space-y-4">
                {recentLeaveRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {request.employee?.firstName} {request.employee?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.leaveType} • {request.totalDays} day{request.totalDays > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateRange(request.startDate, request.endDate)}
                      </p>
                    </div>
                    <StatusBadge status={request.status as any} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No pending leave requests
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
