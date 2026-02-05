import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Video,
  Users,
  Clock,
  MapPin,
  Loader2,
  RefreshCw,
  ExternalLink,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatExternalUrl } from "@/lib/utils";
import { meetingAPI, employeeAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingType: "in-person" | "virtual" | "hybrid";
  meetingLink?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "postponed";
  organizer: {
    _id: string;
    email: string;
  };
  attendees: Array<{
    employee: {
      _id: string;
      firstName: string;
      lastName: string;
      employeeId: string;
    };
    status: "pending" | "accepted" | "declined" | "tentative";
  }>;
  createdAt: string;
}

export default function MeetingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    duration: "60",
    meetingType: "in-person" as "in-person" | "virtual" | "hybrid",
    location: "",
    meetingLink: "",
    selectedAttendees: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;

      const [meetingsRes, employeesRes] = await Promise.all([
        meetingAPI.getAll(params),
        employeeAPI.getAll({ status: "active" }),
      ]);

      let fetchedMeetings = meetingsRes.data.data.meetings || [];
      if (typeFilter !== "all") {
        fetchedMeetings = fetchedMeetings.filter((m: Meeting) => m.meetingType === typeFilter);
      }

      setMeetings(fetchedMeetings);
      setEmployees(employeesRes.data.data.employees || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!formData.title || !formData.startDate || !formData.startTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(true);

      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(formData.duration));

      const meetingData = {
        title: formData.title,
        description: formData.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        meetingType: formData.meetingType,
        location: formData.location || undefined,
        meetingLink: formData.meetingLink || undefined,
        attendees: formData.selectedAttendees.map((empId) => ({
          employee: empId,
          status: "pending",
        })),
      };

      await meetingAPI.create(meetingData);

      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });

      setIsAddOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create meeting",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      duration: "60",
      meetingType: "in-person",
      location: "",
      meetingLink: "",
      selectedAttendees: [],
    });
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTime = (dateString: string) => {
    return `${formatDate(dateString)} • ${formatTime(dateString)}`;
  };

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleViewMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setViewDialogOpen(true);
  };

  const getResponseCounts = (meeting: Meeting) => {
    const accepted = meeting.attendees.filter((a) => a.status === "accepted").length;
    const declined = meeting.attendees.filter((a) => a.status === "declined").length;
    const pending = meeting.attendees.filter((a) => a.status === "pending").length;
    return { accepted, declined, pending };
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
        title="Meetings"
        description="View and schedule team meetings"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={resetForm}>
                  <Plus className="w-4 h-4" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule New Meeting</DialogTitle>
                  <DialogDescription>Schedule a new meeting with team members.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Meeting Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter meeting title..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="startTime">Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Select
                        value={formData.duration}
                        onValueChange={(value) => setFormData({ ...formData, duration: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="meetingType">Meeting Type</Label>
                      <Select
                        value={formData.meetingType}
                        onValueChange={(value: any) => setFormData({ ...formData, meetingType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="in-person">In-Person</SelectItem>
                          <SelectItem value="virtual">Virtual</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formData.meetingType !== "virtual" && (
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Room or location..."
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                  )}
                  {(formData.meetingType === "virtual" || formData.meetingType === "hybrid") && (
                    <div>
                      <Label htmlFor="meetingLink">Video Call Link</Label>
                      <Input
                        id="meetingLink"
                        placeholder="https://meet.google.com/..."
                        value={formData.meetingLink}
                        onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="description">Description / Agenda</Label>
                    <Textarea
                      id="description"
                      placeholder="Meeting agenda or notes..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Select Attendees</Label>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto mt-2">
                      {employees.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No employees available</p>
                      ) : (
                        <div className="space-y-2">
                          {employees.map((employee) => (
                            <div key={employee._id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`attendee-${employee._id}`}
                                checked={formData.selectedAttendees.includes(employee._id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      selectedAttendees: [...formData.selectedAttendees, employee._id],
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      selectedAttendees: formData.selectedAttendees.filter((id) => id !== employee._id),
                                    });
                                  }
                                }}
                              />
                              <label
                                htmlFor={`attendee-${employee._id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {employee.firstName} {employee.lastName} ({employee.employeeId})
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={actionLoading}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateMeeting} disabled={actionLoading}>
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Schedule Meeting
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in-person">In-Person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Meeting
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Attendees
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {meetings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No meetings found</p>
                  </td>
                </tr>
              ) : (
                meetings.map((meeting) => {
                  const responseCounts = getResponseCounts(meeting);
                  return (
                    <tr
                      key={meeting._id}
                      className="hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => handleViewMeeting(meeting)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{meeting.title}</p>
                          {meeting.organizer && (
                            <p className="text-xs text-muted-foreground">Organized by: {meeting.organizer.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{formatDateTime(meeting.startTime)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{getDuration(meeting.startTime, meeting.endTime)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                          {meeting.meetingType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{meeting.attendees.length}</span>
                          {responseCounts.accepted > 0 && (
                            <span className="text-xs text-success">({responseCounts.accepted} accepted)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {meeting.location || meeting.meetingLink || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={meeting.status as any} />
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {meeting.meetingLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(formatExternalUrl(meeting.meetingLink), "_blank")}
                            >
                              <Video className="w-4 h-4 mr-1" />
                              Join
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleViewMeeting(meeting)}>
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-border">
          {meetings.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No meetings found</p>
            </div>
          ) : (
            meetings.map((meeting) => {
              const responseCounts = getResponseCounts(meeting);
              return (
                <div
                  key={meeting._id}
                  className="p-4 space-y-4 hover:bg-secondary/10 transition-colors"
                  onClick={() => handleViewMeeting(meeting)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{meeting.title}</h4>
                      {meeting.organizer && (
                        <p className="text-xs text-muted-foreground mt-0.5">By: {meeting.organizer.email}</p>
                      )}
                    </div>
                    <StatusBadge status={meeting.status as any} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Date & Time</span>
                      <span>{formatDateTime(meeting.startTime)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Duration</span>
                      <span>{getDuration(meeting.startTime, meeting.endTime)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Type</span>
                      <span className="capitalize">{meeting.meetingType}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Attendees</span>
                      <div className="flex items-center gap-1">
                        <span>{meeting.attendees.length}</span>
                        {responseCounts.accepted > 0 && (
                          <span className="text-xs text-success">({responseCounts.accepted} ok)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Location</span>
                      <span className="truncate">{meeting.location || meeting.meetingLink || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    {meeting.meetingLink && (
                      <Button
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => window.open(formatExternalUrl(meeting.meetingLink), "_blank")}
                      >
                        <Video className="w-4 h-4" />
                        Join
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewMeeting(meeting)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* View Meeting Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedMeeting?.title}
            </DialogTitle>
            <DialogDescription>{formatDateTime(selectedMeeting?.startTime || "")}</DialogDescription>
          </DialogHeader>

          {selectedMeeting && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Time</label>
                  <p className="font-medium">{formatDateTime(selectedMeeting.startTime)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Time</label>
                  <p className="font-medium">{formatDateTime(selectedMeeting.endTime)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duration</label>
                  <p className="font-medium">{getDuration(selectedMeeting.startTime, selectedMeeting.endTime)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={selectedMeeting.status as any} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="font-medium capitalize">{selectedMeeting.meetingType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organizer</label>
                  <p className="font-medium">{selectedMeeting.organizer?.email}</p>
                </div>
                {selectedMeeting.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="font-medium">{selectedMeeting.location}</p>
                  </div>
                )}
                {selectedMeeting.meetingLink && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Meeting Link</label>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={selectedMeeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {selectedMeeting.meetingLink}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {selectedMeeting.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedMeeting.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Attendees ({selectedMeeting.attendees.length})
                </label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  <div className="space-y-3">
                    {selectedMeeting.attendees.map((attendee, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {attendee.employee.firstName} {attendee.employee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{attendee.employee.employeeId}</p>
                        </div>
                        <StatusBadge
                          status={
                            attendee.status === "accepted"
                              ? "approved"
                              : attendee.status === "declined"
                                ? "rejected"
                                : ("pending" as any)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedMeeting?.meetingLink && (
              <Button onClick={() => window.open(selectedMeeting.meetingLink, "_blank")}>
                <Video className="w-4 h-4 mr-2" />
                Join Meeting
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
