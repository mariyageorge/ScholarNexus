import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FolderKanban,
  FileText,
  Megaphone,
  BarChart3,
  History,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Edit3,
  Eye,
  Archive,
  Download,
  RefreshCcw,
  Lock,
  Mail,
  User,
  Globe,
  FileSpreadsheet,
  FileText as FilePdfIcon,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Check,
  Ban,
  Key,
  Bell,
  CheckSquare,
  FileCode,
  Sliders,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, setUserSession, type UserSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — ScholarNexus AI" },
      { name: "description", content: "Enterprise Research Management Portal, User Governance, Faculty Approvals & System Analytics." },
    ],
  }),
  component: AdminPage,
});

/* ── Interfaces ── */
interface AdminStats {
  totalStudents: number;
  totalFaculty: number;
  totalProjects: number;
  totalPapers: number;
  pendingFacultyApprovals: number;
  activeUsers: number;
  userGrowth: { month: string; students: number; faculty: number }[];
  projectStatus: { name: string; value: number }[];
  researchDomains: { domain: string; count: number }[];
  monthlyPapers: { month: string; papers: number }[];
}

interface UserItem {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Pending" | "Suspended" | "Rejected";
  createdAt: string;
  displayName?: string;
  affiliation?: string;
  bio?: string;
  department?: string;
  degree?: string;
  credentials?: string;
  researchInterests?: string;
}

interface FacultyRequest extends UserItem {
  approvalDate?: string;
  approvedBy?: string;
  approvalReason?: string;
}

interface ProjectItem {
  id: string;
  _id?: string;
  userEmail: string;
  title: string;
  description: string;
  domain: string;
  status: "Planning" | "In Progress" | "Under Review" | "Completed" | "On Hold";
  progress: number;
  startDate: string;
  expectedCompletionDate: string;
  faculty?: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

interface PaperItem {
  id: string;
  _id?: string;
  title: string;
  authors: string;
  domain: string;
  summary: string;
  uploaderEmail: string;
  fileSize?: string;
  createdAt: string;
}

interface AnnouncementItem {
  id: string;
  _id?: string;
  title: string;
  content: string;
  targetAudience: "All" | "Students" | "Faculty";
  priority: "Low" | "Normal" | "High" | "Urgent";
  pinned: boolean;
  published: boolean;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLogItem {
  id: string;
  _id?: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  userRole: string;
  actionType: "USER_MANAGEMENT" | "FACULTY_APPROVAL" | "PROJECT_ACTION" | "PAPER_ACTION" | "ANNOUNCEMENT" | "SYSTEM_SETTING" | "SECURITY";
  description: string;
  details?: string;
  ipAddress?: string;
}

const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#6366F1", "#EC4899"];

function AdminPage() {
  const [session, setSession] = useState<UserSession | null>(() => getUserSession());
  const hash = useRouterState({ select: (s) => s.location.hash });
  
  // Determine active tab from URL hash
  const activeTab = useMemo(() => {
    const cleanHash = hash ? hash.replace("#", "") : "dashboard";
    const validTabs = ["dashboard", "users", "approvals", "projects", "papers", "announcements", "reports", "activity", "settings"];
    return validTabs.includes(cleanHash) ? cleanHash : "dashboard";
  }, [hash]);

  // Dynamic Data States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [facultyApprovals, setFacultyApprovals] = useState<FacultyRequest[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [papers, setPapers] = useState<PaperItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Pagination States
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [userStatusFilter, setUserStatusFilter] = useState("All");
  const [userPage, setUserPage] = useState(1);

  const [approvalTab, setApprovalTab] = useState<"Pending" | "Approved" | "Rejected">("Pending");

  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");
  const [projectDomainFilter, setProjectDomainFilter] = useState("All");

  const [paperSearch, setPaperSearch] = useState("");
  const [paperDomainFilter, setPaperDomainFilter] = useState("All");

  const [logSearch, setLogSearch] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("All");

  // Dialog & Modal States
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [viewUserModalOpen, setViewUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({ name: "", email: "", role: "student", status: "Active", affiliation: "", department: "", bio: "" });

  const [selectedFaculty, setSelectedFaculty] = useState<FacultyRequest | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("");

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [viewProjectModalOpen, setViewProjectModalOpen] = useState(false);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);

  const [selectedPaper, setSelectedPaper] = useState<PaperItem | null>(null);
  const [viewPaperModalOpen, setViewPaperModalOpen] = useState(false);
  const [deletePaperModalOpen, setDeletePaperModalOpen] = useState(false);

  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    targetAudience: "All" as "All" | "Students" | "Faculty",
    priority: "Normal" as "Low" | "Normal" | "High" | "Urgent",
    pinned: false,
    published: true,
  });

  const [reportSubTab, setReportSubTab] = useState("students");

  // Admin Settings Form
  const [adminProfile, setAdminProfile] = useState({
    name: session?.displayName ?? session?.name ?? "Enterprise Admin",
    email: session?.email ?? "admin@scholarnexus.ai",
    title: "Lead System Administrator",
  });
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
  const [notifications, setNotifications] = useState({ emailApprovals: true, securityAlerts: true, weeklyReport: true });

  // Refresh Session Listener
  useEffect(() => {
    const handleSessionUpdate = () => setSession(getUserSession());
    window.addEventListener("scholarnexus-session-updated", handleSessionUpdate);
    return () => window.removeEventListener("scholarnexus-session-updated", handleSessionUpdate);
  }, []);

