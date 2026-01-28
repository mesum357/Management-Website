import { useState, useEffect } from "react";
import {
  Loader2,
  Search,
  Calendar,
  Headphones,
  DollarSign,
  User,
  Building2,
  Eye,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { reportAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Report {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: {
      name: string;
    };
    designation?: string;
  };
  date: string;
  headset: number;
  sales: number;
  salesCount?: number;
  salesDetails?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportActivityPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [filterPeriod]);

  const getDateRange = (period: "today" | "week" | "month") => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    if (period === "today") {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(filterPeriod);

      const response = await reportAPI.getAll({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000, // Get all reports for the period
      });

      if (response.data.success) {
        setReports(response.data.data.reports || []);
      }
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const employeeName = `${report.employee.firstName} ${report.employee.lastName}`.toLowerCase();
    const employeeId = report.employee.employeeId?.toLowerCase() || "";
    const department = report.employee.department?.name?.toLowerCase() || "";

    return (
      employeeName.includes(query) ||
      employeeId.includes(query) ||
      department.includes(query)
    );
  });

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsDialogOpen(true);
  };

  const getPeriodLabel = (period: "today" | "week" | "month") => {
    switch (period) {
      case "today":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      default:
        return "Today";
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
        title="Report Activity"
        description="View all employee progress reports"
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by employee name, ID, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={filterPeriod}
          onValueChange={(value: "today" | "week" | "month") => setFilterPeriod(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Employee Reports - {getPeriodLabel(filterPeriod)}</span>
            <Badge variant="secondary">{filteredReports.length} reports</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No reports found for {getPeriodLabel(filterPeriod).toLowerCase()}</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">
                        <Headphones className="w-4 h-4 inline mr-1" />
                        Headset
                      </TableHead>
                      <TableHead className="text-center">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Sales
                      </TableHead>
                      <TableHead className="text-center">
                        Sales Count
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report._id}>
                        <TableCell>
                          {format(new Date(report.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {report.employee.firstName} {report.employee.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {report.employee.employeeId}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span>{report.employee.department?.name || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {report.headset}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-success">
                          ${report.sales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-blue-600">
                          {report.salesCount || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Detailed information about the employee's progress report
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6 mt-4">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Employee Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-semibold">
                        {selectedReport.employee.firstName} {selectedReport.employee.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Employee ID</p>
                      <p className="font-mono text-sm">{selectedReport.employee.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p>{selectedReport.employee.department?.name || "N/A"}</p>
                    </div>
                    {selectedReport.employee.designation && (
                      <div>
                        <p className="text-xs text-muted-foreground">Designation</p>
                        <p>{selectedReport.employee.designation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Report Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-semibold">
                        {format(new Date(selectedReport.date), "MMMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Day</p>
                      <p>{format(new Date(selectedReport.date), "EEEE")}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Report Metrics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Report Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Headphones className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Headset Count</p>
                        <p className="text-2xl font-bold">{selectedReport.headset}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-success/5 rounded-lg">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sales ($)</p>
                        <p className="text-2xl font-bold text-success">
                          ${selectedReport.sales.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-lg">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Activity className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sales Count</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedReport.salesCount || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedReport.salesDetails && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Sales Details</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedReport.salesDetails}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Created: {format(new Date(selectedReport.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                </p>
                {selectedReport.updatedAt !== selectedReport.createdAt && (
                  <p>
                    Updated: {format(new Date(selectedReport.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
