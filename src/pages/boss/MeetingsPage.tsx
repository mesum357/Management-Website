import { useState } from "react";
import {
  Calendar,
  Plus,
  Video,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  Link,
  MapPin,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  attendees: number;
  location: string;
  videoLink?: string;
}

const meetings: Meeting[] = [
  { id: "1", title: "Q4 Business Review", date: "Dec 10", time: "10:00 AM", duration: "2h", type: "Board", attendees: 12, location: "Conference Room A", videoLink: "https://meet.google.com/abc-defg-hij" },
  { id: "2", title: "Product Strategy Session", date: "Dec 10", time: "2:00 PM", duration: "1.5h", type: "Strategy", attendees: 8, location: "Virtual" },
  { id: "3", title: "Budget Planning FY2025", date: "Dec 10", time: "4:30 PM", duration: "1h", type: "Finance", attendees: 5, location: "Executive Suite" },
  { id: "4", title: "Investor Call", date: "Dec 11", time: "9:00 AM", duration: "1h", type: "External", attendees: 6, location: "Virtual" },
  { id: "5", title: "HR Policy Review", date: "Dec 11", time: "11:00 AM", duration: "45m", type: "Internal", attendees: 4, location: "HR Office" },
  { id: "6", title: "Department Heads Sync", date: "Dec 12", time: "3:00 PM", duration: "1h", type: "Management", attendees: 10, location: "Main Boardroom" },
];

const interviews = [
  { id: "1", candidate: "Alex Thompson", position: "VP Engineering", date: "Dec 10", time: "11:30 AM", round: "Final" },
  { id: "2", candidate: "Sarah Mitchell", position: "Head of Design", date: "Dec 10", time: "3:00 PM", round: "Technical" },
  { id: "3", candidate: "John Martinez", position: "CFO", date: "Dec 11", time: "10:00 AM", round: "Final" },
];

const weekDays = [
  { day: "Mon", date: 9, meetings: 2 },
  { day: "Tue", date: 10, meetings: 5, today: true },
  { day: "Wed", date: 11, meetings: 3 },
  { day: "Thu", date: 12, meetings: 2 },
  { day: "Fri", date: 13, meetings: 1 },
  { day: "Sat", date: 14, meetings: 0 },
  { day: "Sun", date: 15, meetings: 0 },
];

export default function MeetingsPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(10);

  const todaysMeetings = meetings.filter((m) => m.date === "Dec 10");

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Meetings & Interviews"
        description="Manage your schedule and appointments"
        actions={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule New Meeting</DialogTitle>
                <DialogDescription>
                  Schedule a new meeting with team members.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Meeting Title</label>
                  <Input placeholder="Enter meeting title..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Time</label>
                    <Input type="time" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Duration</label>
                    <Select defaultValue="1h">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30m">30 minutes</SelectItem>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="1.5h">1.5 hours</SelectItem>
                        <SelectItem value="2h">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select defaultValue="internal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                        <SelectItem value="board">Board Meeting</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input placeholder="Room or virtual link..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Video Call Link (Optional)</label>
                  <Input placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Notes</label>
                  <Textarea placeholder="Meeting agenda or notes..." />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Schedule Meeting</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Week View */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="section-title">December 2024</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Today
                  </Button>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-3 mb-6">
                {weekDays.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDay(day.date)}
                    className={cn(
                      "p-4 rounded-xl text-center transition-all",
                      day.today && selectedDay === day.date
                        ? "bg-primary text-primary-foreground"
                        : selectedDay === day.date
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
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
                ))}
              </div>

              {/* Today's Schedule */}
              <h4 className="font-semibold mb-4">Dec {selectedDay} Schedule</h4>
              <div className="space-y-3">
                {todaysMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:shadow-md transition-shadow"
                  >
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary mb-0.5" />
                      <span className="text-xs font-medium text-primary">{meeting.duration}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{meeting.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {meeting.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {meeting.attendees}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {meeting.location}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {meeting.videoLink && (
                        <Button size="sm" className="gap-1.5">
                          <Video className="w-4 h-4" />
                          Join
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="section-title mb-4">This Week</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Meetings</span>
                    <span className="font-semibold">13</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Interviews</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Board Meetings</span>
                    <span className="font-semibold">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">External Calls</span>
                    <span className="font-semibold">2</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="section-title mb-4">Upcoming Interviews</h3>
                <div className="space-y-4">
                  {interviews.slice(0, 2).map((interview) => (
                    <div key={interview.id} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{interview.candidate}</p>
                        <p className="text-xs text-muted-foreground">{interview.position}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {interview.date} • {interview.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Meeting</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Attendees</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting) => (
                  <tr key={meeting.id}>
                    <td className="font-medium">{meeting.title}</td>
                    <td>
                      {meeting.date} • {meeting.time}
                    </td>
                    <td>{meeting.duration}</td>
                    <td>
                      <span className="badge-status bg-primary/10 text-primary">{meeting.type}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {meeting.attendees}
                      </div>
                    </td>
                    <td className="text-muted-foreground">{meeting.location}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {meeting.location === "Virtual" && (
                          <Button size="sm" variant="outline" className="gap-1 h-8">
                            <Video className="w-3.5 h-3.5" />
                            Join
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8">
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="interviews">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position</th>
                  <th>Date & Time</th>
                  <th>Round</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((interview) => (
                  <tr key={interview.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {interview.candidate.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="font-medium">{interview.candidate}</span>
                      </div>
                    </td>
                    <td>{interview.position}</td>
                    <td>
                      {interview.date} • {interview.time}
                    </td>
                    <td>
                      <span className="badge-status bg-warning/10 text-warning">{interview.round}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="gap-1 h-8">
                          <Video className="w-3.5 h-3.5" />
                          Join
                        </Button>
                        <Button size="sm" variant="outline" className="h-8">
                          View Profile
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
