import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  CalendarCheck,
  Clock,
  AlertTriangle,
  Briefcase,
  Megaphone,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { QuickActionCard } from "@/components/shared/QuickActionCard";
import { DataTable } from "@/components/shared/DataTable";
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

const attendanceData = [
  { name: "Mon", present: 85, absent: 15 },
  { name: "Tue", present: 92, absent: 8 },
  { name: "Wed", present: 88, absent: 12 },
  { name: "Thu", present: 90, absent: 10 },
  { name: "Fri", present: 78, absent: 22 },
  { name: "Sat", present: 45, absent: 5 },
  { name: "Sun", present: 12, absent: 3 },
];

const recentLeaveRequests = [
  { id: "1", employee: "Sarah Johnson", type: "Annual Leave", days: 5, status: "pending" as const, date: "Dec 15-20" },
  { id: "2", employee: "Michael Chen", type: "Sick Leave", days: 2, status: "pending" as const, date: "Dec 12-13" },
  { id: "3", employee: "Emily Davis", type: "Personal", days: 1, status: "pending" as const, date: "Dec 14" },
];

const upcomingInterviews = [
  { id: "1", candidate: "Alex Thompson", position: "Senior Developer", time: "10:00 AM", date: "Today" },
  { id: "2", candidate: "Jessica Lee", position: "UX Designer", time: "2:30 PM", date: "Today" },
  { id: "3", candidate: "David Wilson", position: "Project Manager", time: "11:00 AM", date: "Tomorrow" },
];

export default function HRDashboard() {
  const navigate = useNavigate();

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
          value="248"
          subtitle="Across 8 departments"
          icon={Users}
          variant="primary"
          trend={{ value: 3.2, isPositive: true }}
        />
        <StatCard
          title="New Hires"
          value="12"
          subtitle="This month"
          icon={UserPlus}
          variant="success"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Pending Interviews"
          value="8"
          subtitle="Scheduled this week"
          icon={CalendarCheck}
          variant="warning"
        />
        <StatCard
          title="Leave Requests"
          value="15"
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
                title="Schedule Interview"
                description="Set up candidate interviews"
                icon={CalendarCheck}
                onClick={() => navigate("/hr/recruitment")}
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
            </div>
          </div>

          {/* Attendance Alerts */}
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-warning/10">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Attendance Irregularities</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  5 employees have attendance issues requiring attention
                </p>
                <Button
                  variant="link"
                  className="px-0 h-auto mt-2 text-warning"
                  onClick={() => navigate("/hr/attendance")}
                >
                  Review Now →
                </Button>
              </div>
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
            <div className="space-y-4">
              {recentLeaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{request.employee}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.type} • {request.days} day{request.days > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{request.date}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Today's Interviews</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/hr/recruitment")}>
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{interview.candidate}</p>
                    <p className="text-xs text-muted-foreground">{interview.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{interview.time}</p>
                    <p className="text-xs text-muted-foreground">{interview.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
