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
  MoreVertical,
  RotateCw,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  ShieldCheck,
  Copy,
  FileCheck,
  BookOpen,
  HelpCircle,
  Award,
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  status: "Active" | "Pending" | "Suspended" | "Rejected" | "Deleted" | "Awaiting Applicant Response";
  createdAt: string;
  displayName?: string;
  affiliation?: string;
  bio?: string;
  department?: string;
  designation?: string;
  degree?: string;
  credentials?: string;
  researchInterests?: string;
  phone?: string;
  assignedFaculty?: string;
  assignedStudents?: string[];
  lastLogin?: string;
  deletedAt?: string;
}

interface FacultyRequest extends UserItem {
  approvalDate?: string;
  approvedBy?: string;
  approvalReason?: string;
  rejectionReason?: string;
  rejectionDate?: string;
  infoRequestMessage?: string;
  adminMessage?: string;
  requestedBy?: string;
  requestedDate?: string;
  institution?: string;
  facultyId?: string;
  areasOfExpertise?: string | string[];
  orcid?: string;
  verificationDocument?: string;
  approvalStatus?: string;
  updatedAt?: string;
  infoResponse?: string;
  applicationHistory?: { action: string; timestamp: string; details?: string; by?: string }[];
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
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [approvalTab, setApprovalTab] = useState<"All" | "Pending" | "Awaiting Response" | "Approved" | "Rejected">("All");

  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");
  const [projectDomainFilter, setProjectDomainFilter] = useState("All");

  const [paperSearch, setPaperSearch] = useState("");
  const [paperDomainFilter, setPaperDomainFilter] = useState("All");

  const [logSearch, setLogSearch] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("All");

