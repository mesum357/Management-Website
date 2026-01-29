import { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Calendar,
  Eye,
  FileText,
  Trash2,
  Edit,
  Send,
  Clock,
  Users,
  Building,
  Loader2,
  AlertCircle,
  RefreshCw,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { noticeAPI, departmentAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Notice {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  targetAudience: string;
  departments?: Array<{ _id: string; name: string }>;
  publishedBy?: { _id: string; email: string; role?: string };
  publishedAt: string;
  expiresAt?: string;
  isPinned: boolean;
  isActive: boolean;
  readBy?: Array<{ user: any }>;
}

interface Department {
  _id: string;
  name: string;
}

const statusConfig = {
  published: { label: "Published", color: "bg-success/10 text-success" },
  scheduled: { label: "Scheduled", color: "bg-warning/10 text-warning" },
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
};

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "urgent", label: "Urgent" },
  { value: "hr", label: "HR" },
  { value: "event", label: "Event" },
  { value: "policy", label: "Policy" },
  { value: "holiday", label: "Holiday" },
  { value: "other", label: "Other" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function BossNoticesPage() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deletingNoticeId, setDeletingNoticeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    priority: "medium",
    targetAudience: "all",
    departments: [] as string[],
    isPinned: false,
    expiresAt: "",
    status: "published",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all notices and filter for boss-created ones
      const [noticesRes, deptRes] = await Promise.all([
        noticeAPI.getAll({ isActive: "all", limit: 100 }),
        departmentAPI.getAll(),
      ]);

      const fetchedNotices = noticesRes.data.data.notices || [];
      // Filter to show only notices created by boss/admin users
      const bossNotices = fetchedNotices.filter(
        (notice: Notice) => notice.publishedBy?.role === "boss" || notice.publishedBy?.role === "admin" || user?.id === (notice.publishedBy as any)?._id
      );
      setNotices(bossNotices);
      setDepartments(deptRes.data.data.departments || []);
      console.log('Fetched departments:', deptRes.data.data.departments?.length, deptRes.data.data.departments);
      console.log('Fetched boss notices:', bossNotices.length, bossNotices);
    } catch (err: any) {
      console.error("Error fetching notices:", err);
      setError(err.response?.data?.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "general",
      priority: "medium",
      targetAudience: "all",
      departments: [],
      isPinned: false,
      expiresAt: "",
      status: "published",
    });
  };

  const handleCreateNotice = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Please fill in title and content");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const noticeData: any = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        priority: formData.priority,
        targetAudience: formData.targetAudience,
        isPinned: formData.isPinned,
      };

      if (formData.targetAudience === "specific-department" && formData.departments.length > 0) {
        noticeData.departments = formData.departments;
      }

      if (formData.status === "scheduled" && formData.expiresAt) {
        noticeData.publishedAt = new Date(formData.expiresAt);
      }

      if (formData.status === "draft") {
        noticeData.isActive = false;
      }

      const response = await noticeAPI.create(noticeData);

      if (response.data.success) {
        setSuccessMessage("Notice created successfully!");
        setIsCreateOpen(false);
        resetForm();
        await fetchData();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error("Error creating notice:", err);
      setError(err.response?.data?.message || "Failed to create notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (notice: Notice) => {
    setEditingNotice(notice);

    let status = "published";
    if (!notice.isActive) {
      status = "draft";
    } else if (notice.publishedAt && new Date(notice.publishedAt) > new Date()) {
      status = "scheduled";
    }

    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      targetAudience: notice.targetAudience,
      departments: notice.departments
        ? (notice.departments as any[]).map((d) => (typeof d === "object" ? d._id : d))
        : [],
      isPinned: notice.isPinned,
      expiresAt: notice.expiresAt ? new Date(notice.expiresAt).toISOString().split('T')[0] : "",
      status: status,
    });
    console.log('Editing notice, initial formData:', { ...formData, status });

    setIsEditOpen(true);
  };

  const handleUpdateNotice = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Please fill in title and content");
      return;
    }

    if (!editingNotice) return;

    try {
      setSubmitting(true);
      setError(null);

      const noticeData: any = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        priority: formData.priority,
        targetAudience: formData.targetAudience,
        isPinned: formData.isPinned,
      };

      if (formData.targetAudience === "specific-department" && formData.departments.length > 0) {
        noticeData.departments = formData.departments;
      } else {
        noticeData.departments = [];
      }

      if (formData.status === "draft") {
        noticeData.isActive = false;
      } else {
        noticeData.isActive = true;
        if (formData.status === "scheduled" && formData.expiresAt) {
          noticeData.publishedAt = new Date(formData.expiresAt);
        }
      }

      const response = await noticeAPI.update(editingNotice._id, noticeData);

      if (response.data.success) {
        setSuccessMessage("Notice updated successfully!");
        setIsEditOpen(false);
        setEditingNotice(null);
        resetForm();
        await fetchData();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error("Error updating notice:", err);
      setError(err.response?.data?.message || "Failed to update notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (noticeId: string) => {
    setDeletingNoticeId(noticeId);
    setIsDeleteOpen(true);
  };

  const handleDeleteNotice = async () => {
    if (!deletingNoticeId) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await noticeAPI.delete(deletingNoticeId);

      if (response.data.success) {
        setSuccessMessage("Notice deleted successfully");
        setIsDeleteOpen(false);
        setDeletingNoticeId(null);
        setNotices(prevNotices => prevNotices.filter(n => n._id !== deletingNoticeId));
        await fetchData();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error("Error deleting notice:", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Failed to delete notice";
      setError(errorMsg);
      setIsDeleteOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatus = (notice: Notice) => {
    if (!notice.isActive) return "draft";
    if (notice.publishedAt && new Date(notice.publishedAt) > new Date()) {
      return "scheduled";
    }
    return "published";
  };

  const getReadCount = (notice: Notice) => {
    return notice.readBy?.length || 0;
  };

  const publishedNotices = notices.filter((n) => getStatus(n) === "published");
  const scheduledNotices = notices.filter((n) => getStatus(n) === "scheduled");
  const draftNotices = notices.filter((n) => getStatus(n) === "draft");

  const renderNoticeForm = (isEdit: boolean = false) => (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="Announcement title..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">
          Content <span className="text-destructive">*</span>
        </label>
        <Textarea
          placeholder="Write your announcement..."
          className="min-h-[150px]"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {categoryOptions.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {priorityOptions.map((pri) => (
                <SelectItem key={pri.value} value={pri.value}>
                  {pri.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Target Audience</label>
          <Select
            value={formData.targetAudience}
            onValueChange={(value) =>
              setFormData({ ...formData, targetAudience: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All Employees</SelectItem>
              <SelectItem value="employees">Employees Only</SelectItem>
              <SelectItem value="managers">Managers Only</SelectItem>
              <SelectItem value="hr">HR Only</SelectItem>
              <SelectItem value="specific-department">Specific Department</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="published">Publish Now</SelectItem>
              <SelectItem value="scheduled">Schedule for Later</SelectItem>
              <SelectItem value="draft">Save as Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {formData.targetAudience === "specific-department" && (
        <div>
          <label className="text-sm font-medium mb-2 block">Departments</label>
          <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
            {departments.map((dept) => (
              <label key={dept._id} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={formData.departments.includes(dept._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        departments: [...formData.departments, dept._id],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        departments: formData.departments.filter((id) => id !== dept._id),
                      });
                    }
                  }}
                  className="rounded border-border"
                />
                <span>{dept.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {formData.status === "scheduled" && (
        <div>
          <label className="text-sm font-medium mb-2 block">Schedule Date</label>
          <Input
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          />
        </div>
      )}
      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Pin to Top</label>
          <p className="text-xs text-muted-foreground">
            Keep this notice at the top of the board
          </p>
        </div>
        <input
          type="checkbox"
          checked={formData.isPinned}
          onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
          className="rounded border-border"
        />
      </div>
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Executive Notices"
        description="Broadcast important announcements to your organization"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                resetForm();
                setError(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Executive Announcement</DialogTitle>
                  <DialogDescription>
                    Create an executive announcement to share with all employees.
                  </DialogDescription>
                </DialogHeader>
                {renderNoticeForm(false)}
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateNotice}
                    disabled={submitting || !formData.title.trim() || !formData.content.trim()}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {formData.status === "draft" ? "Save Draft" : "Publish Notice"}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setEditingNotice(null);
          resetForm();
          setError(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update announcement details and settings.
            </DialogDescription>
          </DialogHeader>
          {renderNoticeForm(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditOpen(false);
              setEditingNotice(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateNotice}
              disabled={submitting || !formData.title.trim() || !formData.content.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Notice"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => {
        setIsDeleteOpen(open);
        if (!open) {
          setDeletingNoticeId(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete Notice
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteOpen(false);
              setDeletingNoticeId(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteNotice}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && !isCreateOpen && !isEditOpen && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-success/10 border border-success/20 rounded-lg p-4 flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-success" />
          <p className="text-success">{successMessage}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Megaphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="metric-label">Total Announcements</p>
              <p className="metric-value">{notices.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <Eye className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="metric-label">Total Views</p>
              <p className="metric-value">
                {notices.reduce((sum, n) => sum + getReadCount(n), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="metric-label">Scheduled</p>
              <p className="metric-value">{scheduledNotices.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="metric-label">Drafts</p>
              <p className="metric-value">{draftNotices.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No announcements yet</h3>
          <p className="text-muted-foreground">Create your first announcement to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices
            .sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
            })
            .map((notice) => {
              const status = getStatus(notice);
              const readCount = getReadCount(notice);
              const departmentNames =
                notice.departments?.map((d) => (typeof d === "object" ? d.name : d)).join(", ") ||
                "All";

              return (
                <div
                  key={notice._id}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                        <Megaphone className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{notice.title}</h3>
                          <span className={cn("badge-status", statusConfig[status].color)}>
                            {statusConfig[status].label}
                          </span>
                          {notice.isPinned && (
                            <span className="badge-status bg-warning/10 text-warning">Pinned</span>
                          )}
                        </div>
                        <p className="text-muted-foreground line-clamp-2 mb-3">{notice.content}</p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-4 h-4" />
                            {departmentNames}
                          </div>
                          {notice.publishedBy && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {notice.publishedBy.email}
                            </div>
                          )}
                          {status === "published" && (
                            <>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {formatDate(notice.publishedAt)}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4" />
                                {readCount} views
                              </div>
                            </>
                          )}
                          {status === "scheduled" && notice.expiresAt && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              Scheduled: {formatDate(notice.expiresAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handleEditClick(notice)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(notice._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