  // Fetch Admin Data
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, approvalsRes, projectsRes, papersRes, annRes, logsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/faculty/approval?status=All"),
        fetch("/api/admin/projects"),
        fetch("/api/admin/papers"),
        fetch("/api/admin/announcements"),
        fetch("/api/admin/activity-logs"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (approvalsRes.ok) setFacultyApprovals(await approvalsRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (papersRes.ok) setPapers(await papersRes.json());
      if (annRes.ok) setAnnouncements(await annRes.json());
      if (logsRes.ok) setActivityLogs(await logsRes.json());
    } catch (err) {
      console.error("Failed to load admin data:", err);
      toast.error("Failed to sync admin portal with backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.role === "admin") {
      fetchAdminData();
    }
  }, [session]);

  // Demo Switch Handler for testing
  const handleEnableDemoAdmin = () => {
    const demoAdmin: UserSession = {
      email: "admin@scholarnexus.ai",
      name: "Enterprise Admin",
      role: "admin",
      profileCompleted: true,
      displayName: "Dr. Admin Workspace",
      affiliation: "ScholarNexus Central Administration",
    };
    setUserSession(demoAdmin);
    setSession(demoAdmin);
    toast.success("Switched to Admin Session. Admin console unlocked!");
  };

  /* ── User Management Actions ── */
  const handleOpenEditUser = (u: UserItem) => {
    setSelectedUser(u);
    setEditUserData({
      name: u.name || u.displayName || "",
      email: u.email,
      role: u.role,
      status: u.status || "Active",
      affiliation: u.affiliation || "",
      department: u.department || "",
      bio: u.bio || "",
    });
    setEditUserModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedUser.id, ...editUserData }),
      });
      if (res.ok) {
        toast.success(`User ${editUserData.email} updated successfully.`);
        setEditUserModalOpen(false);
        fetchAdminData();
      } else {
        toast.error("Failed to update user.");
      }
    } catch {
      toast.error("Network error updating user.");
    }
  };

  const handleToggleSuspendUser = async (u: UserItem) => {
    const newStatus = u.status === "Suspended" ? "Active" : "Suspended";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, email: u.email, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`User status changed to ${newStatus}.`);
        fetchAdminData();
      }
    } catch {
      toast.error("Error updating user status.");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedUser.id, email: selectedUser.email }),
      });
      if (res.ok) {
        toast.success(`User ${selectedUser.email} deleted.`);
        setDeleteUserModalOpen(false);
        fetchAdminData();
      }
    } catch {
      toast.error("Error deleting user.");
    }
  };

  /* ── Faculty Approval Actions ── */
  const handleProcessFaculty = async () => {
    if (!selectedFaculty) return;
    try {
      const res = await fetch("/api/admin/faculty/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFaculty.id,
          email: selectedFaculty.email,
          action: approvalAction,
          reason: approvalAction === "reject" ? rejectionReason : undefined,
        }),
      });
      if (res.ok) {
        toast.success(`Faculty application ${approvalAction === "approve" ? "Approved" : "Rejected"}.`);
        setApprovalModalOpen(false);
        setRejectionReason("");
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to process faculty application.");
    }
  };

  /* ── Project Actions ── */
  const handleArchiveProject = async (p: ProjectItem) => {
    try {
      const res = await fetch("/api/admin/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, action: "archive" }),
      });
      if (res.ok) {
        toast.success(`Project "${p.title}" archived.`);
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to archive project.");
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch("/api/admin/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedProject.id }),
      });
      if (res.ok) {
        toast.success("Project deleted successfully.");
        setDeleteProjectModalOpen(false);
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to delete project.");
    }
  };

  /* ── Paper Actions ── */
  const handleDownloadPaper = (p: PaperItem) => {
    const blob = new Blob([`ScholarNexus AI Paper Reference\nTitle: ${p.title}\nAuthors: ${p.authors}\nDomain: ${p.domain}\nSummary: ${p.summary}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    a.click();
    toast.success(`Downloading paper: ${p.title}`);
  };

  const handleDeletePaper = async () => {
    if (!selectedPaper) return;
    try {
      const res = await fetch("/api/admin/papers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPaper.id }),
      });
      if (res.ok) {
        toast.success("Paper record deleted.");
        setDeletePaperModalOpen(false);
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to delete paper.");
    }
  };

  /* ── Announcement Actions ── */
  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.error("Please fill in both Announcement Title and Content.");
      return;
    }
    try {
      const method = editingAnnouncement ? "PUT" : "POST";
      const payload = editingAnnouncement ? { id: editingAnnouncement.id, ...announcementForm } : announcementForm;
      const res = await fetch("/api/admin/announcements", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editingAnnouncement ? "Announcement updated." : "New announcement published.");
        setAnnouncementModalOpen(false);
        setEditingAnnouncement(null);
        setAnnouncementForm({ title: "", content: "", targetAudience: "All", priority: "Normal", pinned: false, published: true });
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to save announcement.");
    }
  };

  const handleTogglePublishAnnouncement = async (a: AnnouncementItem) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, published: !a.published }),
      });
      if (res.ok) {
        toast.success(`Announcement ${!a.published ? "published" : "unpublished"}.`);
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to update publish state.");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Announcement deleted.");
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to delete announcement.");
    }
  };

  const handlePurgeMockData = async () => {
    try {
      const res = await fetch("/api/admin/purge-mock-data", { method: "POST" });
      if (res.ok) {
        toast.success("All mock data successfully purged from database.");
        fetchAdminData();
      }
    } catch {
      toast.error("Failed to purge mock data.");
    }
  };

  /* ── Export Handlers ── */
  const handleExportReport = (type: "pdf" | "excel") => {
    const filename = `ScholarNexus_${reportSubTab}_report_${new Date().toISOString().split("T")[0]}.${type === "pdf" ? "pdf" : "xlsx"}`;
    toast.success(`Exporting ${reportSubTab.toUpperCase()} report as ${type.toUpperCase()} (${filename})`);
  };

  /* ── RBAC Protection Guard ── */
  if (!session || session.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Console Access Restricted</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You are currently logged in as <span className="font-semibold text-foreground">{session?.email ?? "Guest"}</span> ({session?.role ?? "No Role"}). Access to the enterprise administration module requires Administrator credentials.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={() => (window.location.href = "/login")} className="gap-2 rounded-xl">
              <Lock className="h-4 w-4" />
              Log In as Administrator
            </Button>
            <Button onClick={handleEnableDemoAdmin} className="gap-2 rounded-xl gradient-brand text-primary-foreground shadow-md">
              <Sparkles className="h-4 w-4" />
              Enable Demo Admin Mode
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ── Filtered User List ── */
  const filteredUsers = users.filter((u) => {
    const matchSearch = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()) || (u.affiliation && u.affiliation.toLowerCase().includes(userSearch.toLowerCase()));
    const matchRole = userRoleFilter === "All" || u.role.toLowerCase() === userRoleFilter.toLowerCase();
    const matchStatus = userStatusFilter === "All" || (u.status || "Active") === userStatusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const itemsPerPage = 6;
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);

  /* ── Filtered Faculty Requests ── */
  const filteredApprovals = facultyApprovals.filter((f) => f.status === approvalTab);

  /* ── Filtered Projects ── */
  const filteredProjects = projects.filter((p) => {
    const matchSearch = !projectSearch || p.title.toLowerCase().includes(projectSearch.toLowerCase()) || p.userEmail.toLowerCase().includes(projectSearch.toLowerCase()) || (p.faculty && p.faculty.toLowerCase().includes(projectSearch.toLowerCase()));
    const matchStatus = projectStatusFilter === "All" || p.status === projectStatusFilter;
    const matchDomain = projectDomainFilter === "All" || p.domain === projectDomainFilter;
    return matchSearch && matchStatus && matchDomain;
  });

  /* ── Filtered Papers ── */
  const filteredPapers = papers.filter((p) => {
    const matchSearch = !paperSearch || p.title.toLowerCase().includes(paperSearch.toLowerCase()) || p.authors.toLowerCase().includes(paperSearch.toLowerCase());
    const matchDomain = paperDomainFilter === "All" || p.domain === paperDomainFilter;
    return matchSearch && matchDomain;
  });

  /* ── Filtered Logs ── */
  const filteredLogs = activityLogs.filter((l) => {
    const matchSearch = !logSearch || l.description.toLowerCase().includes(logSearch.toLowerCase()) || l.userName.toLowerCase().includes(logSearch.toLowerCase()) || l.userEmail.toLowerCase().includes(logSearch.toLowerCase());
    const matchAction = logActionFilter === "All" || l.actionType === logActionFilter;
    return matchSearch && matchAction;
  });

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 pb-12">
        {/* Top Header Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5 rounded-full border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Shield className="h-3.5 w-3.5" />
                  Enterprise Portal
                </Badge>
                <span className="text-xs text-muted-foreground">• Central Research Governance</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Admin Management Console</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Monitor platform health, manage users, process faculty approvals, govern research output, and deploy system updates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={fetchAdminData} variant="outline" size="sm" className="gap-2 rounded-xl border-border bg-background hover:bg-accent">
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
                Sync System
              </Button>
              <Button onClick={handlePurgeMockData} variant="outline" size="sm" className="gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
                Purge Mock Data
              </Button>
              <Button onClick={() => setAnnouncementModalOpen(true)} size="sm" className="gap-2 rounded-xl gradient-brand text-primary-foreground shadow-md">
                <Megaphone className="h-4 w-4" />
                New Announcement
              </Button>
            </div>
          </div>
        </section>

        {/* Dynamic Admin Views based on Hash Tab */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-6">
            {/* Stat Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Card className="rounded-2xl border-border bg-card p-4 transition-all hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Total Students</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-foreground">{stats?.totalStudents ?? 0}</span>
                  <div className="mt-1 flex items-center gap-1 text-[0.7rem] font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>Registered in DB</span>
                  </div>
                </div>
              </Card>

              <Card className="rounded-2xl border-border bg-card p-4 transition-all hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Total Faculty</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-foreground">{stats?.totalFaculty ?? 0}</span>
                  <div className="mt-1 flex items-center gap-1 text-[0.7rem] font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>Verified accounts</span>
                  </div>
                </div>
              </Card>

              <Card className="rounded-2xl border-border bg-card p-4 transition-all hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Research Projects</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-foreground">{stats?.totalProjects ?? 0}</span>
                  <div className="mt-1 flex items-center gap-1 text-[0.7rem] font-medium text-muted-foreground">
                    <Activity className="h-3 w-3 text-primary" />
                    <span>Active in DB</span>
                  </div>
                </div>
              </Card>

              <Card className="rounded-2xl border-border bg-card p-4 transition-all hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Research Papers</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-foreground">{stats?.totalPapers ?? 0}</span>
                  <div className="mt-1 flex items-center gap-1 text-[0.7rem] font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>Saved manuscripts</span>
                  </div>
                </div>
              </Card>

              <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 p-4 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Pending Approvals</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats?.pendingFacultyApprovals ?? 0}</span>
                  <div className="mt-1 flex items-center gap-1 text-[0.7rem] font-medium text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Action required</span>
                  </div>
                </div>
              </Card>

              <Card className="rounded-2xl border-border bg-card p-4 transition-all hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Active Sessions</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Globe className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-foreground">{stats?.activeUsers ?? 0}</span>
                  <div className="mt-1 flex items-center gap-1 text-[0.7rem] font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>System online</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Interactive Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Platform User Growth Trend
                  </CardTitle>
                  <CardDescription className="text-xs">Monthly registration counts for Students vs Faculty</CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.userGrowth ?? []}>
                      <defs>
                        <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="facultyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                      <Area type="monotone" dataKey="students" stroke="#3B82F6" fillOpacity={1} fill="url(#studentGrad)" name="Students" />
                      <Area type="monotone" dataKey="faculty" stroke="#10B981" fillOpacity={1} fill="url(#facultyGrad)" name="Faculty" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-emerald-500" />
                    Research Project Status Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">Breakdown of active project pipeline stages</CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[260px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats?.projectStatus ?? []} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                        {(stats?.projectStatus ?? []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    Top Academic Research Domains
                  </CardTitle>
                  <CardDescription className="text-xs">Project allocation across key scientific disciplines</CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.researchDomains ?? []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="domain" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                      <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} name="Projects" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-500" />
                    Monthly Paper Upload Velocity
                  </CardTitle>
                  <CardDescription className="text-xs">Volume of research papers uploaded to repository</CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.monthlyPapers ?? []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
                      <Bar dataKey="papers" fill="#F59E0B" radius={[8, 8, 0, 0]} name="Papers Uploaded" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Widgets Section: Approvals Queue + Recent Activities + Announcements */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Faculty Approvals Queue Widget */}
              <Card className="rounded-3xl border-border bg-card p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-amber-500" />
                      <h3 className="font-semibold text-foreground">Faculty Approval Queue</h3>
                    </div>
                    <a href="#approvals" className="text-xs text-primary hover:underline font-medium">View all ({facultyApprovals.filter(f => f.status === "Pending").length})</a>
                  </div>

                  <div className="mt-4 space-y-3">
                    {facultyApprovals.filter(f => f.status === "Pending").length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center">No pending faculty applications.</p>
                    ) : (
                      facultyApprovals.filter(f => f.status === "Pending").slice(0, 3).map((f) => (
                        <div key={f.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-3">
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-semibold text-foreground">{f.name}</h4>
                            <p className="truncate text-[0.7rem] text-muted-foreground">{f.affiliation || f.department || f.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10" onClick={() => { setSelectedFaculty(f); setApprovalAction("approve"); setApprovalModalOpen(true); }} title="Approve">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { setSelectedFaculty(f); setApprovalAction("reject"); setApprovalModalOpen(true); }} title="Reject">
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <a href="#approvals" className="w-full">
                    <Button variant="outline" className="w-full gap-2 rounded-xl text-xs">
                      Process All Pending Requests
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </Card>

              {/* Recent Activity Timeline Widget */}
              <Card className="rounded-3xl border-border bg-card p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Recent System Audit</h3>
                    </div>
                    <a href="#activity" className="text-xs text-primary hover:underline font-medium">Full Timeline</a>
                  </div>

                  <div className="mt-4 space-y-3">
                    {activityLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="flex gap-3 text-xs">
                        <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-medium text-foreground truncate">{log.description}</p>
                          <p className="text-[0.68rem] text-muted-foreground">{log.userName} • {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <a href="#activity" className="w-full">
                    <Button variant="outline" className="w-full gap-2 rounded-xl text-xs">
                      View System Audit Trail
                    </Button>
                  </a>
                </div>
              </Card>

              {/* Latest Announcements Widget */}
              <Card className="rounded-3xl border-border bg-card p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-purple-500" />
                      <h3 className="font-semibold text-foreground">Active Announcements</h3>
                    </div>
                    <a href="#announcements" className="text-xs text-primary hover:underline font-medium">Manage</a>
                  </div>

                  <div className="mt-4 space-y-3">
                    {announcements.slice(0, 2).map((a) => (
                      <div key={a.id} className="rounded-2xl border border-border bg-background p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-foreground">{a.title}</span>
                          <Badge variant="outline" className="text-[0.65rem] px-2 py-0.5 border-primary/30 text-primary">{a.targetAudience}</Badge>
                        </div>
                        <p className="text-[0.7rem] text-muted-foreground line-clamp-2">{a.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <Button onClick={() => setAnnouncementModalOpen(true)} variant="outline" className="w-full gap-2 rounded-xl text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Broadcast Announcement
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Section 2: User Management View */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">User Management</h2>
                  <p className="text-xs text-muted-foreground mt-1">Directory of students, faculty advisors, and system administrators.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search name, email, institution…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9 rounded-xl text-xs" />
                  </div>

                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-32 rounded-xl text-xs">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Roles</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Faculty">Faculty</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                    <SelectTrigger className="w-32 rounded-xl text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Data Table */}
              <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">User Details</TableHead>
                      <TableHead className="text-xs font-semibold">Role</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-xs font-semibold">Institution / Dept</TableHead>
                      <TableHead className="text-xs font-semibold">Joined</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">No users found matching query.</TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                  {u.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-foreground">{u.name}</span>
                                <span className="text-[0.7rem] text-muted-foreground">{u.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`capitalize text-[0.68rem] px-2 py-0.5 ${u.role === "admin" ? "border-purple-500/40 text-purple-500 bg-purple-500/10" : u.role === "faculty" ? "border-blue-500/40 text-blue-500 bg-blue-500/10" : "border-emerald-500/40 text-emerald-500 bg-emerald-500/10"}`}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[0.68rem] px-2 py-0.5 ${u.status === "Active" ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10" : u.status === "Pending" ? "border-amber-500/40 text-amber-500 bg-amber-500/10" : u.status === "Suspended" ? "border-destructive/40 text-destructive bg-destructive/10" : "border-gray-500/40 text-gray-500"}`}>
                              {u.status || "Active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{u.affiliation || u.department || "ScholarNexus Institute"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedUser(u); setViewUserModalOpen(true); }} title="View Profile">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleOpenEditUser(u)} title="Edit User">
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className={`h-7 w-7 ${u.status === "Suspended" ? "text-emerald-500" : "text-amber-500"}`} onClick={() => handleToggleSuspendUser(u)} title={u.status === "Suspended" ? "Activate User" : "Suspend User"}>
                                {u.status === "Suspended" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { setSelectedUser(u); setDeleteUserModalOpen(true); }} title="Delete User">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Showing {paginatedUsers.length} of {filteredUsers.length} users</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={userPage === 1} onClick={() => setUserPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </Button>
                  <span>Page {userPage} of {totalUserPages}</span>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={userPage >= totalUserPages} onClick={() => setUserPage((p) => p + 1)}>
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Section 3: Faculty Approvals View */}
        {activeTab === "approvals" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Faculty Approvals Portal</h2>
                  <p className="text-xs text-muted-foreground mt-1">Review academic credentials and manage faculty access requests.</p>
                </div>

                <Tabs value={approvalTab} onValueChange={(v) => setApprovalTab(v as any)}>
                  <TabsList className="rounded-xl border border-border bg-background p-1">
                    <TabsTrigger value="Pending" className="rounded-lg text-xs font-medium">
                      Pending ({facultyApprovals.filter((f) => f.status === "Pending").length})
                    </TabsTrigger>
                    <TabsTrigger value="Active" className="rounded-lg text-xs font-medium">
                      Approved ({facultyApprovals.filter((f) => f.status === "Active").length})
                    </TabsTrigger>
                    <TabsTrigger value="Rejected" className="rounded-lg text-xs font-medium">
                      Rejected ({facultyApprovals.filter((f) => f.status === "Rejected").length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredApprovals.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                    No faculty applications found in "{approvalTab}" queue.
                  </div>
                ) : (
                  filteredApprovals.map((f) => (
                    <Card key={f.id} className="rounded-2xl border-border bg-card p-5 space-y-4 shadow-sm hover:border-primary/40 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarFallback className="font-bold bg-primary/10 text-primary">
                              {f.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">{f.name}</h3>
                            <p className="text-xs text-muted-foreground">{f.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[0.65rem] ${f.status === "Active" ? "border-emerald-500/40 text-emerald-500" : f.status === "Pending" ? "border-amber-500/40 text-amber-500" : "border-destructive/40 text-destructive"}`}>
                          {f.status}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Department:</span>
                          <span className="font-medium text-foreground">{f.department || "CS & AI"}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Institution:</span>
                          <span className="font-medium text-foreground">{f.affiliation || "University Partner"}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Degree/CV:</span>
                          <span className="font-medium text-primary underline cursor-pointer">{f.degree || "Ph.D. Computer Science"}</span>
                        </div>
                      </div>

                      {f.status === "Pending" && (
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <Button onClick={() => { setSelectedFaculty(f); setApprovalAction("approve"); setApprovalModalOpen(true); }} size="sm" className="flex-1 gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs">
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button onClick={() => { setSelectedFaculty(f); setApprovalAction("reject"); setApprovalModalOpen(true); }} size="sm" variant="outline" className="flex-1 gap-1.5 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 text-xs">
                            <Ban className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Section 4: Research Projects View */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Global Research Projects</h2>
                  <p className="text-xs text-muted-foreground mt-1">Platform-wide overview of student and faculty research initiatives.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search project title, lead, advisor…" value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} className="pl-9 rounded-xl text-xs" />
                  </div>

                  <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
                    <SelectTrigger className="w-36 rounded-xl text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Projects Table */}
              <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Project Title</TableHead>
                      <TableHead className="text-xs font-semibold">Domain</TableHead>
                      <TableHead className="text-xs font-semibold">Lead Researcher</TableHead>
                      <TableHead className="text-xs font-semibold">Advisor</TableHead>
                      <TableHead className="text-xs font-semibold">Status / Progress</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">No projects matching criteria.</TableCell>
                      </TableRow>
                    ) : (
                      filteredProjects.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex flex-col max-w-xs">
                              <span className="font-semibold text-xs text-foreground truncate">{p.title}</span>
                              <span className="text-[0.7rem] text-muted-foreground truncate">{p.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[0.68rem] border-primary/30 text-primary">{p.domain}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.userEmail}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.faculty || "Unassigned"}</TableCell>
                          <TableCell>
                            <div className="w-32 space-y-1">
                              <div className="flex justify-between text-[0.68rem]">
                                <span className="font-medium text-foreground">{p.status}</span>
                                <span className="text-muted-foreground">{p.progress}%</span>
                              </div>
                              <Progress value={p.progress} className="h-1.5" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedProject(p); setViewProjectModalOpen(true); }} title="View Details">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-500 hover:bg-amber-500/10" onClick={() => handleArchiveProject(p)} title="Archive Project">
                                <Archive className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { setSelectedProject(p); setDeleteProjectModalOpen(true); }} title="Delete Project">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {/* Section 5: Research Papers View */}
        {activeTab === "papers" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Repository Research Papers</h2>
                  <p className="text-xs text-muted-foreground mt-1">Inspect uploaded manuscripts, publications, and citations.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search title, authors…" value={paperSearch} onChange={(e) => setPaperSearch(e.target.value)} className="pl-9 rounded-xl text-xs" />
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Paper Title</TableHead>
                      <TableHead className="text-xs font-semibold">Authors</TableHead>
                      <TableHead className="text-xs font-semibold">Domain</TableHead>
                      <TableHead className="text-xs font-semibold">Uploader</TableHead>
                      <TableHead className="text-xs font-semibold">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPapers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">No research papers uploaded yet.</TableCell>
                      </TableRow>
                    ) : (
                      filteredPapers.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-semibold text-xs text-foreground">{p.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.authors}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[0.68rem] border-purple-500/30 text-purple-500">{p.domain || "AI"}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.uploaderEmail || "ScholarNexus AI"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => { setSelectedPaper(p); setViewPaperModalOpen(true); }} title="View Summary">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => handleDownloadPaper(p)} title="Download Manuscript">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => { setSelectedPaper(p); setDeletePaperModalOpen(true); }} title="Delete Paper">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {/* Section 6: Announcements View */}
        {activeTab === "announcements" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Platform Announcements</h2>
                  <p className="text-xs text-muted-foreground mt-1">Broadcast news, system updates, and grants directly to Student & Faculty dashboards.</p>
                </div>

                <Button onClick={() => { setEditingAnnouncement(null); setAnnouncementForm({ title: "", content: "", targetAudience: "All", priority: "Normal", pinned: false, published: true }); setAnnouncementModalOpen(true); }} className="gap-2 rounded-xl gradient-brand text-primary-foreground shadow-md">
                  <Plus className="h-4 w-4" />
                  Create Announcement
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                {announcements.length === 0 ? (
                  <p className="py-12 text-center text-xs text-muted-foreground">No announcements created yet.</p>
                ) : (
                  announcements.map((a) => (
                    <Card key={a.id} className="rounded-2xl border-border bg-background p-5 shadow-sm hover:border-primary/40 transition-all">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {a.pinned && <Badge variant="outline" className="text-[0.65rem] border-amber-500/50 bg-amber-500/10 text-amber-500">Pinned</Badge>}
                            <Badge variant="outline" className="text-[0.65rem] border-primary/40 text-primary">{a.targetAudience}</Badge>
                            <Badge variant="outline" className={`text-[0.65rem] ${a.priority === "Urgent" || a.priority === "High" ? "border-destructive/40 text-destructive bg-destructive/10" : "border-gray-500/40 text-gray-500"}`}>{a.priority} Priority</Badge>
                          </div>
                          <h3 className="font-semibold text-base text-foreground">{a.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{a.content}</p>
                          <span className="text-[0.7rem] text-muted-foreground block pt-1">Published by {a.authorName} on {new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{a.published ? "Published" : "Draft"}</span>
                            <Switch checked={a.published} onCheckedChange={() => handleTogglePublishAnnouncement(a)} />
                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditingAnnouncement(a); setAnnouncementForm({ title: a.title, content: a.content, targetAudience: a.targetAudience, priority: a.priority, pinned: a.pinned, published: a.published }); setAnnouncementModalOpen(true); }}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAnnouncement(a.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Section 7: Reports & Analytics View */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Reports & Analytics Hub</h2>
                  <p className="text-xs text-muted-foreground mt-1">Exportable administrative intelligence reports and cohort summaries.</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportReport("pdf")} className="gap-2 rounded-xl text-xs">
                    <FilePdfIcon className="h-4 w-4 text-red-500" />
                    Export PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportReport("excel")} className="gap-2 rounded-xl text-xs">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                    Export Excel
                  </Button>
                </div>
              </div>

              <Tabs value={reportSubTab} onValueChange={setReportSubTab} className="mt-6">
                <TabsList className="rounded-xl border border-border bg-background p-1">
                  <TabsTrigger value="students" className="rounded-lg text-xs font-medium">Students Report</TabsTrigger>
                  <TabsTrigger value="faculty" className="rounded-lg text-xs font-medium">Faculty Report</TabsTrigger>
                  <TabsTrigger value="projects" className="rounded-lg text-xs font-medium">Projects Report</TabsTrigger>
                  <TabsTrigger value="papers" className="rounded-lg text-xs font-medium">Papers Report</TabsTrigger>
                </TabsList>

                <TabsContent value="students" className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Active Student Enrolment</span>
                      <p className="text-2xl font-bold text-foreground mt-1">{stats?.totalStudents ?? 0}</p>
                    </Card>
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Project Participation Rate</span>
                      <p className="text-2xl font-bold text-emerald-500 mt-1">
                        {stats?.totalStudents ? `${Math.round((projects.length / stats.totalStudents) * 100)}%` : "0%"}
                      </p>
                    </Card>
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Avg Papers Per Student</span>
                      <p className="text-2xl font-bold text-purple-500 mt-1">
                        {stats?.totalStudents ? (stats.totalPapers / stats.totalStudents).toFixed(1) : "0.0"}
                      </p>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="faculty" className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Verified Faculty Advisors</span>
                      <p className="text-2xl font-bold text-foreground mt-1">{stats?.totalFaculty ?? 0}</p>
                    </Card>
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Faculty Approval Rate</span>
                      <p className="text-2xl font-bold text-emerald-500 mt-1">
                        {stats?.totalFaculty ? `${Math.round(((stats.totalFaculty - stats.pendingFacultyApprovals) / stats.totalFaculty) * 100)}%` : "0%"}
                      </p>
                    </Card>
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Avg Projects Supervised</span>
                      <p className="text-2xl font-bold text-blue-500 mt-1">
                        {stats?.totalFaculty ? (stats.totalProjects / stats.totalFaculty).toFixed(1) : "0.0"}
                      </p>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="projects" className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Total Projects</span>
                      <p className="text-2xl font-bold text-foreground mt-1">{stats?.totalProjects ?? 0}</p>
                    </Card>
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Average Progress</span>
                      <p className="text-2xl font-bold text-emerald-500 mt-1">
                        {projects.length ? `${Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length)}%` : "0%"}
                      </p>
                    </Card>
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Active Pipeline</span>
                      <p className="text-2xl font-bold text-amber-500 mt-1">
                        {projects.filter((p) => p.status === "In Progress" || p.status === "Under Review").length}
                      </p>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="papers" className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Total Repository Papers</span>
                      <p className="text-2xl font-bold text-foreground mt-1">{stats?.totalPapers ?? 0}</p>
                    </Card>
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Active Papers</span>
                      <p className="text-2xl font-bold text-emerald-500 mt-1">{papers.length}</p>
                    </Card>
                    <Card className="p-4 rounded-2xl border-border bg-background">
                      <span className="text-xs text-muted-foreground">Research Domains</span>
                      <p className="text-2xl font-bold text-indigo-500 mt-1">{stats?.researchDomains?.length ?? 0}</p>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        )}

        {/* Section 8: Activity Logs View */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">System Activity & Audit Logs</h2>
                  <p className="text-xs text-muted-foreground mt-1">Immutable audit trail of administrative, user, and security actions.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search action, admin email…" value={logSearch} onChange={(e) => setLogSearch(e.target.value)} className="pl-9 rounded-xl text-xs" />
                  </div>

                  <Select value={logActionFilter} onValueChange={setLogActionFilter}>
                    <SelectTrigger className="w-40 rounded-xl text-xs">
                      <SelectValue placeholder="Action Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Actions</SelectItem>
                      <SelectItem value="USER_MANAGEMENT">User Management</SelectItem>
                      <SelectItem value="FACULTY_APPROVAL">Faculty Approval</SelectItem>
                      <SelectItem value="PROJECT_ACTION">Project Action</SelectItem>
                      <SelectItem value="PAPER_ACTION">Paper Action</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                      <SelectItem value="SECURITY">Security Policy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                      <TableHead className="text-xs font-semibold">Actor</TableHead>
                      <TableHead className="text-xs font-semibold">Action Category</TableHead>
                      <TableHead className="text-xs font-semibold">Description</TableHead>
                      <TableHead className="text-xs font-semibold">Details / Context</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">No audit logs matching query.</TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs font-mono text-muted-foreground">{new Date(l.timestamp).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-foreground">{l.userName}</span>
                              <span className="text-[0.7rem] text-muted-foreground">{l.userEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[0.65rem] border-primary/30 text-primary">{l.actionType}</Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground">{l.description}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{l.details || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {/* Section 9: Settings View */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground">Admin Console Settings</h2>
              <p className="text-xs text-muted-foreground mt-1">Configure profile details, security preferences, and system thresholds.</p>

              <div className="mt-6 space-y-8 max-w-3xl">
                {/* Admin Profile Form */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Administrator Profile</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <Input value={adminProfile.name} onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })} className="rounded-xl text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Admin Email</Label>
                      <Input value={adminProfile.email} onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })} className="rounded-xl text-xs" />
                    </div>
                  </div>
                </div>

                {/* Password Form */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Change Admin Password</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Current Password</Label>
                      <Input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} className="rounded-xl text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">New Password</Label>
                      <Input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })} className="rounded-xl text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Confirm New Password</Label>
                      <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="rounded-xl text-xs" />
                    </div>
                  </div>
                  <Button size="sm" onClick={() => toast.success("Password updated successfully.")} className="gap-2 rounded-xl gradient-brand text-primary-foreground text-xs">
                    <Key className="h-3.5 w-3.5" />
                    Update Password
                  </Button>
                </div>

                {/* Notification Preferences */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Notification & Alert Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-border p-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Faculty Approval Email Notifications</p>
                        <p className="text-[0.7rem] text-muted-foreground">Receive instant alerts when new faculty members register for approval.</p>
                      </div>
                      <Switch checked={notifications.emailApprovals} onCheckedChange={(v) => setNotifications({ ...notifications, emailApprovals: v })} />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-border p-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">Security & System Alerts</p>
                        <p className="text-[0.7rem] text-muted-foreground">Notify administrator of unusual login spikes or database errors.</p>
                      </div>
                      <Switch checked={notifications.securityAlerts} onCheckedChange={(v) => setNotifications({ ...notifications, securityAlerts: v })} />
                    </div>
                  </div>
                </div>

                {/* System Configuration Placeholders */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Future System Configuration</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="p-4 rounded-2xl border-border bg-background space-y-1">
                      <span className="text-xs font-semibold text-foreground">Maintenance Mode</span>
                      <p className="text-[0.7rem] text-muted-foreground">Temporarily disable student logins during system upgrades.</p>
                      <Badge variant="outline" className="mt-2 text-[0.65rem] border-emerald-500/40 text-emerald-500">System Normal</Badge>
                    </Card>
                    <Card className="p-4 rounded-2xl border-border bg-background space-y-1">
                      <span className="text-xs font-semibold text-foreground">API Rate Limiting</span>
                      <p className="text-[0.7rem] text-muted-foreground">Enforce 500 requests per minute per IP address.</p>
                      <Badge variant="outline" className="mt-2 text-[0.65rem] border-blue-500/40 text-blue-500">Enabled (500 req/min)</Badge>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ── Dialog Modals ── */}

      {/* View User Profile Modal */}
      <Dialog open={viewUserModalOpen} onOpenChange={setViewUserModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">User Profile Details</DialogTitle>
            <DialogDescription className="text-xs">Complete account metadata and research attributes.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2 text-xs">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarFallback className="font-bold bg-primary/10 text-primary">{selectedUser.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-sm text-foreground">{selectedUser.name}</h4>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Role:</span><Badge variant="outline" className="capitalize text-[0.65rem]">{selectedUser.role}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><Badge variant="outline" className="text-[0.65rem]">{selectedUser.status || "Active"}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Institution:</span><span className="font-medium text-foreground">{selectedUser.affiliation || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Department:</span><span className="font-medium text-foreground">{selectedUser.department || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Joined:</span><span className="font-medium text-foreground">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
              </div>
              {selectedUser.bio && (
                <div className="border-t border-border pt-3 space-y-1">
                  <span className="font-semibold text-foreground">Biography</span>
                  <p className="text-muted-foreground leading-relaxed">{selectedUser.bio}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit User Account</DialogTitle>
            <DialogDescription className="text-xs">Update role, account status, and institution info.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input value={editUserData.name} onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })} className="rounded-xl text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={editUserData.role} onValueChange={(v) => setEditUserData({ ...editUserData, role: v })}>
                <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Account Status</Label>
              <Select value={editUserData.status} onValueChange={(v) => setEditUserData({ ...editUserData, status: v })}>
                <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Institution / Affiliation</Label>
              <Input value={editUserData.affiliation} onChange={(e) => setEditUserData({ ...editUserData, affiliation: e.target.value })} className="rounded-xl text-xs" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditUserModalOpen(false)} className="rounded-xl text-xs">Cancel</Button>
            <Button onClick={handleSaveUser} className="rounded-xl gradient-brand text-primary-foreground text-xs">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={deleteUserModalOpen} onOpenChange={setDeleteUserModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">Confirm User Deletion</DialogTitle>
            <DialogDescription className="text-xs">Are you sure you want to permanently delete user account <span className="font-semibold text-foreground">{selectedUser?.email}</span>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteUserModalOpen(false)} className="rounded-xl text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} className="rounded-xl text-xs">Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Faculty Approval Process Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Process Faculty Application</DialogTitle>
            <DialogDescription className="text-xs">
              {approvalAction === "approve" ? "Grant full Faculty access privileges to " : "Reject access request for "}
              <span className="font-semibold text-foreground">{selectedFaculty?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          {approvalAction === "reject" && (
            <div className="space-y-1.5 py-2">
              <Label className="text-xs">Rejection Reason (Optional)</Label>
              <Textarea placeholder="Explain why the application was rejected…" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="rounded-xl text-xs" />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApprovalModalOpen(false)} className="rounded-xl text-xs">Cancel</Button>
            <Button onClick={handleProcessFaculty} className={`rounded-xl text-white text-xs ${approvalAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"}`}>
              Confirm {approvalAction === "approve" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Project Details Modal */}
      <Dialog open={viewProjectModalOpen} onOpenChange={setViewProjectModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Research Project Overview</DialogTitle>
            <DialogDescription className="text-xs">Project metadata & supervisor alignment.</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <Badge variant="outline" className="text-[0.65rem] border-primary/30 text-primary">{selectedProject.domain}</Badge>
                <h3 className="font-bold text-base text-foreground">{selectedProject.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{selectedProject.description}</p>
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Lead Researcher:</span><span className="font-medium text-foreground">{selectedProject.userEmail}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Faculty Advisor:</span><span className="font-medium text-foreground">{selectedProject.faculty || "Unassigned"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><Badge variant="outline">{selectedProject.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date Range:</span><span className="font-medium text-foreground">{selectedProject.startDate} to {selectedProject.expectedCompletionDate}</span></div>
              </div>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-[0.7rem] text-amber-700 dark:text-amber-300">
                <span className="font-bold">Admin Policy Note:</span> Admin module permits project viewing, archiving, and deletion, but does not allow editing student research content.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Project Modal */}
      <Dialog open={deleteProjectModalOpen} onOpenChange={setDeleteProjectModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">Delete Research Project</DialogTitle>
            <DialogDescription className="text-xs">Are you sure you want to delete project <span className="font-semibold text-foreground">{selectedProject?.title}</span>?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteProjectModalOpen(false)} className="rounded-xl text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject} className="rounded-xl text-xs">Delete Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Paper Summary Modal */}
      <Dialog open={viewPaperModalOpen} onOpenChange={setViewPaperModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Research Paper Manuscript</DialogTitle>
            <DialogDescription className="text-xs">Summary abstract & author details.</DialogDescription>
          </DialogHeader>
          {selectedPaper && (
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <Badge variant="outline" className="text-[0.65rem] border-purple-500/30 text-purple-500">{selectedPaper.domain || "AI"}</Badge>
                <h3 className="font-bold text-base text-foreground">{selectedPaper.title}</h3>
                <p className="text-muted-foreground font-medium">Authors: {selectedPaper.authors}</p>
              </div>
              <div className="space-y-1 border-t border-border pt-3">
                <span className="font-semibold text-foreground">Abstract / Summary</span>
                <p className="text-muted-foreground leading-relaxed">{selectedPaper.summary}</p>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-muted-foreground">
                <span>Uploader: {selectedPaper.uploaderEmail}</span>
                <span>Date: {new Date(selectedPaper.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Paper Modal */}
      <Dialog open={deletePaperModalOpen} onOpenChange={setDeletePaperModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">Delete Paper Record</DialogTitle>
            <DialogDescription className="text-xs">Are you sure you want to delete paper record <span className="font-semibold text-foreground">{selectedPaper?.title}</span>?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletePaperModalOpen(false)} className="rounded-xl text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleDeletePaper} className="rounded-xl text-xs">Delete Paper</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Announcement Modal */}
      <Dialog open={announcementModalOpen} onOpenChange={setAnnouncementModalOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editingAnnouncement ? "Edit Announcement" : "Create Platform Announcement"}</DialogTitle>
            <DialogDescription className="text-xs">Published announcements dynamically stream to Student & Faculty dashboards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Announcement Title</Label>
              <Input placeholder="e.g. Fall 2026 Research Grant Openings" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="rounded-xl text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Message Content</Label>
              <Textarea placeholder="Details of announcement..." value={announcementForm.content} onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })} className="rounded-xl text-xs h-24" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Target Audience</Label>
                <Select value={announcementForm.targetAudience} onValueChange={(v: any) => setAnnouncementForm({ ...announcementForm, targetAudience: v })}>
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Users</SelectItem>
                    <SelectItem value="Students">Students Only</SelectItem>
                    <SelectItem value="Faculty">Faculty Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Priority Level</Label>
                <Select value={announcementForm.priority} onValueChange={(v: any) => setAnnouncementForm({ ...announcementForm, priority: v })}>
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs">Pin to Top of Dashboard</span>
              <Switch checked={announcementForm.pinned} onCheckedChange={(v) => setAnnouncementForm({ ...announcementForm, pinned: v })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAnnouncementModalOpen(false)} className="rounded-xl text-xs">Cancel</Button>
            <Button onClick={handleSaveAnnouncement} className="rounded-xl gradient-brand text-primary-foreground text-xs">Publish Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
