import { useState } from "react";
import {
  Megaphone,
  Plus,
  Send,
  Eye,
  Users,
  Building,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Notice {
  id: string;
  title: string;
  content: string;
  audience: string;
  publishDate: string;
  views: number;
  readRate: number;
}

const notices: Notice[] = [
  { id: "1", title: "Company Vision 2025", content: "I am excited to share our strategic vision for 2025...", audience: "All Employees", publishDate: "Dec 10, 2024", views: 245, readRate: 98 },
  { id: "2", title: "Year-End Performance Bonuses", content: "Thank you all for your hard work this year. I'm pleased to announce...", audience: "All Employees", publishDate: "Dec 5, 2024", views: 248, readRate: 100 },
  { id: "3", title: "Leadership Team Update", content: "Important update regarding our leadership team structure...", audience: "Managers", publishDate: "Dec 1, 2024", views: 32, readRate: 94 },
  { id: "4", title: "HR Policy Changes", content: "Please review the following updates to our HR policies...", audience: "HR Department", publishDate: "Nov 28, 2024", views: 18, readRate: 100 },
];

const engagementData = [
  { month: "Jul", views: 820, engagement: 75 },
  { month: "Aug", views: 890, engagement: 78 },
  { month: "Sep", views: 950, engagement: 82 },
  { month: "Oct", views: 1020, engagement: 85 },
  { month: "Nov", views: 1150, engagement: 88 },
  { month: "Dec", views: 980, engagement: 91 },
];

export default function BossNoticesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Executive Notices"
        description="Broadcast important announcements to your organization"
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Megaphone className="w-4 h-4" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Executive Announcement</DialogTitle>
                <DialogDescription>
                  Create an executive announcement to share with all employees.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input placeholder="Announcement title..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea placeholder="Write your message..." className="min-h-[200px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Broadcast To</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        <SelectItem value="managers">Managers Only</SelectItem>
                        <SelectItem value="hr">HR Department</SelectItem>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="sales">Sales Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="important">Important</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Save Draft
                  </Button>
                  <Button className="gap-2">
                    <Send className="w-4 h-4" />
                    Publish Now
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Announcements" value={notices.length.toString()} icon={Megaphone} variant="primary" />
        <StatCard
          title="Total Views"
          value={notices.reduce((sum, n) => sum + n.views, 0).toString()}
          icon={Eye}
          variant="default"
        />
        <StatCard title="Avg. Read Rate" value="98%" icon={TrendingUp} variant="success" />
        <StatCard title="This Month" value="4" icon={Calendar} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notices List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="section-title">Recent Announcements</h3>
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">{notice.title}</h4>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {notice.content}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-4 h-4" />
                      {notice.audience}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {notice.publishDate}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      {notice.views} views
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      {notice.readRate}% read
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-6">
          {/* Engagement Chart */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="section-title mb-4">Engagement Trend</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="engagement" name="Engagement %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Audience Breakdown */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="section-title mb-4">Audience Reach</h3>
            <div className="space-y-4">
              {[
                { audience: "All Employees", count: 248, percentage: 100 },
                { audience: "Managers", count: 34, percentage: 14 },
                { audience: "HR Department", count: 18, percentage: 7 },
                { audience: "Engineering", count: 85, percentage: 34 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium">{item.audience}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="section-title mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Avg. Time to Read</span>
                <span className="font-semibold">2.3 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Peak View Time</span>
                <span className="font-semibold">9:30 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mobile Views</span>
                <span className="font-semibold">34%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Desktop Views</span>
                <span className="font-semibold">66%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
