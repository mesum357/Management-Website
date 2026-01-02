import { useState } from "react";
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

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  applicants: number;
  postedDate: string;
  status: "open" | "closed";
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  stage: "applied" | "shortlisted" | "interview" | "hired" | "rejected";
  appliedDate: string;
  avatar: string;
}

const jobPostings: JobPosting[] = [
  { id: "1", title: "Senior Frontend Developer", department: "Engineering", location: "Remote", type: "Full-time", applicants: 45, postedDate: "Dec 1, 2024", status: "open" },
  { id: "2", title: "UX Designer", department: "Design", location: "New York", type: "Full-time", applicants: 32, postedDate: "Nov 28, 2024", status: "open" },
  { id: "3", title: "Marketing Manager", department: "Marketing", location: "Chicago", type: "Full-time", applicants: 28, postedDate: "Nov 25, 2024", status: "open" },
  { id: "4", title: "DevOps Engineer", department: "Engineering", location: "San Francisco", type: "Full-time", applicants: 19, postedDate: "Nov 20, 2024", status: "closed" },
];

const candidates: Candidate[] = [
  { id: "1", name: "Alex Thompson", email: "alex.t@email.com", position: "Senior Frontend Developer", stage: "interview", appliedDate: "Dec 5, 2024", avatar: "AT" },
  { id: "2", name: "Jessica Lee", email: "jessica.l@email.com", position: "UX Designer", stage: "shortlisted", appliedDate: "Dec 4, 2024", avatar: "JL" },
  { id: "3", name: "David Wilson", email: "david.w@email.com", position: "Senior Frontend Developer", stage: "applied", appliedDate: "Dec 3, 2024", avatar: "DW" },
  { id: "4", name: "Emma Brown", email: "emma.b@email.com", position: "Marketing Manager", stage: "hired", appliedDate: "Nov 30, 2024", avatar: "EB" },
  { id: "5", name: "Ryan Garcia", email: "ryan.g@email.com", position: "DevOps Engineer", stage: "rejected", appliedDate: "Nov 28, 2024", avatar: "RG" },
  { id: "6", name: "Sophie Chen", email: "sophie.c@email.com", position: "UX Designer", stage: "interview", appliedDate: "Dec 2, 2024", avatar: "SC" },
];

const stages = [
  { key: "applied", label: "Applied", icon: FileText, color: "bg-muted" },
  { key: "shortlisted", label: "Shortlisted", icon: Users, color: "bg-primary/10 text-primary" },
  { key: "interview", label: "Interview", icon: Video, color: "bg-warning/10 text-warning" },
  { key: "hired", label: "Hired", icon: CheckCircle, color: "bg-success/10 text-success" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "bg-destructive/10 text-destructive" },
];

export default function RecruitmentPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const getCandidatesByStage = (stage: string) =>
    candidates.filter((c) => c.stage === stage);

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Open Positions" value="3" icon={Briefcase} variant="primary" />
        <StatCard title="Total Applicants" value="124" icon={Users} variant="default" />
        <StatCard title="Interviews Scheduled" value="8" icon={Calendar} variant="warning" />
        <StatCard title="Hired This Month" value="4" icon={CheckCircle} variant="success" />
      </div>

      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipeline">Candidate Pipeline</TabsTrigger>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 overflow-x-auto">
            {stages.map((stage) => {
              const stagesCandidates = getCandidatesByStage(stage.key);
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="min-w-[240px]">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className={cn("p-1.5 rounded-lg", stage.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">{stage.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {stagesCandidates.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {stagesCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                            {candidate.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{candidate.position}</p>
                            <p className="text-xs text-muted-foreground mt-1">{candidate.appliedDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                          <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs">
                            View
                          </Button>
                          <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs">
                            Move
                          </Button>
                        </div>
                      </div>
                    ))}
                    {stagesCandidates.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                        No candidates
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Applicants</th>
                  <th>Posted</th>
                  <th>Status</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {jobPostings.map((job) => (
                  <tr key={job.id} className="cursor-pointer">
                    <td className="font-medium">{job.title}</td>
                    <td>{job.department}</td>
                    <td>{job.location}</td>
                    <td>{job.type}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {job.applicants}
                      </div>
                    </td>
                    <td className="text-muted-foreground">{job.postedDate}</td>
                    <td>
                      <span
                        className={cn(
                          "badge-status",
                          job.status === "open" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {job.status === "open" ? "Open" : "Closed"}
                      </span>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View Applicants</DropdownMenuItem>
                          <DropdownMenuItem>Close Position</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="interviews">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="section-title mb-4">Today's Interviews</h3>
              <div className="space-y-4">
                {[
                  { candidate: "Alex Thompson", position: "Senior Frontend Developer", time: "10:00 AM", type: "Technical Round" },
                  { candidate: "Sophie Chen", position: "UX Designer", time: "2:30 PM", type: "Portfolio Review" },
                ].map((interview, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border border-border">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{interview.candidate}</p>
                      <p className="text-sm text-muted-foreground">{interview.position}</p>
                      <p className="text-xs text-muted-foreground mt-1">{interview.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{interview.time}</p>
                      <Button size="sm" variant="outline" className="mt-2 gap-1.5">
                        <Video className="w-3.5 h-3.5" />
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="section-title mb-4">Upcoming This Week</h3>
              <div className="space-y-3">
                {[
                  { candidate: "David Wilson", position: "Senior Frontend Developer", date: "Tomorrow, 11:00 AM" },
                  { candidate: "Jessica Lee", position: "UX Designer", date: "Wed, 3:00 PM" },
                  { candidate: "Michael Park", position: "Marketing Manager", date: "Thu, 10:30 AM" },
                ].map((interview, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {interview.candidate.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{interview.candidate}</p>
                        <p className="text-xs text-muted-foreground">{interview.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {interview.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
