import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Video,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Loader2,
  Edit,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department?: {
    name: string;
  };
  designation?: string;
}

export default function MeetingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [meetingsRes, employeesRes] = await Promise.all([
        meetingAPI.getAll(),
        employeeAPI.getAll({ status: "active" }),
      ]);

      setMeetings(meetingsRes.data.data.meetings || []);
      setEmployees(employeesRes.data.data.employees || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load meetings",
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

  const handleUpdateMeeting = async () => {
    if (!selectedMeeting || !formData.title || !formData.startDate || !formData.startTime) {
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

      await meetingAPI.update(selectedMeeting._id, meetingData);

      toast({
        title: "Success",
        description: "Meeting updated successfully",
      });

      setIsEditOpen(false);
      setSelectedMeeting(null);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error("Error updating meeting:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update meeting",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (meeting: Meeting) => {
    setMeetingToDelete(meeting);
    setIsDeleteOpen(true);
  };

  const handleDeleteMeeting = async () => {
    if (!meetingToDelete) return;

    try {
      setActionLoading(true);
      await meetingAPI.delete(meetingToDelete._id);

      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      });

      setIsDeleteOpen(false);
      setMeetingToDelete(null);
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting meeting:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete meeting",
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

  const openEditDialog = (meeting: Meeting) => {
    const startDate = new Date(meeting.startTime);
    const duration = Math.round((new Date(meeting.endTime).getTime() - startDate.getTime()) / 60000);

    setSelectedMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description || "",
      startDate: startDate.toISOString().split("T")[0],
      startTime: startDate.toTimeString().slice(0, 5),
      duration: duration.toString(),
      meetingType: meeting.meetingType,
      location: meeting.location || "",
      meetingLink: meeting.meetingLink || "",
      selectedAttendees: meeting.attendees.map((a) => {
        if (typeof a.employee === 'object' && a.employee !== null) {
          return (a.employee as any)._id || String(a.employee);
        }
        return String(a.employee);
      }),
    });
    setIsEditOpen(true);
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

  // Get meetings for selected day
  const getDayMeetings = (day: number) => {
    return meetings.filter((m) => {
      const meetingDate = new Date(m.startTime);
      return meetingDate.getDate() === day && meetingDate.getMonth() === currentMonth.getMonth();
    });
  };

  // Generate week days
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    const currentWeekStart = new Date(currentMonth);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      const dayMeetings = getDayMeetings(day.getDate());
      days.push({
        day: day.toLocaleDateString("en-US", { weekday: "short" }),
        date: day.getDate(),
        month: day.getMonth(),
        year: day.getFullYear(),
        isToday: day.toDateString() === today.toDateString(),
        meetings: dayMeetings.length,
      });
    }
    return days;
  };

  const weekDays = getWeekDays();
  const today = new Date().getDate();
  const defaultSelectedDay = selectedDay || weekDays.find((d) => d.isToday)?.date || weekDays[0]?.date || today;
  const selectedDayMeetings = defaultSelectedDay ? getDayMeetings(defaultSelectedDay) : [];

  useEffect(() => {
    // Set default selected day to today when component mounts
    if (!selectedDay) {
      const todayDay = weekDays.find((d) => d.isToday)?.date;
      if (todayDay) setSelectedDay(todayDay);
    }
  }, [meetings]);

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
        description="Schedule and manage team meetings"
        actions={
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
                              {employee.department && <span className="text-muted-foreground ml-2">• {employee.department.name}</span>}
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
        }
      />

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="section-title">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const prev = new Date(currentMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentMonth(prev);
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const next = new Date(currentMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentMonth(next);
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-3 mb-6">
              {weekDays.map((day, idx) => {
                const isSelected = selectedDay === day.date || (!selectedDay && day.isToday);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(day.date)}
                    className={cn(
                      "p-4 rounded-xl text-center transition-all",
                      isSelected && "bg-primary text-primary-foreground",
                      !isSelected && "hover:bg-muted cursor-pointer"
                    )}
                  >
                    <p className="text-xs font-medium mb-1">{day.day}</p>
                    <p className="text-2xl font-bold">{day.date}</p>
                    {day.meetings > 0 && (
                      <p className="text-xs mt-1 opacity-75">
                        {day.meetings} meeting{day.meetings > 1 ? "s" : ""}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
            <h4 className="font-semibold mb-4">
              {selectedDay ? `Schedule for ${formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDay).toISOString())}` : "Today's Schedule"}
            </h4>
            <div className="space-y-3">
              {selectedDayMeetings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No meetings scheduled</p>
              ) : (
                selectedDayMeetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-md transition-shadow"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary mb-0.5" />
                      <span className="text-xs font-medium text-primary">{getDuration(meeting.startTime, meeting.endTime)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{meeting.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(meeting.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {meeting.attendees.length}
                        </span>
                        {meeting.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {meeting.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {meeting.meetingLink && (
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => window.open(meeting.meetingLink, "_blank")}
                        >
                          <Video className="w-4 h-4" />
                          Join
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(meeting)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(meeting)}
                        disabled={actionLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Desktop View */}
            <div className="hidden md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>Attendees</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        No meetings scheduled
                      </td>
                    </tr>
                  ) : (
                    meetings.map((meeting) => (
                      <tr key={meeting._id}>
                        <td className="font-medium">{meeting.title}</td>
                        <td>{formatDateTime(meeting.startTime)}</td>
                        <td>{getDuration(meeting.startTime, meeting.endTime)}</td>
                        <td>
                          <span className="badge-status bg-primary/10 text-primary capitalize">
                            {meeting.meetingType}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {meeting.attendees.length}
                          </div>
                        </td>
                        <td className="text-muted-foreground">{meeting.location || meeting.meetingLink || "N/A"}</td>
                        <td>
                          <StatusBadge status={meeting.status as any} />
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {meeting.meetingLink && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 h-8"
                                onClick={() => window.open(formatExternalUrl(meeting.meetingLink), "_blank")}
                              >
                                <Video className="w-3.5 h-3.5" />
                                Join
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => openEditDialog(meeting)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(meeting)}
                              disabled={actionLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-border">
              {meetings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No meetings scheduled
                </div>
              ) : (
                meetings.map((meeting) => (
                  <div key={meeting._id} className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{meeting.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{formatDateTime(meeting.startTime)}</p>
                      </div>
                      <StatusBadge status={meeting.status as any} />
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{getDuration(meeting.startTime, meeting.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="w-4 h-4" />
                        <span className="capitalize">{meeting.meetingType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                        <Users className="w-4 h-4" />
                        <span>{meeting.attendees.length} Attendees</span>
                      </div>
                      {(meeting.location || meeting.meetingLink) && (
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{meeting.location || meeting.meetingLink}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
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
                        onClick={() => openEditDialog(meeting)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(meeting)}
                        disabled={actionLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setSelectedMeeting(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>Update meeting details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-title">Meeting Title *</Label>
              <Input
                id="edit-title"
                placeholder="Enter meeting title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Date *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-startTime">Time *</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
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
                <Label htmlFor="edit-meetingType">Meeting Type</Label>
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
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  placeholder="Room or location..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            )}
            {(formData.meetingType === "virtual" || formData.meetingType === "hybrid") && (
              <div>
                <Label htmlFor="edit-meetingLink">Video Call Link</Label>
                <Input
                  id="edit-meetingLink"
                  placeholder="https://meet.google.com/..."
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-description">Description / Agenda</Label>
              <Textarea
                id="edit-description"
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
                          id={`edit-attendee-${employee._id}`}
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
                          htmlFor={`edit-attendee-${employee._id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {employee.firstName} {employee.lastName} ({employee.employeeId})
                          {employee.department && <span className="text-muted-foreground ml-2">• {employee.department.name}</span>}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button onClick={handleUpdateMeeting} disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Meeting"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => {
        setIsDeleteOpen(open);
        if (!open) {
          setMeetingToDelete(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <DialogTitle>Delete Meeting</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete this meeting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {meetingToDelete && (
            <div className="py-4 space-y-2">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="font-semibold text-sm text-foreground mb-1">{meetingToDelete.title}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(meetingToDelete.startTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(meetingToDelete.startTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {meetingToDelete.attendees.length} attendee{meetingToDelete.attendees.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                All attendees will be notified that this meeting has been cancelled.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setMeetingToDelete(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMeeting}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Meeting
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
