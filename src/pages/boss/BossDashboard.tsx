import { useNavigate } from "react-router-dom";
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Video,
  FileText,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const growthData = [
  { month: "Jan", revenue: 420, employees: 220 },
  { month: "Feb", revenue: 455, employees: 225 },
  { month: "Mar", revenue: 480, employees: 230 },
  { month: "Apr", revenue: 510, employees: 228 },
  { month: "May", revenue: 545, employees: 235 },
  { month: "Jun", revenue: 580, employees: 240 },
  { month: "Jul", revenue: 620, employees: 238 },
  { month: "Aug", revenue: 650, employees: 242 },
  { month: "Sep", revenue: 695, employees: 245 },
  { month: "Oct", revenue: 720, employees: 248 },
  { month: "Nov", revenue: 755, employees: 250 },
  { month: "Dec", revenue: 780, employees: 248 },
];

const attendanceTrend = [
  { week: "W1", rate: 92 },
  { week: "W2", rate: 88 },
  { week: "W3", rate: 91 },
  { week: "W4", rate: 94 },
];

const departmentPerformance = [
  { dept: "Engineering", score: 92 },
  { dept: "Sales", score: 88 },
  { dept: "Marketing", score: 85 },
  { dept: "Design", score: 90 },
  { dept: "Finance", score: 87 },
];

const todaysMeetings = [
  { id: "1", title: "Q4 Review", time: "10:00 AM", type: "Board Meeting", attendees: 8 },
  { id: "2", title: "Product Strategy", time: "2:00 PM", type: "Strategy", attendees: 5 },
  { id: "3", title: "Budget Planning", time: "4:30 PM", type: "Finance", attendees: 4 },
];

const todaysInterviews = [
  { id: "1", candidate: "Alex Thompson", position: "VP Engineering", time: "11:30 AM" },
  { id: "2", candidate: "Sarah Mitchell", position: "Head of Design", time: "3:00 PM" },
];

const urgentAlerts = [
  { id: "1", message: "3 key employees have submitted resignations", type: "critical" },
  { id: "2", message: "Budget overrun in Marketing department", type: "warning" },
  { id: "3", message: "Compliance deadline approaching (Dec 15)", type: "info" },
];

export default function BossDashboard() {
  const navigate = useNavigate();

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
          value="248"
          subtitle="Across 8 departments"
          icon={Users}
          variant="primary"
          trend={{ value: 3.2, isPositive: true }}
        />
        <StatCard
          title="Active Projects"
          value="24"
          subtitle="8 critical priority"
          icon={Briefcase}
          variant="default"
        />
        <StatCard
          title="Today's Attendance"
          value="92%"
          subtitle="218 present"
          icon={CheckCircle}
          variant="success"
          trend={{ value: 2.1, isPositive: true }}
        />
        <StatCard
          title="Monthly Revenue"
          value="$780K"
          subtitle="Target: $750K"
          icon={DollarSign}
          variant="success"
          trend={{ value: 8.5, isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Growth Chart */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="section-title">Company Growth</h3>
                <p className="text-sm text-muted-foreground">Revenue & Headcount trends</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/boss/reports")}>
                View Reports
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue ($K)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="employees"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Employees"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Trend */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="section-title mb-4">Weekly Attendance</h3>
              <div className="h-48">
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
            </div>

            {/* Department Performance */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="section-title mb-4">Department Performance</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                    <YAxis dataKey="dept" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
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
          </div>

          {/* Urgent Alerts */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="section-title mb-4">Urgent Alerts</h3>
            <div className="space-y-3">
              {urgentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    alert.type === "critical"
                      ? "bg-destructive/5 border-destructive/30"
                      : alert.type === "warning"
                      ? "bg-warning/5 border-warning/30"
                      : "bg-info/5 border-info/30"
                  }`}
                >
                  <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 ${
                      alert.type === "critical"
                        ? "text-destructive"
                        : alert.type === "warning"
                        ? "text-warning"
                        : "text-info"
                    }`}
                  />
                  <span className="text-sm flex-1">{alert.message}</span>
                  <Button variant="ghost" size="sm">
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </div>
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
            <div className="space-y-4">
              {todaysMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{meeting.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {meeting.type} • {meeting.attendees} attendees
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{meeting.time}</p>
                    <Button size="sm" variant="outline" className="mt-1 h-7 text-xs gap-1">
                      <Video className="w-3 h-3" />
                      Join
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Interviews */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Executive Interviews</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/boss/meetings")}>
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {todaysInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border"
                >
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{interview.candidate}</p>
                    <p className="text-sm text-muted-foreground">{interview.position}</p>
                  </div>
                  <p className="text-sm font-medium">{interview.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="section-title mb-4">Monthly Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">New Hires</span>
                <span className="font-semibold text-success">+12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Departures</span>
                <span className="font-semibold text-destructive">-4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Open Positions</span>
                <span className="font-semibold">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Projects Completed</span>
                <span className="font-semibold text-success">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Budget Utilization</span>
                <span className="font-semibold">87%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