  // Dialog & Modal States
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [viewProfileDrawerOpen, setViewProfileDrawerOpen] = useState(false);
  const [profileDetailsData, setProfileDetailsData] = useState<any | null>(null);
  const [loadingProfileDetails, setLoadingProfileDetails] = useState(false);

  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({
    id: "",
    name: "",
    email: "",
    role: "student",
    status: "Active",
    affiliation: "",
    department: "",
    designation: "",
    phone: "",
    bio: "",
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "activate" | "approve" | "reject" | "delete" | null>(null);
  const [confirmTargetUser, setConfirmTargetUser] = useState<UserItem | null>(null);
  const [confirmReason, setConfirmReason] = useState("");

  const [selectedFaculty, setSelectedFaculty] = useState<FacultyRequest | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("");

  // ── Faculty Approvals Portal States & Workflows ──
  const [selectedApprovalUserId, setSelectedApprovalUserId] = useState<string | null>(null);
  const [approvalSearch, setApprovalSearch] = useState("");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("All");
  const [approvalInstitutionFilter, setApprovalInstitutionFilter] = useState("All");
  const [approvalDepartmentFilter, setApprovalDepartmentFilter] = useState("All");
  const [approvalSort, setApprovalSort] = useState<"newest" | "oldest">("newest");

  // Workflow Dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState("");

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState("");

  const [requestInfoDialogOpen, setRequestInfoDialogOpen] = useState(false);
  const [requestInfoMsg, setRequestInfoMsg] = useState("");
  const [requestReasonText, setRequestReasonText] = useState("");
  const [requestNotesText, setRequestNotesText] = useState("");

  const [docPreviewModalOpen, setDocPreviewModalOpen] = useState(false);

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
    name: session?.displayName ?? session?.name ?? "ScholarNexus Admin",
    email: session?.email ?? "scholarnexusadmin@gmail.com",
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
  const fetchAdminData = async (isManualRefresh = false, isSilent = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else if (!isSilent && users.length === 0) setLoading(true);

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

      const now = new Date();
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

      if (isManualRefresh) {
        toast.success("User directory and summary counts refreshed.");
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
      toast.error("Failed to sync admin portal with backend.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
      email: "scholarnexusadmin@gmail.com",
      name: "ScholarNexus Admin",
      role: "admin",
      profileCompleted: true,
      displayName: "ScholarNexus System Administrator",
      affiliation: "ScholarNexus Central Administration",
    };
    setUserSession(demoAdmin);
    setSession(demoAdmin);
    toast.success("Switched to Admin Session. Admin console unlocked!");
  };

  /* ── Enterprise User Management Actions ── */
  const handleViewProfile = async (u: UserItem) => {
    setSelectedUser(u);
    setViewProfileDrawerOpen(true);
    setLoadingProfileDetails(true);
    setProfileDetailsData(null);
    try {
      const res = await fetch(`/api/admin/users/details?email=${encodeURIComponent(u.email)}`);
      if (res.ok) {
        setProfileDetailsData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch user profile details:", err);
    } finally {
      setLoadingProfileDetails(false);
    }
  };

  const handleOpenEditUser = (u: UserItem) => {
    setSelectedUser(u);
    setEditUserData({
      id: u.id || u._id || "",
      name: u.name || u.displayName || "",
      email: u.email,
      role: u.role,
      status: u.status || "Active",
      affiliation: u.affiliation || "",
      department: u.department || "",
      designation: u.designation || "",
      phone: u.phone || "",
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
        body: JSON.stringify({
          id: selectedUser.id || selectedUser._id,
          email: selectedUser.email,
          role: editUserData.role,
          status: editUserData.status,
          department: editUserData.department,
          designation: editUserData.designation,
          phone: editUserData.phone,
          affiliation: editUserData.affiliation,
          bio: editUserData.bio,
        }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((usr) =>
            usr.id === selectedUser.id || usr.email === selectedUser.email
              ? {
                  ...usr,
                  role: editUserData.role,
                  status: editUserData.status as UserItem["status"],
                  department: editUserData.department,
                  designation: editUserData.designation,
                  phone: editUserData.phone,
                  affiliation: editUserData.affiliation,
                }
              : usr
          )
        );
        toast.success(`User account for ${selectedUser.email} updated successfully.`);
        setEditUserModalOpen(false);
        fetchAdminData(false, true);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update user.");
      }
    } catch {
      toast.error("Network error updating user.");
    }
  };

  const handleOpenConfirmModal = (u: UserItem, action: "suspend" | "activate" | "approve" | "reject" | "delete") => {
    if ((action === "suspend" || action === "delete" || action === "reject") && (u.role === "admin" || u.email === session?.email)) {
      toast.error("Security policy prohibits suspending, rejecting, or deleting Administrator accounts.");
      return;
    }
    setConfirmTargetUser(u);
    setConfirmAction(action);
    setConfirmReason("");
    setConfirmModalOpen(true);
  };

  const handleExecuteConfirmedAction = async () => {
    if (!confirmTargetUser || !confirmAction) return;
    const u = confirmTargetUser;
    const action = confirmAction;

    try {
      if (action === "approve" || action === "reject") {
        const newStatus = action === "approve" ? "Active" : "Rejected";
        setUsers((prev) => prev.map((usr) => (usr.id === u.id || usr.email === u.email) ? { ...usr, status: newStatus } : usr));
        const res = await fetch("/api/admin/faculty/approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: u.id,
            email: u.email,
            action: action === "approve" ? "approve" : "reject",
            reason: action === "reject" ? confirmReason : undefined,
          }),
        });
        if (res.ok) {
          toast.success(`Faculty application for ${u.name} was ${action === "approve" ? "Approved" : "Rejected"}.`);
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to process faculty request.");
        }
      } else if (action === "suspend" || action === "activate") {
        const newStatus = action === "suspend" ? "Suspended" : "Active";
        setUsers((prev) => prev.map((usr) => (usr.id === u.id || usr.email === u.email) ? { ...usr, status: newStatus } : usr));
        const res = await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: u.id, email: u.email, status: newStatus }),
        });
        if (res.ok) {
          toast.success(`User account status for ${u.email} set to ${newStatus}.`);
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to update account status.");
        }
      } else if (action === "delete") {
        setUsers((prev) => prev.map((usr) => (usr.id === u.id || usr.email === u.email) ? { ...usr, status: "Deleted" } : usr));
        const res = await fetch("/api/admin/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: u.id, email: u.email }),
        });
        if (res.ok) {
          toast.success(`User account for ${u.email} deactivated (Soft Deleted).`);
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to delete user account.");
        }
      }
      setConfirmModalOpen(false);
      fetchAdminData(false, true);
    } catch {
      toast.error("Network error executing action.");
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

  /* ── Enterprise Faculty Approvals Portal Logic ── */
  const facultyUsersList = useMemo(() => {
    return users.filter((u) => u.role === "faculty" && u.status !== "Deleted") as FacultyRequest[];
  }, [users]);

  const approvalPortalStats = useMemo(() => {
    const all = facultyUsersList.length;
    const pending = facultyUsersList.filter((f) => (f.status as string) === "Pending" || f.approvalStatus === "Pending" || (!f.status && !f.approvalStatus)).length;
    const awaitingResponse = facultyUsersList.filter((f) => (f.status as string) === "Awaiting Applicant Response" || f.approvalStatus === "Info Requested").length;
    const approved = facultyUsersList.filter((f) => f.status === "Active" || f.approvalStatus === "Approved").length;
    const rejected = facultyUsersList.filter((f) => f.status === "Rejected" || f.approvalStatus === "Rejected").length;
    return { all, pending, awaitingResponse, approved, rejected };
  }, [facultyUsersList]);

  const uniqueInstitutions = useMemo(() => {
    const set = new Set<string>();
    facultyUsersList.forEach((f) => {
      const inst = f.institution || f.affiliation;
      if (inst) set.add(inst);
    });
    return Array.from(set);
  }, [facultyUsersList]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    facultyUsersList.forEach((f) => {
      if (f.department) set.add(f.department);
    });
    return Array.from(set);
  }, [facultyUsersList]);

  const filteredFacultyApprovalsList = useMemo(() => {
    return facultyUsersList.filter((f) => {
      const fStatus = (f.status as string) || f.approvalStatus || "Pending";
      const isPending = fStatus === "Pending" || f.approvalStatus === "Pending" || (!f.status && !f.approvalStatus);
      const isAwaiting = fStatus === "Awaiting Applicant Response" || f.approvalStatus === "Info Requested";
      const isApproved = fStatus === "Active" || f.approvalStatus === "Approved";
      const isRejected = fStatus === "Rejected" || f.approvalStatus === "Rejected";

      // Filter by Queue Tab
      let matchTab = false;
      if (approvalTab === "All") matchTab = true;
      else if (approvalTab === "Pending") matchTab = isPending;
      else if (approvalTab === "Awaiting Response") matchTab = isAwaiting;
      else if (approvalTab === "Approved") matchTab = isApproved;
      else if (approvalTab === "Rejected") matchTab = isRejected;

      if (!matchTab) return false;

      const q = approvalSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.facultyId && f.facultyId.toLowerCase().includes(q)) ||
        (f.department && f.department.toLowerCase().includes(q));

      const fInst = f.institution || f.affiliation || "Not Provided";
      const matchInst = approvalInstitutionFilter === "All" || fInst === approvalInstitutionFilter;

      const fDept = f.department || "Not Provided";
      const matchDept = approvalDepartmentFilter === "All" || fDept === approvalDepartmentFilter;

      return matchSearch && matchInst && matchDept;
    }).sort((a, b) => {
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return approvalSort === "newest" ? tB - tA : tA - tB;
    });
  }, [facultyUsersList, approvalTab, approvalSearch, approvalInstitutionFilter, approvalDepartmentFilter, approvalSort]);

  const selectedApprovalUser = useMemo(() => {
    if (selectedApprovalUserId) {
      const found = facultyUsersList.find((f) => f.id === selectedApprovalUserId || f.email === selectedApprovalUserId);
      if (found) return found;
    }
    return filteredFacultyApprovalsList[0] || facultyUsersList[0] || null;
  }, [selectedApprovalUserId, facultyUsersList, filteredFacultyApprovalsList]);

  const handleDownloadDoc = (docDataUrl?: string, userName?: string) => {
    if (!docDataUrl || docDataUrl.trim() === "") {
      toast.error("No verification document file attached to download.");
      return;
    }
    try {
      const a = document.createElement("a");
      a.href = docDataUrl;
      const cleanName = (userName || "Faculty").replace(/[^a-zA-Z0-9]/g, "_");
      a.download = `Faculty_Verification_${cleanName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloaded verification document for ${userName || "faculty applicant"}.`);
    } catch (err) {
      console.error("Failed to download document:", err);
      toast.error("Failed to initiate document download.");
    }
  };

  const handleConfirmApprove = async () => {
    if (!selectedApprovalUser) return;
    const target = selectedApprovalUser;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id || u.email === target.email
          ? { ...u, status: "Active", approvalStatus: "Approved", approvalReason: approveRemarks, approvedBy: "scholarnexusadmin@gmail.com", approvalDate: new Date().toISOString() }
          : u
      )
    );
    setApproveDialogOpen(false);
    toast.success(`Faculty registration for ${target.name} approved successfully.`);
    setApprovalTab("Approved");

    try {
      const res = await fetch("/api/admin/faculty/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          email: target.email,
          action: "approve",
          remarks: approveRemarks,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update MongoDB record.");
      }
      fetchAdminData(false, true);
    } catch {
      toast.error("Network error executing approval.");
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedApprovalUser || !rejectReasonText.trim()) return;
    const target = selectedApprovalUser;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id || u.email === target.email
          ? { ...u, status: "Rejected", approvalStatus: "Rejected", rejectionReason: rejectReasonText, rejectionDate: new Date().toISOString() }
          : u
      )
    );
    setRejectDialogOpen(false);
    toast.info(`Faculty application for ${target.name} was Rejected.`);
    setApprovalTab("Rejected");

    try {
      const res = await fetch("/api/admin/faculty/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          email: target.email,
          action: "reject",
          reason: rejectReasonText,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update rejection in MongoDB.");
      }
      fetchAdminData(false, true);
    } catch {
      toast.error("Network error executing rejection.");
    }
  };

  const handleConfirmRequestInfo = async () => {
    if (!selectedApprovalUser) return;
    const target = selectedApprovalUser;
    const msg = (requestReasonText.trim() + (requestNotesText.trim() ? " - Notes: " + requestNotesText.trim() : "")) || requestInfoMsg.trim();
    if (!msg) {
      toast.error("Please enter a reason or notes for requesting additional information.");
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id || u.email === target.email
          ? {
              ...u,
              status: "Awaiting Applicant Response",
              approvalStatus: "Info Requested",
              infoRequestMessage: msg,
              adminMessage: msg,
              requestedBy: "scholarnexusadmin@gmail.com",
              requestedDate: new Date().toISOString(),
            }
          : u
      )
    );
    setRequestInfoDialogOpen(false);
    setRequestReasonText("");
    setRequestNotesText("");
    setRequestInfoMsg("");

    toast.info(`Requested clarification from ${target.name}. Moved to Awaiting Response queue.`);
    setApprovalTab("Awaiting Response");

    try {
      const res = await fetch("/api/admin/faculty/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          email: target.email,
          action: "request_info",
          infoMessage: msg,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to sync request with server.");
      }
      fetchAdminData(false, true);
    } catch {
      toast.error("Network error submitting request.");
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

  /* ── Filtered User List & Metrics ── */
  const userStats = useMemo(() => {
    const total = users.filter((u) => u.status !== "Deleted").length;
    const students = users.filter((u) => u.role === "student" && u.status !== "Deleted").length;
    const faculty = users.filter((u) => u.role === "faculty" && u.status !== "Deleted").length;
    const admins = users.filter((u) => u.role === "admin" && u.status !== "Deleted").length;
    const pendingFaculty = users.filter((u) => u.role === "faculty" && u.status === "Pending").length;
    const suspended = users.filter((u) => u.status === "Suspended").length;
    return { total, students, faculty, admins, pendingFaculty, suspended };
  }, [users]);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !userSearch ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.affiliation && u.affiliation.toLowerCase().includes(userSearch.toLowerCase()));

    const matchRole = userRoleFilter === "All" || u.role.toLowerCase() === userRoleFilter.toLowerCase();

    let matchStatus = true;
    if (userStatusFilter !== "All") {
      matchStatus = (u.status || "Active") === userStatusFilter;
    }

    return matchSearch && matchRole && matchStatus;
  });

  const itemsPerPage = 8;
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
                    <span>Registered Scholars</span>
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
                    <span>Active Pipeline</span>
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

        {/* Section 2: User Management Directory */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Top Metric Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Card className="rounded-2xl border-border bg-card p-4 transition-all hover:border-primary/50 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Total Users</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-foreground">{userStats.total}</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-muted-foreground">Active directory records</p>
                </div>
              </Card>

              <Card className="rounded-2xl border-border bg-card p-4 transition-all hover:border-primary/50 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Students</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-foreground">{userStats.students}</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-emerald-600 dark:text-emerald-400">Enrolled researchers</p>
                </div>
              </Card>

              <Card className="rounded-2xl border-border bg-card p-4 transition-all hover:border-primary/50 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Faculty</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-foreground">{userStats.faculty}</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-indigo-600 dark:text-indigo-400">Academic advisors</p>
                </div>
              </Card>

              <Card className="rounded-2xl border-border bg-card p-4 transition-all hover:border-primary/50 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Admins</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-foreground">{userStats.admins}</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-purple-600 dark:text-purple-400">System governance</p>
                </div>
              </Card>

              <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 p-4 transition-all shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Pending Approvals</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{userStats.pendingFaculty}</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Action required
                  </p>
                </div>
              </Card>

              <Card className="rounded-2xl border-destructive/30 bg-destructive/5 p-4 transition-all shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-destructive">Suspended Users</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/20 text-destructive">
                    <Ban className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-destructive">{userStats.suspended}</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-destructive">Access restricted</p>
                </div>
              </Card>
            </div>

            {/* Main User Directory Card */}
            <Card className="rounded-3xl border-border bg-card p-6 shadow-sm space-y-5">
              {/* Header Title Section */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-3 border-b border-border/50">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <Users className="h-4 w-4" />
                    </div>
                    <span>Enterprise User Directory</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage students, faculty advisors, and system administrators with role governance and soft-delete protection.
                  </p>
                </div>
              </div>

              {/* Clean Unified Search & Filter Control Row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, department…"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    className="pl-9 pr-8 h-9 rounded-xl text-xs bg-background"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch("")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <Select value={userRoleFilter} onValueChange={(v) => { setUserRoleFilter(v); setUserPage(1); }}>
                  <SelectTrigger className="w-40 h-9 rounded-xl text-xs bg-background">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-xs">
                    <SelectItem value="All">All Roles</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={userStatusFilter} onValueChange={(v) => { setUserStatusFilter(v); setUserPage(1); }}>
                  <SelectTrigger className="w-40 h-9 rounded-xl text-xs bg-background">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-xs">
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Table */}
              <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">User Profile</TableHead>
                      <TableHead className="text-xs font-semibold">Role</TableHead>
                      <TableHead className="text-xs font-semibold">Account Status</TableHead>
                      <TableHead className="text-xs font-semibold">Department / Designation</TableHead>
                      <TableHead className="text-xs font-semibold">Registration Date</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RotateCw className="h-6 w-6 animate-spin text-primary" />
                            <span>Loading user directory…</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <User className="h-8 w-8 text-muted-foreground/50" />
                            <p className="font-semibold text-foreground">No matching users found</p>
                            <p className="text-[0.75rem] text-muted-foreground">
                              Try adjusting search query or clearing role/status filters.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 rounded-xl text-xs"
                              onClick={() => {
                                setUserSearch("");
                                setUserRoleFilter("All");
                                setUserStatusFilter("All");
                              }}
                            >
                              Clear All Filters
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((u) => {
                        const isAdmin = u.role === "admin" || u.email === session?.email;
                        const isFaculty = u.role === "faculty";
                        const isDeleted = u.status === "Deleted";

                        return (
                          <TableRow
                            key={u.id || u._id}
                            className={`transition-colors hover:bg-muted/50 ${isDeleted ? "bg-muted/20 opacity-70" : ""}`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-border shadow-xs">
                                  <AvatarImage src={u.displayName || ""} alt={u.name} />
                                  <AvatarFallback className={`text-xs font-bold ${u.role === "admin" ? "bg-purple-500/15 text-purple-600 dark:text-purple-400" : isFaculty ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"}`}>
                                    {u.name ? u.name.slice(0, 2).toUpperCase() : "US"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                                    {u.name || u.displayName || "Scholar User"}
                                    {isAdmin && <span title="Administrator Account"><ShieldCheck className="h-3.5 w-3.5 text-purple-500 shrink-0" /></span>}
                                  </span>
                                  <span className="text-[0.7rem] text-muted-foreground truncate">{u.email}</span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`capitalize text-[0.68rem] px-2.5 py-0.5 rounded-full font-medium ${
                                  u.role === "admin"
                                    ? "border-purple-500/40 text-purple-600 bg-purple-500/10 dark:text-purple-400"
                                    : u.role === "faculty"
                                    ? "border-indigo-500/40 text-indigo-600 bg-indigo-500/10 dark:text-indigo-400"
                                    : "border-emerald-500/40 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
                                }`}
                              >
                                {u.role}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[0.68rem] px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1.5 w-fit ${
                                  u.status === "Active"
                                    ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
                                    : u.status === "Pending"
                                    ? "border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-400"
                                    : u.status === "Suspended"
                                    ? "border-destructive/40 text-destructive bg-destructive/10"
                                    : u.status === "Rejected"
                                    ? "border-rose-500/40 text-rose-500 bg-rose-500/10"
                                    : "border-slate-500/40 text-slate-500 bg-slate-500/10"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    u.status === "Active"
                                      ? "bg-emerald-500"
                                      : u.status === "Pending"
                                      ? "bg-amber-500 animate-pulse"
                                      : u.status === "Suspended"
                                      ? "bg-destructive"
                                      : u.status === "Rejected"
                                      ? "bg-rose-500"
                                      : "bg-slate-400"
                                  }`}
                                />
                                {u.status || "Active"}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground">
                              <div className="flex flex-col">
                                <span className="text-foreground font-medium truncate">{u.department || u.affiliation || "ScholarNexus Partner"}</span>
                                <span className="text-[0.7rem] text-muted-foreground truncate">{u.designation || (u.role === "student" ? "Undergraduate Student" : u.role === "faculty" ? "Faculty Advisor" : "System Administrator")}</span>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </TableCell>

                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open options</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl text-xs">
                                  <DropdownMenuLabel className="text-[0.7rem] text-muted-foreground">Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleViewProfile(u)} className="cursor-pointer gap-2">
                                    <Eye className="h-3.5 w-3.5 text-primary" /> View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenEditUser(u)} disabled={isDeleted} className="cursor-pointer gap-2">
                                    <Edit3 className="h-3.5 w-3.5 text-blue-500" /> Edit User
                                  </DropdownMenuItem>

                                  {isFaculty && u.status !== "Active" && (
                                    <DropdownMenuItem onClick={() => handleOpenConfirmModal(u, "approve")} className="cursor-pointer gap-2 text-emerald-600">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve Faculty
                                    </DropdownMenuItem>
                                  )}

                                  {isFaculty && u.status !== "Rejected" && (
                                    <DropdownMenuItem onClick={() => handleOpenConfirmModal(u, "reject")} className="cursor-pointer gap-2 text-rose-500">
                                      <XCircle className="h-3.5 w-3.5" /> Reject Faculty
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    onClick={() => handleOpenConfirmModal(u, u.status === "Suspended" ? "activate" : "suspend")}
                                    disabled={isAdmin || isDeleted}
                                    className="cursor-pointer gap-2"
                                  >
                                    <Ban className={`h-3.5 w-3.5 ${u.status === "Suspended" ? "text-emerald-500" : "text-amber-500"}`} />
                                    {u.status === "Suspended" ? "Activate Account" : "Suspend User"}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleOpenConfirmModal(u, "delete")}
                                    disabled={isAdmin || isDeleted}
                                    className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete User (Soft)
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                <span>Showing {paginatedUsers.length} of {filteredUsers.length} users</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" disabled={userPage === 1} onClick={() => setUserPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </Button>
                  <span>Page {userPage} of {totalUserPages}</span>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" disabled={userPage >= totalUserPages} onClick={() => setUserPage((p) => p + 1)}>
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Section 3: Enterprise Faculty Approvals Portal */}
        {activeTab === "approvals" && (
          <div className="space-y-6">
            {/* Top Dashboard Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Pending</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{approvalPortalStats.pending}</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-amber-600">Awaiting initial verification</p>
                </div>
              </Card>

              <Card className="rounded-2xl border-blue-500/30 bg-blue-500/5 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Awaiting Response</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/20 text-blue-600">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{approvalPortalStats.awaitingResponse}</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-blue-600">Info requested from applicant</p>
                </div>
              </Card>

              <Card className="rounded-2xl border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Approved</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{approvalPortalStats.approved}</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-emerald-600">Verified active faculty</p>
                </div>
              </Card>

              <Card className="rounded-2xl border-rose-500/30 bg-rose-500/5 p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Rejected</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/20 text-rose-600">
                    <XCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-rose-700 dark:text-rose-300">{approvalPortalStats.rejected}</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-rose-600">Declined applications</p>
                </div>
              </Card>

              <Card className="rounded-2xl border-indigo-500/30 bg-indigo-500/5 p-4 shadow-xs col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Avg Review Time</span>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/20 text-indigo-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">&lt; 24 Hours</span>
                  <p className="mt-1 text-[0.7rem] font-medium text-indigo-600">Verification SLA</p>
                </div>
              </Card>
            </div>

            {/* Single Row Unified Control & Filter Bar */}
            <Card className="rounded-2xl border-border bg-card p-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative min-w-[220px] flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, ID..."
                    value={approvalSearch}
                    onChange={(e) => setApprovalSearch(e.target.value)}
                    className="pl-8 h-9 rounded-xl text-xs bg-background"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Dropdown Select */}
                  <Select value={approvalTab} onValueChange={(v) => setApprovalTab(v as any)}>
                    <SelectTrigger className="w-52 h-9 rounded-xl text-xs bg-background font-medium">
                      <SelectValue placeholder="Application Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs">
                      <SelectItem value="All">All Statuses ({approvalPortalStats.all})</SelectItem>
                      <SelectItem value="Pending">Pending ({approvalPortalStats.pending})</SelectItem>
                      <SelectItem value="Awaiting Response">Awaiting Response ({approvalPortalStats.awaitingResponse})</SelectItem>
                      <SelectItem value="Approved">Approved ({approvalPortalStats.approved})</SelectItem>
                      <SelectItem value="Rejected">Rejected ({approvalPortalStats.rejected})</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Institution Filter */}
                  <Select value={approvalInstitutionFilter} onValueChange={setApprovalInstitutionFilter}>
                    <SelectTrigger className="w-44 h-9 rounded-xl text-xs bg-background">
                      <SelectValue placeholder="Institution" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs max-h-56">
                      <SelectItem value="All">All Institutions</SelectItem>
                      {uniqueInstitutions.map((inst) => (
                        <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Department Filter */}
                  <Select value={approvalDepartmentFilter} onValueChange={setApprovalDepartmentFilter}>
                    <SelectTrigger className="w-40 h-9 rounded-xl text-xs bg-background">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs max-h-56">
                      <SelectItem value="All">All Departments</SelectItem>
                      {uniqueDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort Filter */}
                  <Select value={approvalSort} onValueChange={(v) => setApprovalSort(v as any)}>
                    <SelectTrigger className="w-32 h-9 rounded-xl text-xs bg-background">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Enterprise Two-Panel Portal */}
            <div className="grid gap-6 lg:grid-cols-12 min-h-[600px]">
              {/* LEFT PANEL: Applications Directory Feed (5 cols) */}
              <Card className="lg:col-span-5 rounded-3xl border-border bg-card p-4 shadow-sm flex flex-col space-y-3 max-h-[750px] overflow-hidden">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {approvalTab} Applications ({filteredFacultyApprovalsList.length})
                  </span>
                  <Badge variant="outline" className="text-[0.65rem] font-semibold">
                    Click to select & inspect
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {filteredFacultyApprovalsList.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted/40 text-muted-foreground mx-auto">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">No applications in this tab</p>
                      <p className="text-[0.7rem] text-muted-foreground max-w-xs mx-auto">
                        No faculty applications match the active status tab "{approvalTab}" and filter criteria.
                      </p>
                    </div>
                  ) : (
                    filteredFacultyApprovalsList.map((f) => {
                      const isSelected = (selectedApprovalUser?.id === f.id || selectedApprovalUser?.email === f.email);
                      const fStatus = (f.status as string) || f.approvalStatus || "Pending";
                      return (
                        <div
                          key={f.id || f.email}
                          onClick={() => setSelectedApprovalUserId(f.id || f.email)}
                          className={`cursor-pointer rounded-2xl border p-3.5 transition-all space-y-2 ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                              : "border-border bg-background hover:border-primary/40 hover:bg-muted/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border border-border shrink-0">
                                <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                                  {f.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <h4 className="font-bold text-xs text-foreground truncate">{f.name}</h4>
                                <p className="text-[0.7rem] text-muted-foreground truncate">{f.designation || "Faculty Applicant"}</p>
                              </div>
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[0.62rem] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                                fStatus === "Active" || fStatus === "Approved"
                                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                  : fStatus === "Awaiting Applicant Response" || fStatus === "Info Requested"
                                  ? "border-blue-500/40 text-blue-600 bg-blue-500/10"
                                  : fStatus === "Rejected"
                                  ? "border-rose-500/40 text-rose-600 bg-rose-500/10"
                                  : "border-amber-500/40 text-amber-600 bg-amber-500/10"
                              }`}
                            >
                              {fStatus === "Awaiting Applicant Response" || fStatus === "Info Requested" ? "Awaiting Response" : fStatus}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-[0.7rem] text-muted-foreground pt-1 border-t border-border/40">
                            <p className="truncate font-medium text-foreground">
                              {f.institution || f.affiliation || "Not Provided"}
                            </p>
                            <div className="flex items-center justify-between pt-0.5">
                              <span>{f.department || "Not Provided"}</span>
                              <span className="text-[0.68rem] font-semibold text-primary flex items-center gap-0.5">
                                View Details <ChevronRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* RIGHT PANEL: Inspection Workspace (7 cols) */}
              <Card className="lg:col-span-7 rounded-3xl border-border bg-card p-6 shadow-sm flex flex-col justify-between space-y-6">
                {!selectedApprovalUser ? (
                  <div className="my-auto py-20 text-center space-y-3">
                    <div className="grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 text-primary mx-auto">
                      <UserCheck className="h-8 w-8" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">Select a Faculty Application</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Choose a faculty registration card from the left directory to inspect credentials, application history, and execute workflow actions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Selected Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
                      <div className="flex items-center gap-3.5">
                        <Avatar className="h-14 w-14 border-2 border-primary/20 shrink-0">
                          <AvatarFallback className="font-bold text-base bg-emerald-500/10 text-emerald-500">
                            {selectedApprovalUser.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-foreground">{selectedApprovalUser.name}</h3>
                            <Badge
                              variant="outline"
                              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                selectedApprovalUser.status === "Active" || selectedApprovalUser.approvalStatus === "Approved"
                                  ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                                  : selectedApprovalUser.status === "Awaiting Applicant Response" || selectedApprovalUser.approvalStatus === "Info Requested"
                                  ? "border-blue-500/40 text-blue-600 bg-blue-500/10"
                                  : selectedApprovalUser.status === "Rejected"
                                  ? "border-rose-500/40 text-rose-600 bg-rose-500/10"
                                  : "border-amber-500/40 text-amber-600 bg-amber-500/10"
                              }`}
                            >
                              {selectedApprovalUser.status === "Awaiting Applicant Response" || selectedApprovalUser.approvalStatus === "Info Requested" ? "Awaiting Response" : (selectedApprovalUser.status || selectedApprovalUser.approvalStatus || "Pending")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{selectedApprovalUser.email}</p>
                        </div>
                      </div>

                      {/* Workflow Action Buttons (Strictly status scoped) */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* PENDING: Show Approve, Reject, Request Info */}
                        {(selectedApprovalUser.status === "Pending" || selectedApprovalUser.approvalStatus === "Pending" || (!selectedApprovalUser.status && !selectedApprovalUser.approvalStatus)) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRequestReasonText("");
                                setRequestNotesText("");
                                setRequestInfoMsg("");
                                setRequestInfoDialogOpen(true);
                              }}
                              className="gap-1.5 rounded-xl text-xs font-semibold border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                            >
                              <HelpCircle className="h-3.5 w-3.5" /> Request Info
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectReasonText("");
                                setRejectDialogOpen(true);
                              }}
                              className="gap-1.5 rounded-xl text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10"
                            >
                              <Ban className="h-3.5 w-3.5" /> Reject
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => {
                                setApproveRemarks("");
                                setApproveDialogOpen(true);
                              }}
                              className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                          </>
                        )}

                        {/* AWAITING APPLICANT RESPONSE */}
                        {(selectedApprovalUser.status === "Awaiting Applicant Response" || selectedApprovalUser.approvalStatus === "Info Requested") && (
                          selectedApprovalUser.infoResponse?.trim() ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectReasonText("");
                                  setRejectDialogOpen(true);
                                }}
                                className="gap-1.5 rounded-xl text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10"
                              >
                                <Ban className="h-3.5 w-3.5" /> Reject Application
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => {
                                  setApproveRemarks("");
                                  setApproveDialogOpen(true);
                                }}
                                className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve Application
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-xl font-bold text-xs gap-1.5">
                              <Clock className="h-4 w-4 text-blue-500" /> Waiting for Applicant Response
                            </Badge>
                          )
                        )}

                        {/* APPROVED: Badge only */}
                        {(selectedApprovalUser.status === "Active" || selectedApprovalUser.approvalStatus === "Approved") && (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl font-bold text-xs gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Approved Faculty
                          </Badge>
                        )}

                        {/* REJECTED: Badge only */}
                        {(selectedApprovalUser.status === "Rejected" || selectedApprovalUser.approvalStatus === "Rejected") && (
                          <Badge variant="outline" className="border-rose-500/40 text-rose-600 bg-rose-500/10 px-3 py-1.5 rounded-xl font-bold text-xs gap-1.5">
                            <XCircle className="h-4 w-4 text-rose-500" /> Application Rejected
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Status Information Details Box */}
                    {(selectedApprovalUser.status === "Awaiting Applicant Response" || selectedApprovalUser.approvalStatus === "Info Requested") && (
                      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                            <HelpCircle className="h-4 w-4" /> Information Request Log
                          </span>
                          <span className="text-[0.68rem] text-muted-foreground">
                            Requested On: {new Date(selectedApprovalUser.requestedDate || selectedApprovalUser.updatedAt || Date.now()).toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[0.68rem] font-bold text-muted-foreground">Admin Request Message:</span>
                          <p className="text-foreground leading-relaxed pl-3 border-l-2 border-blue-500 font-medium">
                            "{selectedApprovalUser.adminMessage || selectedApprovalUser.infoRequestMessage || "Please update your verification proof document."}"
                          </p>
                        </div>

                        {selectedApprovalUser.infoResponse?.trim() ? (
                          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-1">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Applicant Response Submitted:
                            </span>
                            <p className="text-foreground font-semibold leading-relaxed pl-3 border-l-2 border-emerald-500">
                              "{selectedApprovalUser.infoResponse}"
                            </p>
                            <p className="text-[0.68rem] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                              Response received. Click Approve or Reject above to complete decision.
                            </p>
                          </div>
                        ) : (
                          <div className="text-[0.68rem] text-muted-foreground flex justify-between pt-1">
                            <span>Requested By: {selectedApprovalUser.requestedBy || "scholarnexusadmin@gmail.com"}</span>
                            <span className="font-semibold text-blue-600">Awaiting applicant update</span>
                          </div>
                        )}
                      </div>
                    )}

                    {(selectedApprovalUser.status === "Active" || selectedApprovalUser.approvalStatus === "Approved") && (
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" /> Approval Details
                          </span>
                          <span className="text-[0.68rem] text-muted-foreground">
                            Approved On: {new Date(selectedApprovalUser.approvalDate || selectedApprovalUser.updatedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed pl-5 border-l-2 border-emerald-500">
                          "{selectedApprovalUser.approvalReason || "Faculty credentials and institutional affiliation verified."}"
                        </p>
                        <p className="text-[0.68rem] text-muted-foreground pt-1">Approved By: {selectedApprovalUser.approvedBy || "scholarnexusadmin@gmail.com"}</p>
                      </div>
                    )}

                    {(selectedApprovalUser.status === "Rejected" || selectedApprovalUser.approvalStatus === "Rejected") && (
                      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                            <XCircle className="h-4 w-4" /> Rejection Record
                          </span>
                          <span className="text-[0.68rem] text-muted-foreground">
                            Rejected On: {new Date(selectedApprovalUser.rejectionDate || selectedApprovalUser.updatedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed pl-5 border-l-2 border-rose-500">
                          "{selectedApprovalUser.rejectionReason || selectedApprovalUser.approvalReason || "Credentials could not be authenticated."}"
                        </p>
                      </div>
                    )}

                    {/* Personal & Academic Cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary" /> Personal Information
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between"><span className="text-muted-foreground">Full Name:</span><span className="font-semibold text-foreground">{selectedApprovalUser.name}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-semibold text-foreground">{selectedApprovalUser.email}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span><span className="font-semibold text-foreground">{selectedApprovalUser.phone || "Not Provided"}</span></div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-indigo-500" /> Academic Information
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between"><span className="text-muted-foreground">Institution:</span><span className="font-semibold text-foreground truncate max-w-[160px]">{selectedApprovalUser.institution || selectedApprovalUser.affiliation || "Not Provided"}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Department:</span><span className="font-semibold text-foreground">{selectedApprovalUser.department || "Not Provided"}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Designation:</span><span className="font-semibold text-foreground">{selectedApprovalUser.designation || "Not Provided"}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Faculty ID:</span><span className="font-mono font-bold text-foreground">{selectedApprovalUser.facultyId || "Not Provided"}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Research Profile */}
                    <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-500" /> Research Profile
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-muted-foreground block font-medium">Research Interests:</span>
                          <span className="font-semibold text-foreground">{Array.isArray(selectedApprovalUser.researchInterests) ? selectedApprovalUser.researchInterests.join(", ") : (selectedApprovalUser.researchInterests || "Not Provided")}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block font-medium">Areas of Expertise:</span>
                          <span className="font-semibold text-foreground">{Array.isArray(selectedApprovalUser.areasOfExpertise) ? selectedApprovalUser.areasOfExpertise.join(", ") : (selectedApprovalUser.areasOfExpertise || "Not Provided")}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-border/50">
                          <span className="text-muted-foreground">ORCID iD:</span>
                          <span className="font-mono font-bold text-primary">{selectedApprovalUser.orcid || "Not Provided"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Documents */}
                    <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><FileCheck className="h-3.5 w-3.5 text-purple-500" /> Verification Documents</span>
                        <span className={`text-[0.65rem] font-semibold ${selectedApprovalUser.verificationDocument ? "text-emerald-500" : "text-amber-500"}`}>
                          {selectedApprovalUser.verificationDocument ? "Proof Uploaded" : "No Document Uploaded"}
                        </span>
                      </h4>

                      <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-card">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/10 text-purple-500 font-bold">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">Faculty ID Card / Institutional Proof</p>
                            <p className="text-[0.68rem] text-muted-foreground">
                              {selectedApprovalUser.verificationDocument ? "Verification Document File Attached" : "Applicant did not attach proof"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!selectedApprovalUser.verificationDocument}
                            onClick={() => setDocPreviewModalOpen(true)}
                            className="gap-1.5 rounded-xl text-xs font-semibold h-8"
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!selectedApprovalUser.verificationDocument}
                            onClick={() => handleDownloadDoc(selectedApprovalUser.verificationDocument, selectedApprovalUser.name)}
                            className="gap-1.5 rounded-xl text-xs font-semibold h-8"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Application History Timeline */}
                    <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-amber-500" /> Application History Timeline
                      </h4>

                      <div className="space-y-2">
                        {Array.isArray(selectedApprovalUser.applicationHistory) && selectedApprovalUser.applicationHistory.length > 0 ? (
                          selectedApprovalUser.applicationHistory.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 text-xs border-l-2 border-primary/30 pl-3 py-1">
                              <div className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary text-[0.6rem] font-bold shrink-0 mt-0.5">
                                {idx + 1}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground">{item.action}</span>
                                  <span className="text-[0.65rem] text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</span>
                                </div>
                                {item.details && <p className="text-[0.7rem] text-muted-foreground">"{item.details}"</p>}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-4 text-center text-xs">
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2 space-y-0.5">
                              <span className="font-bold text-[0.68rem] text-emerald-600">Application Created</span>
                              <p className="text-[0.62rem] text-muted-foreground">{new Date(selectedApprovalUser.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className={`rounded-xl border p-2 space-y-0.5 ${selectedApprovalUser.verificationDocument ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card opacity-60"}`}>
                              <span className={`font-bold text-[0.68rem] ${selectedApprovalUser.verificationDocument ? "text-emerald-600" : "text-muted-foreground"}`}>Documents Uploaded</span>
                              <p className="text-[0.62rem] text-muted-foreground">{selectedApprovalUser.verificationDocument ? "Uploaded" : "None"}</p>
                            </div>
                            <div className={`rounded-xl border p-2 space-y-0.5 ${selectedApprovalUser.status === "Awaiting Applicant Response" ? "border-blue-500/30 bg-blue-500/5" : "border-border bg-card opacity-60"}`}>
                              <span className={`font-bold text-[0.68rem] ${selectedApprovalUser.status === "Awaiting Applicant Response" ? "text-blue-600" : "text-muted-foreground"}`}>Info Requested</span>
                              <p className="text-[0.62rem] text-muted-foreground">{selectedApprovalUser.requestedDate ? new Date(selectedApprovalUser.requestedDate).toLocaleDateString() : "N/A"}</p>
                            </div>
                            <div className={`rounded-xl border p-2 space-y-0.5 ${selectedApprovalUser.status === "Active" ? "border-emerald-500/30 bg-emerald-500/5" : selectedApprovalUser.status === "Rejected" ? "border-rose-500/30 bg-rose-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
                              <span className={`font-bold text-[0.68rem] ${selectedApprovalUser.status === "Active" ? "text-emerald-600" : selectedApprovalUser.status === "Rejected" ? "text-rose-600" : "text-amber-600"}`}>
                                {selectedApprovalUser.status || "Pending"}
                              </span>
                              <p className="text-[0.62rem] text-muted-foreground">Current Status</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
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
                {/* System Admin Identity Card (Non-editable) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">System Administrator Governance Identity</h3>
                  <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <Avatar className="h-12 w-12 border border-primary/30">
                      <AvatarFallback className="font-bold bg-primary text-primary-foreground">SA</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">ScholarNexus System Administrator</span>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[0.65rem] font-bold">
                          Sole Admin Account
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">scholarnexusadmin@gmail.com</p>
                      <p className="text-[0.7rem] text-muted-foreground">Full system governance, user moderation, faculty approvals, and data security authorization.</p>
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

      {/* ── Enterprise User Profile Side Drawer ── */}
      <Sheet open={viewProfileDrawerOpen} onOpenChange={setViewProfileDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto rounded-l-3xl p-6 border-l border-border bg-card shadow-2xl">
          <SheetHeader className="pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-md">
                  <AvatarImage src={selectedUser?.displayName || ""} alt={selectedUser?.name} />
                  <AvatarFallback className="font-bold text-lg bg-primary/10 text-primary">
                    {selectedUser?.name ? selectedUser.name.slice(0, 2).toUpperCase() : "US"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    {selectedUser?.name || selectedUser?.displayName}
                    {(selectedUser?.role === "admin" || selectedUser?.email === session?.email) && (
                      <span title="Administrator Account"><ShieldCheck className="h-4 w-4 text-purple-500" /></span>
                    )}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">{selectedUser?.email}</SheetDescription>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={`capitalize text-xs px-2.5 py-0.5 rounded-full ${
                    selectedUser?.role === "admin"
                      ? "border-purple-500/40 text-purple-500 bg-purple-500/10"
                      : selectedUser?.role === "faculty"
                      ? "border-indigo-500/40 text-indigo-500 bg-indigo-500/10"
                      : "border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
                  }`}
                >
                  {selectedUser?.role}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-0.5 rounded-full ${
                    selectedUser?.status === "Active"
                      ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
                      : selectedUser?.status === "Pending"
                      ? "border-amber-500/40 text-amber-500 bg-amber-500/10"
                      : selectedUser?.status === "Suspended"
                      ? "border-destructive/40 text-destructive bg-destructive/10"
                      : "border-slate-500/40 text-slate-500 bg-slate-500/10"
                  }`}
                >
                  {selectedUser?.status || "Active"}
                </Badge>
              </div>
            </div>
          </SheetHeader>

          {loadingProfileDetails ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground text-xs">
              <RotateCw className="h-6 w-6 animate-spin text-primary" />
              <span>Fetching user profile, research stats & activity timeline…</span>
            </div>
          ) : (
            <Tabs defaultValue="profile" className="mt-6">
              <TabsList className="grid grid-cols-4 rounded-xl border border-border bg-background p-1 text-xs">
                <TabsTrigger value="profile" className="rounded-lg text-xs">Profile</TabsTrigger>
                <TabsTrigger value="academic" className="rounded-lg text-xs">Academic</TabsTrigger>
                <TabsTrigger value="research" className="rounded-lg text-xs">Research</TabsTrigger>
                <TabsTrigger value="timeline" className="rounded-lg text-xs">Timeline</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-4 space-y-4 text-xs">
                <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" /> Full Name</span>
                    <span className="font-semibold text-foreground">{selectedUser?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-blue-500" /> Email</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <span>{selectedUser?.email}</span>
                      <button
                        onClick={() => {
                          if (selectedUser?.email) {
                            navigator.clipboard.writeText(selectedUser.email);
                            toast.success("Email copied to clipboard.");
                          }
                        }}
                        className="text-muted-foreground hover:text-primary"
                        title="Copy Email"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-emerald-500" /> Phone Number</span>
                    <span className="font-medium text-foreground">{selectedUser?.phone || "+1 (555) 234-5678"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2"><Building className="h-3.5 w-3.5 text-indigo-500" /> Department</span>
                    <span className="font-medium text-foreground">{selectedUser?.department || selectedUser?.affiliation || "Computer Science & AI"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-amber-500" /> Designation</span>
                    <span className="font-medium text-foreground">{selectedUser?.designation || (selectedUser?.role === "student" ? "Research Scholar" : selectedUser?.role === "faculty" ? "Associate Professor" : "Lead System Admin")}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-purple-500" /> Role Governance</span>
                    <span className="font-semibold capitalize text-foreground">{selectedUser?.role}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-slate-500" /> Registration Date</span>
                    <span className="font-medium text-foreground">{selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-emerald-500" /> Last Login</span>
                    <span className="font-medium text-foreground">{selectedUser?.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : "Active today"}</span>
                  </div>
                </div>

                {selectedUser?.bio && (
                  <div className="rounded-2xl border border-border bg-background p-4 space-y-1">
                    <span className="font-semibold text-foreground">Biography</span>
                    <p className="text-muted-foreground leading-relaxed">{selectedUser.bio}</p>
                  </div>
                )}
              </TabsContent>

              {/* Academic Tab */}
              <TabsContent value="academic" className="mt-4 space-y-4 text-xs">
                {selectedUser?.role === "student" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Card className="p-3 rounded-2xl border-border bg-background text-center">
                        <span className="text-[0.7rem] text-muted-foreground">Assigned Faculty</span>
                        <p className="font-semibold text-foreground text-xs mt-1">{profileDetailsData?.academicInfo?.assignedFaculty || "Prof. Dr. Harrison"}</p>
                      </Card>
                      <Card className="p-3 rounded-2xl border-border bg-background text-center">
                        <span className="text-[0.7rem] text-muted-foreground">Total Projects</span>
                        <p className="text-lg font-bold text-primary mt-0.5">{profileDetailsData?.academicInfo?.totalProjects ?? 0}</p>
                      </Card>
                      <Card className="p-3 rounded-2xl border-border bg-background text-center">
                        <span className="text-[0.7rem] text-muted-foreground">Active Projects</span>
                        <p className="text-lg font-bold text-emerald-500 mt-0.5">{profileDetailsData?.academicInfo?.activeProjects ?? 0}</p>
                      </Card>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-2"><FolderKanban className="h-4 w-4 text-primary" /> Recent Student Projects</h4>
                      {profileDetailsData?.projects?.length === 0 ? (
                        <p className="text-muted-foreground py-2">No projects assigned yet.</p>
                      ) : (
                        profileDetailsData?.projects?.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-center p-2 rounded-xl bg-card border border-border text-xs">
                            <span className="font-medium text-foreground truncate max-w-xs">{p.title}</span>
                            <Badge variant="outline" className="text-[0.65rem] border-primary/30 text-primary">{p.status}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedUser?.role === "faculty" && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Card className="p-3 rounded-2xl border-border bg-background text-center">
                        <span className="text-[0.7rem] text-muted-foreground">Approval Status</span>
                        <Badge variant="outline" className="mt-1 text-[0.65rem] border-emerald-500/40 text-emerald-500 mx-auto block w-fit">{selectedUser.status || "Approved"}</Badge>
                      </Card>
                      <Card className="p-3 rounded-2xl border-border bg-background text-center">
                        <span className="text-[0.7rem] text-muted-foreground">Assigned Students</span>
                        <p className="text-lg font-bold text-indigo-500 mt-0.5">{profileDetailsData?.academicInfo?.assignedStudents?.length ?? 2}</p>
                      </Card>
                      <Card className="p-3 rounded-2xl border-border bg-background text-center">
                        <span className="text-[0.7rem] text-muted-foreground">Supervised Projects</span>
                        <p className="text-lg font-bold text-emerald-500 mt-0.5">{profileDetailsData?.academicInfo?.totalProjects ?? 0}</p>
                      </Card>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                      <h4 className="font-semibold text-foreground flex items-center gap-2"><BookOpen className="h-4 w-4 text-indigo-500" /> Research Interests</h4>
                      <p className="text-muted-foreground leading-relaxed">{selectedUser?.researchInterests || "Deep Learning Models, High-Performance Computing, Graph Neural Networks."}</p>
                    </div>
                  </div>
                )}

                {selectedUser?.role === "admin" && (
                  <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">System Privilege Level:</span><Badge variant="outline" className="border-purple-500/40 text-purple-500">Super Administrator</Badge></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Account Created:</span><span className="font-medium text-foreground">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Security Clearance:</span><span className="font-medium text-emerald-500">Level 5 (Full Administrative Access)</span></div>
                  </div>
                )}
              </TabsContent>

              {/* Research Summary Tab */}
              <TabsContent value="research" className="mt-4 space-y-4 text-xs">
                <div className="grid gap-3 sm:grid-cols-4">
                  <Card className="p-3 rounded-2xl border-border bg-background text-center">
                    <span className="text-[0.7rem] text-muted-foreground">Projects</span>
                    <p className="text-xl font-bold text-primary mt-1">{profileDetailsData?.researchSummary?.totalProjects ?? 0}</p>
                  </Card>
                  <Card className="p-3 rounded-2xl border-border bg-background text-center">
                    <span className="text-[0.7rem] text-muted-foreground">Papers</span>
                    <p className="text-xl font-bold text-purple-500 mt-1">{profileDetailsData?.researchSummary?.papersUploaded ?? 0}</p>
                  </Card>
                  <Card className="p-3 rounded-2xl border-border bg-background text-center">
                    <span className="text-[0.7rem] text-muted-foreground">Tasks</span>
                    <p className="text-xl font-bold text-emerald-500 mt-1">{profileDetailsData?.researchSummary?.tasksCompleted ?? 0}</p>
                  </Card>
                  <Card className="p-3 rounded-2xl border-border bg-background text-center">
                    <span className="text-[0.7rem] text-muted-foreground">Notes</span>
                    <p className="text-xl font-bold text-amber-500 mt-1">{profileDetailsData?.researchSummary?.notesCreated ?? 0}</p>
                  </Card>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2"><FileCheck className="h-4 w-4 text-purple-500" /> Uploaded Manuscripts</h4>
                  {profileDetailsData?.papers?.length === 0 ? (
                    <p className="text-muted-foreground py-2">No papers uploaded to repository yet.</p>
                  ) : (
                    profileDetailsData?.papers?.map((paper: any) => (
                      <div key={paper.id} className="p-2.5 rounded-xl bg-card border border-border space-y-1">
                        <span className="font-semibold text-foreground block">{paper.title}</span>
                        <p className="text-[0.7rem] text-muted-foreground">Authors: {paper.authors}</p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Activity Timeline Tab */}
              <TabsContent value="timeline" className="mt-4 space-y-4 text-xs">
                <div className="rounded-2xl border border-border bg-background p-4 space-y-4">
                  <h4 className="font-semibold text-foreground flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Chronological User Activity</h4>
                  <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {profileDetailsData?.activityTimeline?.length === 0 ? (
                      <div className="relative flex items-center gap-3 pl-8">
                        <div className="absolute left-1.5 h-3.5 w-3.5 rounded-full bg-primary" />
                        <div>
                          <p className="font-medium text-foreground">User Registration</p>
                          <p className="text-[0.7rem] text-muted-foreground">Account created on {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "ScholarNexus AI"}</p>
                        </div>
                      </div>
                    ) : (
                      profileDetailsData?.activityTimeline?.map((act: any) => (
                        <div key={act.id} className="relative flex items-start gap-3 pl-8">
                          <div className="absolute left-1.5 top-1 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background" />
                          <div>
                            <p className="font-medium text-foreground">{act.description}</p>
                            <p className="text-[0.7rem] text-muted-foreground">{new Date(act.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Enterprise Edit User Modal ── */}
      <Dialog open={editUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent className="rounded-3xl max-w-md bg-card p-6 border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Edit User Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify user department, designation, role, and account status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* Read Only Name */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                <Lock className="h-3 w-3" /> Full Name (Read-Only)
              </Label>
              <Input
                value={editUserData.name}
                disabled
                readOnly
                className="rounded-xl text-xs bg-muted text-muted-foreground cursor-not-allowed border-border"
              />
            </div>

            {/* Read Only Email */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
                <Lock className="h-3 w-3" /> Email Address (Read-Only)
              </Label>
              <Input
                value={editUserData.email}
                disabled
                readOnly
                className="rounded-xl text-xs bg-muted text-muted-foreground cursor-not-allowed border-border"
              />
            </div>

            {/* Department */}
            <div className="space-y-1">
              <Label className="text-xs">Department</Label>
              <Input
                placeholder="e.g. Computer Science & AI"
                value={editUserData.department}
                onChange={(e) => setEditUserData({ ...editUserData, department: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1">
              <Label className="text-xs">Designation / Title</Label>
              <Input
                placeholder="e.g. Research Scholar / Assoc. Professor"
                value={editUserData.designation}
                onChange={(e) => setEditUserData({ ...editUserData, designation: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <Input
                placeholder="e.g. +1 (555) 019-2834"
                value={editUserData.phone}
                onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            {/* Role */}
            <div className="space-y-1">
              <Label className="text-xs">Role Governance</Label>
              <Select
                value={editUserData.role}
                onValueChange={(v) => setEditUserData({ ...editUserData, role: v })}
                disabled={editUserData.role === "admin"}
              >
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  {editUserData.role === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label className="text-xs">Account Status</Label>
              <Select
                value={editUserData.status}
                onValueChange={(v) => setEditUserData({ ...editUserData, status: v })}
              >
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditUserModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button onClick={handleSaveUser} className="rounded-xl gradient-brand text-primary-foreground text-xs shadow-md">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Enterprise Action Confirmation Dialog ── */}
      <AlertDialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <AlertDialogContent className="rounded-3xl max-w-md bg-card p-6 border border-border shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold flex items-center gap-2">
              {confirmAction === "delete" ? (
                <span className="text-destructive flex items-center gap-2"><Trash2 className="h-5 w-5" /> Soft Delete User</span>
              ) : confirmAction === "suspend" ? (
                <span className="text-amber-500 flex items-center gap-2"><Ban className="h-5 w-5" /> Suspend User Account</span>
              ) : confirmAction === "activate" ? (
                <span className="text-emerald-500 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Activate User Account</span>
              ) : (
                <span className="text-primary flex items-center gap-2"><UserCheck className="h-5 w-5" /> Process Faculty Request</span>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {confirmAction === "delete" && (
                <>Are you sure you want to deactivate user account <span className="font-bold text-foreground">{confirmTargetUser?.email}</span>? The account will be marked as Soft Deleted and login will be blocked. All relational research data will be preserved.</>
              )}
              {confirmAction === "suspend" && (
                <>Are you sure you want to suspend account access for <span className="font-bold text-foreground">{confirmTargetUser?.email}</span>? The user will be unable to log in until reactivated.</>
              )}
              {confirmAction === "activate" && (
                <>Re-activate user account access for <span className="font-bold text-foreground">{confirmTargetUser?.email}</span>?</>
              )}
              {confirmAction === "approve" && (
                <>Approve faculty privileges for <span className="font-bold text-foreground">{confirmTargetUser?.name}</span> ({confirmTargetUser?.email})?</>
              )}
              {confirmAction === "reject" && (
                <>Reject faculty application for <span className="font-bold text-foreground">{confirmTargetUser?.name}</span> ({confirmTargetUser?.email})?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmAction === "reject" && (
            <div className="space-y-1.5 py-2">
              <Label className="text-xs">Rejection Reason (Optional)</Label>
              <Textarea
                placeholder="Reason for rejecting faculty application..."
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          )}

          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteConfirmedAction}
              className={`rounded-xl text-xs text-white ${
                confirmAction === "delete" || confirmAction === "reject"
                  ? "bg-destructive hover:bg-destructive/90"
                  : confirmAction === "suspend"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              Confirm {confirmAction === "delete" ? "Soft Delete" : confirmAction === "suspend" ? "Suspension" : confirmAction === "activate" ? "Activation" : confirmAction === "approve" ? "Approval" : "Rejection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Workflow Modal 1: Approve Faculty Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Approve Faculty Application
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Grant official Faculty Portal access and academic advisor credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-border bg-muted/20 p-3.5 text-xs space-y-1">
              <p className="font-bold text-foreground">{selectedApprovalUser?.name}</p>
              <p className="text-muted-foreground">{selectedApprovalUser?.institution || selectedApprovalUser?.affiliation} — {selectedApprovalUser?.department || "Computer Science"}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Optional Admin Remarks</Label>
              <Textarea
                placeholder="e.g. Credentials verified with Department Head office."
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
                className="rounded-xl text-xs min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
            <Button onClick={handleConfirmApprove} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Modal 2: Reject Faculty Dialog (Mandatory Reason) */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <Ban className="h-5 w-5" /> Reject Faculty Application
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Decline access to the Faculty Portal. A mandatory rejection reason is required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs space-y-1">
              <p className="font-bold text-foreground">{selectedApprovalUser?.name}</p>
              <p className="text-muted-foreground">{selectedApprovalUser?.email}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Rejection Reason *</span>
                <span className="text-[0.65rem] text-destructive font-bold">Mandatory</span>
              </Label>
              <Textarea
                placeholder="e.g. Verification document could not be authenticated with institutional registry."
                value={rejectReasonText}
                onChange={(e) => setRejectReasonText(e.target.value)}
                className="rounded-xl text-xs min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
            <Button
              disabled={!rejectReasonText.trim()}
              onClick={handleConfirmReject}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-xs"
            >
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workflow Modal 3: Request Additional Information Dialog */}
      <Dialog open={requestInfoDialogOpen} onOpenChange={setRequestInfoDialogOpen}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-blue-500 flex items-center gap-2">
              <HelpCircle className="h-5 w-5" /> Request Additional Information
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Specify what additional credentials or proof the applicant must update. Updates status to Awaiting Applicant Response.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs space-y-1">
              <p className="font-bold text-foreground">{selectedApprovalUser?.name}</p>
              <p className="text-muted-foreground">{selectedApprovalUser?.email}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Reason for Request *</span>
                <span className="text-[0.65rem] text-blue-600 font-bold">Mandatory</span>
              </Label>
              <Input
                placeholder="e.g. Please re-upload your official institutional faculty ID card or appointment letter."
                value={requestReasonText}
                onChange={(e) => setRequestReasonText(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Optional Notes / Specific Guidelines</Label>
              <Textarea
                placeholder="e.g. Ensure the document clearly displays your employee ID number, department seal, and current academic year."
                value={requestNotesText}
                onChange={(e) => setRequestNotesText(e.target.value)}
                className="rounded-xl text-xs min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRequestInfoDialogOpen(false)} className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
            <Button
              disabled={!requestReasonText.trim() && !requestInfoMsg.trim()}
              onClick={handleConfirmRequestInfo}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Document Preview Modal */}
      <Dialog open={docPreviewModalOpen} onOpenChange={setDocPreviewModalOpen}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-purple-500" /> Verification Document Preview
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Institutional proof submitted by <span className="font-semibold text-foreground">{selectedApprovalUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-center space-y-4">
            {selectedApprovalUser?.verificationDocument ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-black/5 dark:bg-white/5 max-h-[500px] flex items-center justify-center p-3">
                {selectedApprovalUser.verificationDocument.startsWith("data:application/pdf") || selectedApprovalUser.verificationDocument.endsWith(".pdf") ? (
                  <iframe
                    src={selectedApprovalUser.verificationDocument}
                    className="w-full h-[450px] rounded-xl border border-border"
                    title="PDF Document Preview"
                  />
                ) : (
                  <img
                    src={selectedApprovalUser.verificationDocument}
                    alt="Faculty Identification Proof"
                    className="max-h-[450px] w-auto object-contain rounded-xl shadow-md"
                  />
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-10 bg-muted/20 space-y-2">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto font-bold">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-foreground">No Document Uploaded</p>
                <p className="text-[0.7rem] text-muted-foreground max-w-xs mx-auto">
                  The applicant has not attached a faculty ID card or institutional proof document.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDocPreviewModalOpen(false)} className="rounded-xl text-xs font-semibold">
              Close Preview
            </Button>
            <Button
              disabled={!selectedApprovalUser?.verificationDocument}
              onClick={() => handleDownloadDoc(selectedApprovalUser?.verificationDocument, selectedApprovalUser?.name)}
              className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Download Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
