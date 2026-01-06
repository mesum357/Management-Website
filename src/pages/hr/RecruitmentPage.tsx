import { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Calendar,
  Video,
  User,
  FileText,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { employeeAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  department: {
    _id: string;
    name: string;
  };
  dateOfJoining: string;
  status: string;
}

export default function RecruitmentPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchVerifiedEmployees();
  }, []);

  const fetchVerifiedEmployees = async () => {
    try {
      setLoading(true);
      // Fetch all employees with status 'active' (verified employees)
      const response = await employeeAPI.getAll({ status: "active" });
      const fetchedEmployees = response.data.data.employees || [];
      setEmployees(fetchedEmployees);
    } catch (error: any) {
      console.error("Error fetching verified employees:", error);
      toast({
        title: "Error",
        description: "Failed to load verified employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      emp.firstName?.toLowerCase().includes(searchLower) ||
      emp.lastName?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.employeeId?.toLowerCase().includes(searchLower) ||
      emp.designation?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Recruitment"
        description="Manage job postings and track candidates"
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Post New Job
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          title="Verified Employees" 
          value={employees.length.toString()} 
          icon={Users} 
          variant="primary" 
        />
        <StatCard 
          title="Active Employees" 
          value={employees.filter(e => e.status === 'active').length.toString()} 
          icon={CheckCircle} 
          variant="success" 
        />
        <StatCard 
          title="Total Employees" 
          value={employees.length.toString()} 
          icon={Briefcase} 
          variant="default" 
        />
      </div>

      {/* Verified Employees List */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Verified Employees</h3>
            <p className="text-sm text-muted-foreground mt-1">
              All employees whose accounts have been verified by HR
            </p>
          </div>
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No verified employees found</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Date of Joining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp._id} className="cursor-pointer hover:bg-secondary/50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {getInitials(emp.firstName, emp.lastName)}
                        </div>
                        <div>
                          <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                          <p className="text-sm text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{emp.employeeId}</td>
                    <td>{emp.department?.name || 'N/A'}</td>
                    <td>{emp.designation}</td>
                    <td>{formatDate(emp.dateOfJoining)}</td>
                    <td>
                      <span className={cn(
                        "badge-status",
                        emp.status === 'active' ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
