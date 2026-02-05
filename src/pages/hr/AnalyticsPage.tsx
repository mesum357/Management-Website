import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Loader2,
  Headphones,
  DollarSign,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { analyticsAPI, reportAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Determine base path (hr or boss)
  const basePath = location.pathname.startsWith('/boss') ? '/boss' : '/hr';
  const [loading, setLoading] = useState(true);
  const [headsetPeriod, setHeadsetPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [salesPeriod, setSalesPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  // Charts data
  const [headsetData, setHeadsetData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  // Stat card values
  const [headsetCount, setHeadsetCount] = useState<number>(0);
  const [headsetSubtitle, setHeadsetSubtitle] = useState<string>("");
  const [salesTotal, setSalesTotal] = useState<number>(0);
  const [salesCountTotal, setSalesCountTotal] = useState<number>(0);
  const [salesSubtitle, setSalesSubtitle] = useState<string>("");

  useEffect(() => {
    fetchAnalytics();
  }, [headsetPeriod, salesPeriod]);

  const getDateRange = (period: "daily" | "weekly" | "monthly") => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (period === "daily") {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      // Start of current week (Sunday)
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Start of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch headset stats
      const headsetRange = getDateRange(headsetPeriod);
      const headsetStatsRes = await analyticsAPI.getReportStats({
        startDate: headsetRange.startDate.toISOString(),
        endDate: headsetRange.endDate.toISOString()
      }).catch(() => ({ data: { data: { headsetStats: [], salesStats: [] } } }));

      // Fetch sales stats
      const salesRange = getDateRange(salesPeriod);
      const salesStatsRes = await analyticsAPI.getReportStats({
        startDate: salesRange.startDate.toISOString(),
        endDate: salesRange.endDate.toISOString()
      }).catch(() => ({ data: { data: { headsetStats: [], salesStats: [] } } }));

      // Process headset data
      const headsetStats = headsetStatsRes.data.data;
      if (headsetStats.headsetStats && headsetStats.headsetStats.length > 0) {
        // Calculate total headset count for the period
        const totalHeadset = headsetStats.headsetStats.reduce((sum: number, stat: any) => sum + (stat.headsetCount || 0), 0);
        setHeadsetCount(totalHeadset);

        // Set subtitle based on period
        if (headsetPeriod === "daily") {
          setHeadsetSubtitle("Today's headset count");
        } else if (headsetPeriod === "weekly") {
          setHeadsetSubtitle("Weekly headset count");
        } else {
          setHeadsetSubtitle("Monthly headset count");
        }

        // Format chart data
        const headsetChartData = headsetStats.headsetStats
          .slice()
          .reverse()
          .map((stat: any) => ({
            date: new Date(stat.date || stat._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            total: stat.totalEmployees || 0,
            withHeadset: stat.headsetCount || 0,
            percentage: stat.totalEmployees > 0
              ? Math.round((stat.headsetCount / stat.totalEmployees) * 100)
              : 0
          }));
        setHeadsetData(headsetChartData);
      } else {
        setHeadsetCount(0);
        setHeadsetSubtitle(headsetPeriod === "daily" ? "Today's headset count" : headsetPeriod === "weekly" ? "Weekly headset count" : "Monthly headset count");
        setHeadsetData([]);
      }

      // Process sales data
      const salesStats = salesStatsRes.data.data;
      if (salesStats.salesStats && salesStats.salesStats.length > 0) {
        // Calculate total sales for the period
        const totalSales = salesStats.salesStats.reduce((sum: number, stat: any) => sum + (stat.totalSales || 0), 0);
        const totalSalesCount = salesStats.salesStats.reduce((sum: number, stat: any) => sum + (stat.totalSalesCount || 0), 0);
        setSalesTotal(totalSales);
        setSalesCountTotal(totalSalesCount);

        // Set subtitle based on period
        if (salesPeriod === "daily") {
          setSalesSubtitle("Today's sales");
        } else if (salesPeriod === "weekly") {
          setSalesSubtitle("Weekly sales");
        } else {
          setSalesSubtitle("Monthly sales");
        }

        // Format chart data
        const salesChartData = salesStats.salesStats
          .slice()
          .reverse()
          .map((stat: any) => ({
            date: new Date(stat.date || stat._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            total: stat.totalSales || 0,
            average: Math.round(stat.avgSales || 0),
            employees: stat.employeeCount || 0
          }));
        setSalesData(salesChartData);
      } else {
        setSalesTotal(0);
        setSalesCountTotal(0);
        setSalesSubtitle(salesPeriod === "daily" ? "Today's sales" : salesPeriod === "weekly" ? "Weekly sales" : "Monthly sales");
        setSalesData([]);
      }

      // Fetch all reports for the period to show recent activity
      const allReportsRes = await reportAPI.getAll({
        startDate: headsetRange.startDate.toISOString(), // Use headset range as it's the same or similar
        endDate: headsetRange.endDate.toISOString(),
        limit: 10
      }).catch(() => ({ data: { data: { reports: [] } } }));

      if (allReportsRes.data.success) {
        setRecentReports(allReportsRes.data.data.reports || []);
      }

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
        title="Analytics"
        description="Insights and metrics for workforce management"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Headset Count Card */}
        <StatCard
          title="Headset Count"
          value={headsetCount.toString()}
          subtitle={headsetSubtitle}
          icon={Headphones}
          variant="primary"
          actions={
            <div className="flex items-center gap-2">
              <Select value={headsetPeriod} onValueChange={(value: "daily" | "weekly" | "monthly") => setHeadsetPeriod(value)}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => navigate(`${basePath}/reports`)}
              >
                <Activity className="w-4 h-4 mr-1" />
                All Activity
              </Button>
            </div>
          }
        />

        {/* Sales Card */}
        <StatCard
          title="Sales"
          value={`$${salesTotal.toLocaleString()}`}
          subtitle={salesSubtitle}
          icon={DollarSign}
          variant="success"
          actions={
            <div className="flex items-center gap-2">
              <Select value={salesPeriod} onValueChange={(value: "daily" | "weekly" | "monthly") => setSalesPeriod(value)}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => navigate(`${basePath}/reports`)}
              >
                <Activity className="w-4 h-4 mr-1" />
                All Activity
              </Button>
            </div>
          }
        />

        {/* Sales Count Card */}
        <StatCard
          title="Sales Count"
          value={salesCountTotal.toString()}
          subtitle={salesSubtitle.replace("sales", "sales count")}
          icon={Activity}
          variant="primary"
          actions={
            <div className="flex items-center gap-2">
              <Select value={salesPeriod} onValueChange={(value: "daily" | "weekly" | "monthly") => setSalesPeriod(value)}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Headset Usage */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Headphones className="w-5 h-5 text-primary" />
            <h3 className="section-title">Headset Usage</h3>
          </div>
          {headsetData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={headsetData}>
                  <defs>
                    <linearGradient id="colorHeadset" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="withHeadset"
                    name="With Headset"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorHeadset)"
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Employees"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    fillOpacity={0.1}
                    fill="hsl(var(--muted-foreground))"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No headset data available
            </div>
          )}
        </div>

        {/* Sales Trend */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-success" />
            <h3 className="section-title">Sales Trend</h3>
          </div>
          {salesData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: any) => {
                      if (typeof value === 'number') {
                        return value.toLocaleString();
                      }
                      return value;
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Sales"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No sales data available
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Reports Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center">Headset</TableHead>
                  <TableHead className="text-center">Sales ($)</TableHead>
                  <TableHead className="text-center">Sales Count</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No recent activity found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentReports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(report.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {report.employee.firstName} {report.employee.lastName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{report.headset}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold text-success">
                        ${report.sales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center font-bold text-blue-600">
                        {report.salesCount || 0}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm text-muted-foreground truncate" title={report.salesDetails}>
                          {report.salesDetails || "N/A"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/reports`)}>
              View All Activity Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
