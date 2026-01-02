import {
  Download,
  FileText,
  Users,
  DollarSign,
  Clock,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  lastGenerated: string;
  formats: string[];
}

const reports: Report[] = [
  {
    id: "1",
    title: "Employee Headcount Report",
    description: "Detailed breakdown of employees by department, location, and status",
    category: "HR",
    icon: Users,
    lastGenerated: "Dec 10, 2024",
    formats: ["PDF", "CSV", "XLSX"],
  },
  {
    id: "2",
    title: "Attendance Summary",
    description: "Monthly attendance statistics including late arrivals and absences",
    category: "Attendance",
    icon: Clock,
    lastGenerated: "Dec 10, 2024",
    formats: ["PDF", "CSV", "XLSX"],
  },
  {
    id: "3",
    title: "Leave Utilization Report",
    description: "Leave balances and utilization patterns across the organization",
    category: "Leave",
    icon: Calendar,
    lastGenerated: "Dec 9, 2024",
    formats: ["PDF", "CSV"],
  },
  {
    id: "4",
    title: "Salary & Compensation Analysis",
    description: "Salary distribution, averages, and compensation benchmarks",
    category: "Finance",
    icon: DollarSign,
    lastGenerated: "Dec 1, 2024",
    formats: ["PDF", "XLSX"],
  },
  {
    id: "5",
    title: "Hiring & Attrition Report",
    description: "New hires, departures, and turnover rates with trend analysis",
    category: "HR",
    icon: TrendingUp,
    lastGenerated: "Dec 10, 2024",
    formats: ["PDF", "CSV", "XLSX"],
  },
  {
    id: "6",
    title: "Department Performance Metrics",
    description: "Performance KPIs and productivity metrics by department",
    category: "Performance",
    icon: BarChart3,
    lastGenerated: "Dec 8, 2024",
    formats: ["PDF", "CSV"],
  },
  {
    id: "7",
    title: "Budget vs Actual Report",
    description: "Financial comparison of budgeted vs actual spending",
    category: "Finance",
    icon: PieChart,
    lastGenerated: "Dec 5, 2024",
    formats: ["PDF", "XLSX"],
  },
  {
    id: "8",
    title: "Recruitment Pipeline Report",
    description: "Status of all open positions and candidate pipeline metrics",
    category: "Recruitment",
    icon: Users,
    lastGenerated: "Dec 10, 2024",
    formats: ["PDF", "CSV"],
  },
];

const categoryColors: Record<string, string> = {
  HR: "bg-primary/10 text-primary",
  Attendance: "bg-warning/10 text-warning",
  Leave: "bg-success/10 text-success",
  Finance: "bg-accent/10 text-accent",
  Performance: "bg-info/10 text-info",
  Recruitment: "bg-destructive/10 text-destructive",
};

export default function ReportsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports Center"
        description="Generate and download comprehensive reports"
        actions={
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="attendance">Attendance</SelectItem>
              <SelectItem value="leave">Leave</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="recruitment">Recruitment</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Quick Export */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h3 className="section-title mb-4">Quick Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Complete HR Summary", icon: Users },
            { label: "Monthly Attendance", icon: Clock },
            { label: "Financial Overview", icon: DollarSign },
            { label: "All Reports Bundle", icon: FileText },
          ].map((item, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="h-auto py-4 justify-start gap-3"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={cn("p-3 rounded-xl", categoryColors[report.category])}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{report.title}</h4>
                    <span className={cn("badge-status text-xs", categoryColors[report.category])}>
                      {report.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Last generated: {report.lastGenerated}
                    </span>
                    <div className="flex items-center gap-2">
                      {report.formats.map((format) => (
                        <Button key={format} size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <Download className="w-3 h-3" />
                          {format}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scheduled Reports */}
      <div className="mt-8">
        <h3 className="section-title mb-4">Scheduled Reports</h3>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Frequency</th>
                <th>Next Run</th>
                <th>Recipients</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { report: "Weekly Attendance Summary", frequency: "Weekly", nextRun: "Dec 16, 2024", recipients: 5 },
                { report: "Monthly HR Dashboard", frequency: "Monthly", nextRun: "Jan 1, 2025", recipients: 3 },
                { report: "Quarterly Performance Review", frequency: "Quarterly", nextRun: "Jan 1, 2025", recipients: 8 },
              ].map((item, idx) => (
                <tr key={idx}>
                  <td className="font-medium">{item.report}</td>
                  <td>
                    <span className="badge-status bg-primary/10 text-primary">{item.frequency}</span>
                  </td>
                  <td>{item.nextRun}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      {item.recipients}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-8">
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8">
                        Run Now
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
