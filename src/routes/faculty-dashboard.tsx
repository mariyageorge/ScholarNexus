import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  FileCheck,
  Clock,
  ShieldCheck,
  Building,
  Calendar,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Mail,
  Edit,
  AlertCircle,
  FileText,
  Activity,
  ChevronRight,
  TrendingUp,
  Upload,
  MessageSquare,
} from "lucide-react";
import { getUserSession, setUserSession, getUserInitials, UserSession } from "@/lib/session";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty-dashboard")({
  head: () => ({
    meta: [
      { title: "Faculty Supervisor Dashboard — ScholarNexus AI" },
      { name: "description", content: "Academic faculty research portal and student supervision workspace." },
    ],
  }),
  component: FacultyDashboardHome,
});

interface SupervisedStudentItem {
  id: string;
  _id?: string;
  name: string;
  email: string;
  department: string;
  degreeProgram: string;
  activeProject: string;
  projectId: string;
  domain: string;
  progress: number;
  status: "Under Supervision";
  projectStatus: string;
  lastActivity: string;
  joinedDate: string;
}

interface ReviewItem {
  id: string;
  _id?: string;
  projectId?: string;
  projectTitle?: string;
  studentName?: string;
  studentEmail?: string;
  documentTitle?: string;
  fileType?: string;
  status?: string;
  requestedAt?: string;
  reviewedAt?: string;
  createdAt?: string;
  feedback?: string;
}

interface ActivityItem {
  id?: string;
  _id?: string;
  userName?: string;
  userEmail?: string;
  title?: string;
  action?: string;
  description?: string;
  details?: string;
  timestamp?: string;
  createdAt?: string;
}

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    }
    if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
    }
    return "Just now";
  } catch {
    return dateStr;
  }
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  let timeGreeting = "Good morning";
  if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
  else if (hour >= 17) timeGreeting = "Good evening";

  const firstName = name.split(" ")[0] || name;
  return `${timeGreeting}, ${firstName}`;
}

function AcademicResearchIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="acadGlow" cx="60%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
          <stop offset="45%" stopColor="#6366f1" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="laptopScreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
        <linearGradient id="laptopBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="book1Grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="book2Grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="book3Grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="leafGrad1" x1="0" y1="1" x2="0.8" y2="0">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="leafGrad2" x1="0" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="potGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>

      {/* Ambient background glow & desk reflection */}
      <ellipse cx="150" cy="70" rx="120" ry="60" fill="url(#acadGlow)" />
      <ellipse cx="140" cy="128" rx="120" ry="7" fill="#000000" fillOpacity="0.25" />

      {/* 1. Small Potted Plant (Left) */}
      <g id="plant">
        {/* Pot */}
        <path d="M 33 104 L 37 125 C 37 127 47 127 47 127 C 47 127 57 127 57 125 L 61 104 Z" fill="url(#potGrad)" />
        <rect x="31" y="100" width="32" height="4" rx="2" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
        {/* Plant Leaves */}
        <path d="M 44 100 C 28 92 20 74 27 64 C 36 71 44 87 45 100 Z" fill="url(#leafGrad1)" />
        <path d="M 46 98 C 38 78 37 58 47 48 C 53 60 51 81 48 98 Z" fill="url(#leafGrad2)" />
        <path d="M 48 96 C 53 74 60 54 70 47 C 72 61 63 81 50 96 Z" fill="url(#leafGrad1)" />
        <path d="M 50 98 C 63 90 76 81 78 69 C 72 81 60 91 52 100 Z" fill="url(#leafGrad2)" />
        <line x1="46" y1="98" x2="45" y2="56" stroke="#059669" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* 2. Stack of Academic Research Books (Center) */}
      <g id="books">
        {/* Book 1 (Bottom - Teal) */}
        <g id="book-bottom">
          <rect x="74" y="112" width="94" height="15" rx="3" fill="url(#book1Grad)" />
          <path d="M 74 112 C 70 112 70 127 74 127 L 78 127 L 78 112 Z" fill="#0f766e" />
          <rect x="79" y="114.5" width="86" height="10" rx="1" fill="#f8fafc" fillOpacity="0.9" />
          <line x1="83" y1="119.5" x2="160" y2="119.5" stroke="#cbd5e1" strokeWidth="0.75" />
          {/* Bookmark ribbon */}
          <path d="M 126 124 L 126 133 L 130 130.5 L 134 133 L 134 124 Z" fill="#f59e0b" />
        </g>

        {/* Book 2 (Middle - Indigo) */}
        <g id="book-middle">
          <rect x="78" y="93" width="84" height="16" rx="3" fill="url(#book2Grad)" />
          <path d="M 78 93 C 74 93 74 109 78 109 L 82 109 L 82 93 Z" fill="#3730a3" />
          <rect x="83" y="95.5" width="76" height="11" rx="1" fill="#f1f5f9" fillOpacity="0.92" />
          <line x1="87" y1="101" x2="154" y2="101" stroke="#cbd5e1" strokeWidth="0.75" />
          {/* Gold spine band */}
          <rect x="88" y="93" width="3" height="16" fill="#fbbf24" opacity="0.85" />
        </g>

        {/* Book 3 (Top - Sky/Cyan) */}
        <g id="book-top">
          <rect x="82" y="76" width="74" height="14" rx="3" fill="url(#book3Grad)" />
          <path d="M 82 76 C 78.5 76 78.5 90 82 90 L 85 90 L 85 76 Z" fill="#0369a1" />
          <rect x="86" y="78.5" width="67" height="9" rx="1" fill="#ffffff" fillOpacity="0.95" />
          <line x1="89" y1="83" x2="149" y2="83" stroke="#cbd5e1" strokeWidth="0.75" />
          {/* Cover emblem */}
          <circle cx="118" cy="83" r="2.5" fill="#38bdf8" />
        </g>
      </g>

      {/* 3. Open Modern Laptop (Right) */}
      <g id="laptop">
        {/* Screen Bezel */}
        <rect x="178" y="52" width="84" height="58" rx="4" fill="url(#laptopBody)" stroke="#475569" strokeWidth="1" />
        {/* Screen Display */}
        <rect x="182" y="56" width="76" height="50" rx="2" fill="url(#laptopScreen)" />
        {/* Screen UI Elements */}
        <rect x="186" y="60" width="68" height="4" rx="1" fill="#38bdf8" fillOpacity="0.6" />
        {/* Mini Chart Bars on Screen */}
        <rect x="188" y="86" width="5.5" height="14" rx="1" fill="#34d399" fillOpacity="0.9" />
        <rect x="196" y="78" width="5.5" height="22" rx="1" fill="#38bdf8" fillOpacity="0.95" />
        <rect x="204" y="72" width="5.5" height="28" rx="1" fill="#818cf8" fillOpacity="0.95" />
        <rect x="212" y="80" width="5.5" height="20" rx="1" fill="#a78bfa" fillOpacity="0.9" />
        {/* Mini text/code preview lines */}
        <line x1="223" y1="73" x2="250" y2="73" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.7" />
        <line x1="223" y1="79" x2="246" y2="79" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.6" />
        <line x1="223" y1="85" x2="249" y2="85" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.6" />
        <line x1="223" y1="91" x2="242" y2="91" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.5" />
        {/* Webcam */}
        <circle cx="220" cy="54" r="0.8" fill="#94a3b8" />
        {/* Laptop Keyboard Base */}
        <path d="M 166 112 L 268 112 L 260 126 L 174 126 Z" fill="#1e293b" stroke="#334155" strokeWidth="0.75" />
        <path d="M 174 114 L 260 114 L 257 117 L 177 117 Z" fill="#0f172a" fillOpacity="0.8" />
        <rect x="210" y="119" width="20" height="5" rx="1" fill="#0f172a" stroke="#475569" strokeWidth="0.5" />
      </g>

      {/* 4. Subtle Floating Sparkles & Particles */}
      <g id="sparkles">
        <path d="M 112 48 Q 112 55 105 55 Q 112 55 112 62 Q 112 55 119 55 Q 112 55 112 48 Z" fill="#38bdf8" fillOpacity="0.85" />
        <path d="M 264 42 Q 264 47 259 47 Q 264 47 264 52 Q 264 47 269 47 Q 264 47 264 42 Z" fill="#fbbf24" fillOpacity="0.85" />
        <circle cx="98" cy="42" r="1.5" fill="#34d399" fillOpacity="0.7" />
        <circle cx="268" cy="66" r="1.5" fill="#818cf8" fillOpacity="0.7" />
      </g>
    </svg>
  );
}

function FacultyDashboardHome() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic DB States
  const [requests, setRequests] = useState<any[]>([]);
  const [myStudentsList, setMyStudentsList] = useState<SupervisedStudentItem[]>([]);
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [activityList, setActivityList] = useState<ActivityItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    myStudents: 0,
    pendingRequests: 0,
    pendingReviews: 0,
    reviewedWork: 0,
  });

  const [dbUserStatus, setDbUserStatus] = useState<any | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Update Profile Modal States
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editInstitution, setEditInstitution] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editFacultyId, setEditFacultyId] = useState("");
  const [editResearchInterests, setEditResearchInterests] = useState("");
  const [editBio, setEditBio] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    const activeUser = getUserSession();
    if (!activeUser) {
      window.location.href = "/login";
      return;
    }
    if (activeUser.role === "admin" || activeUser.email === "scholarnexusadmin@gmail.com") {
      window.location.href = "/admin";
      return;
    }
    if (activeUser.role === "student") {
      window.location.href = "/dashboard";
      return;
    }
    const statusLower = (activeUser.status || activeUser.approvalStatus || "").toLowerCase();
    if (statusLower === "pending") {
      window.location.href = "/faculty-pending";
      return;
    }
    setSession(activeUser);
    setIsLoading(false);

    // 1. Fetch user profile status
    fetch(`/api/profile?email=${encodeURIComponent(activeUser.email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setDbUserStatus(data);
          setEditName(data.name || activeUser.name || "");
          setEditInstitution(data.institution || data.affiliation || "");
          setEditDepartment(data.department || "");
          setEditDesignation(data.designation || "");
          setEditFacultyId(data.facultyId || "");
          setEditResearchInterests(Array.isArray(data.researchInterests) ? data.researchInterests.join(", ") : (data.researchInterests || ""));
          setEditBio(data.bio || "");
          if (data.activityTimeline && Array.isArray(data.activityTimeline) && data.activityTimeline.length > 0) {
            setActivityList(data.activityTimeline);
          }
        }
      })
      .catch((err) => console.error("Error loading profile status:", err));

    // 2. Fetch dynamic supervisor dashboard data from MongoDB
    fetch(`/api/faculty/dashboard?email=${encodeURIComponent(activeUser.email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.stats) setDashboardStats(data.stats);
          if (data.requests) setRequests(data.requests);
          if (data.myStudentsList) setMyStudentsList(data.myStudentsList);
        }
      })
      .catch((err) => console.error("Error loading faculty dashboard DB data:", err));

    // 3. Fetch Reviews for THIS faculty
    fetch(`/api/reviews?facultyEmail=${encodeURIComponent(activeUser.email)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setReviewsList(data);
        }
      })
      .catch((err) => console.error("Error loading faculty reviews:", err));

    // 4. Fetch recent activity logs
    fetch(`/api/activity?email=${encodeURIComponent(activeUser.email)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setActivityList(data);
        }
      })
      .catch(() => {});

    // Check if navigated with ?edit=true URL param
    if (typeof window !== "undefined" && window.location.search.includes("edit=true")) {
      setUpdateModalOpen(true);
    }

    const handleOpenEditModal = () => setUpdateModalOpen(true);
    window.addEventListener("open-edit-profile-modal", handleOpenEditModal);

    return () => {
      window.removeEventListener("open-edit-profile-modal", handleOpenEditModal);
    };
  }, []);

  const handleSubmitClarification = async () => {
    if (!session) return;

    setSubmittingResponse(true);
    try {
      const payload: any = {
        email: session.email,
        name: editName.trim(),
        researchInterests: editResearchInterests.trim(),
        bio: editBio.trim(),
      };

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Profile details updated successfully.");
        setUpdateModalOpen(false);

        const updatedSession = {
          ...session,
          name: editName.trim(),
          researchInterests: editResearchInterests.trim(),
          bio: editBio.trim(),
        };
        setUserSession(updatedSession);
        setSession(updatedSession);
        setDbUserStatus((prev: any) => ({
          ...prev,
          name: editName.trim(),
          researchInterests: editResearchInterests.trim(),
          bio: editBio.trim(),
        }));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit profile update.");
      }
    } catch {
      toast.error("Network error submitting profile update.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const pendingRequestsList = requests.filter((r) => r.status === "Pending");
  const pendingReviewsList = reviewsList.filter((r) => r.status === "Pending Review");

  const isApproved = dbUserStatus
    ? dbUserStatus.approvalStatus === "Approved" || dbUserStatus.status === "Active" || dbUserStatus.status === undefined
    : session?.approvalStatus === "Approved" || session?.status === "Active" || true;
  const isInfoRequested = !isApproved && (dbUserStatus?.approvalStatus === "Info Requested" || dbUserStatus?.status === "Awaiting Applicant Response");

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const facultyName = dbUserStatus?.name || session?.displayName || session?.name || "Faculty Member";
  const facultyDesignation = dbUserStatus?.designation || session?.designation || "Academic Supervisor";
  const facultyDept = dbUserStatus?.department || session?.department || "Academic Department";
  const facultyInstitution = dbUserStatus?.institution || dbUserStatus?.affiliation || session?.institution || session?.affiliation || "Academic Institution";
  const userPhoto = dbUserStatus?.profileImage || dbUserStatus?.photoURL || session?.profileImage || session?.photoURL;

  const summaryCards = [
    {
      title: "Supervised Students",
      value: dashboardStats.myStudents.toString(),
      subText: "Active supervised scholars",
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      link: "/faculty/students",
    },
    {
      title: "Pending Requests",
      value: dashboardStats.pendingRequests.toString(),
      subText: "Supervision applications",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      link: "/faculty/supervision-requests",
    },
    {
      title: "Research Work to Review",
      value: (dashboardStats.pendingReviews ?? pendingReviewsList.length).toString(),
      subText: "Awaiting faculty feedback",
      icon: FileCheck,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      link: "/faculty/reviews",
    },
    {
      title: "Reviewed Work",
      value: dashboardStats.reviewedWork.toString(),
      subText: "Feedback published",
      icon: CheckCircle2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      link: "/faculty/reviews",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-7xl mx-auto pb-6">
        {/* 1. TOP WELCOME SECTION */}
        <Card className="rounded-3xl border border-border/80 bg-card p-6 md:p-7 shadow-sm relative overflow-hidden min-h-[195px] md:min-h-[210px] flex flex-col justify-center">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Avatar className="h-20 w-20 border-2 border-emerald-500/30 shadow-md ring-4 ring-emerald-500/10 shrink-0">
                {userPhoto ? (
                  <AvatarImage src={userPhoto} alt={facultyName} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-emerald-600 text-white font-bold text-2xl">
                  {getUserInitials(session || { email: "", role: "faculty", name: facultyName, profileCompleted: true })}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5">
                <h1 className="text-3xl sm:text-4xl lg:text-[2.35rem] font-bold tracking-tight text-foreground flex items-center gap-2 leading-tight">
                  {getGreeting(facultyName)} <span className="inline-block animate-bounce">👋</span>
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-teal-500/40 text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-0.5 font-bold text-xs gap-1.5 w-fit"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-500" /> Academic Supervisor
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm font-medium text-muted-foreground flex flex-wrap items-center gap-2">
                  <span>{facultyDesignation}</span>
                  <span>•</span>
                  <span>{facultyDept}</span>
                </p>

                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-normal">
                  <Building className="h-3.5 w-3.5 text-primary" /> {facultyInstitution}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center lg:items-center gap-5 lg:gap-7 border-t lg:border-t-0 border-border pt-4 lg:pt-0">
              <div className="flex flex-col sm:items-end gap-2 text-xs shrink-0">
                <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Calendar className="h-4 w-4 text-emerald-500" /> {currentDateFormatted}
                </div>
                {isApproved && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 font-semibold text-xs gap-1.5 w-fit"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Account Verified
                  </Badge>
                )}
              </div>

              <div className="hidden md:flex flex-col items-end gap-1 shrink-0 lg:pl-6 lg:border-l lg:border-border/60">
                <p className="text-[0.725rem] italic text-muted-foreground font-serif leading-relaxed text-right hidden xl:block">
                  "Empowering research.<br />Building tomorrow."
                </p>
                <AcademicResearchIllustration className="w-48 lg:w-56 xl:w-64 h-auto select-none pointer-events-none mt-1 opacity-95 transition-opacity hover:opacity-100" />
              </div>
            </div>
          </div>
        </Card>

        {/* Verification Alert Banner if Info Requested */}
        {isInfoRequested && !bannerDismissed && (
          <Card className="rounded-xl border-blue-500/40 bg-blue-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500 text-white shrink-0 font-bold">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-blue-700 dark:text-blue-300 text-xs sm:text-sm">Administrator requested additional information</p>
                <p className="text-muted-foreground truncate max-w-xl text-[0.725rem] mt-0.5">
                  Reason: "{dbUserStatus?.adminMessage || dbUserStatus?.infoRequestMessage || "Please upload your institutional ID card or updated appointment letter."}"
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBannerDismissed(true)}
                className="rounded-xl text-xs font-semibold h-7"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => setUpdateModalOpen(true)}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-xs h-7"
              >
                Update Application
              </Button>
            </div>
          </Card>
        )}

        {/* 2. KPI CARDS */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((s) => (
            <Link key={s.title} to={s.link} className="block group">
              <Card
                className={`rounded-2xl border ${s.border} bg-card p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/40 h-full flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <div className={`grid h-8 w-8 place-items-center rounded-xl ${s.bg} ${s.color}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>

                <div className="mt-2.5 space-y-0.5">
                  <span className="text-xs font-semibold text-muted-foreground block">{s.title}</span>
                  <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{s.value}</div>
                  <p className="text-[0.68rem] text-muted-foreground font-medium">{s.subText}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* 3 & 4. TOP ROW: ACTION REQUIRED + RESEARCH WORK TO REVIEW */}
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          {/* Section 3: Action Required */}
          <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/10 text-rose-500">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Action Required</h3>
                  <p className="text-[0.7rem] text-muted-foreground">Pending supervision applications</p>
                </div>
              </div>

              <Link
                to="/faculty/supervision-requests"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {pendingRequestsList.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[0.6rem] font-bold text-white shrink-0">
                    {pendingRequestsList.length}
                  </span>
                  <span className="text-[0.725rem]">Supervision request awaiting your response</span>
                </div>

                <div className="space-y-2.5">
                  {pendingRequestsList.slice(0, 3).map((req) => (
                    <div
                      key={req.id || req._id}
                      className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-2 hover:border-primary/40 transition-all shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border border-border bg-purple-500/10 text-purple-600 font-bold text-xs shrink-0">
                            <AvatarFallback className="bg-purple-500/10 text-purple-600 font-bold text-[0.65rem]">
                              {getUserInitials({ name: req.studentName || "Student", email: req.studentEmail || "", role: "student", profileCompleted: true })}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-bold text-foreground text-xs leading-tight">{req.studentName}</h4>
                            <p className="text-[0.68rem] text-muted-foreground">{req.studentEmail || req.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-left sm:text-right">
                            <span className="font-semibold text-foreground text-xs block truncate max-w-[150px]">{req.projectTitle}</span>
                            <span className="text-[0.65rem] text-muted-foreground block">Domain: {req.domain}</span>
                          </div>

                          <Button
                            asChild
                            size="sm"
                            className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-2.5 gap-1 shrink-0 ml-1"
                          >
                            <Link to="/faculty/supervision-requests">
                              Review <ArrowRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {req.message && (
                        <p className="text-[0.7rem] text-muted-foreground bg-muted/30 p-1.5 rounded-md border border-border/50 line-clamp-1 italic">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center border border-dashed border-border/80 rounded-xl space-y-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto opacity-60 mb-0.5" />
                <p className="text-xs font-bold text-foreground">No Pending Requests</p>
                <p className="text-[0.68rem] text-muted-foreground max-w-xs mx-auto">
                  All student supervision applications have been reviewed.
                </p>
              </div>
            )}
          </Card>

          {/* Section 4: Research Work to Review */}
          <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-purple-500/10 text-purple-500">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Research Work to Review</h3>
                  <p className="text-[0.7rem] text-muted-foreground">Manuscripts awaiting your feedback</p>
                </div>
              </div>

              <Link
                to="/faculty/reviews"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {pendingReviewsList.length > 0 ? (
              <div className="space-y-2.5">
                {pendingReviewsList.slice(0, 3).map((work) => (
                  <div
                    key={work.id || work._id}
                    className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-2 hover:border-primary/40 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/10 text-purple-500 shrink-0 mt-0.5">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground text-xs truncate">
                              {work.fileType || "Conference Paper"}
                            </span>
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-[0.6rem] font-bold px-1.5 py-0 shrink-0"
                            >
                              Pending Review
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-foreground truncate">
                            {work.documentTitle || work.projectTitle || "Research Manuscript"}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[0.68rem] text-muted-foreground pt-0.5">
                            <span>Student: <strong className="text-foreground">{work.studentName || "Scholar"}</strong></span>
                            <span>•</span>
                            <span>{formatRelativeTime(work.requestedAt || work.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-7 px-2.5 gap-1 shrink-0"
                      >
                        <Link to="/faculty/reviews">
                          Review <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center border border-dashed border-border/80 rounded-xl space-y-1">
                <FileCheck className="h-6 w-6 text-primary mx-auto opacity-60 mb-0.5" />
                <p className="text-xs font-bold text-foreground">No Research Work Awaiting Review</p>
                <p className="text-[0.68rem] text-muted-foreground max-w-xs mx-auto">
                  All submitted manuscripts and papers have received your feedback.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* 5 & 6. BOTTOM ROW: MY SUPERVISED STUDENTS + RECENT ACTIVITY */}
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          {/* Section 5: My Supervised Students */}
          <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">My Supervised Students</h3>
                  <p className="text-[0.7rem] text-muted-foreground">Students currently under your academic supervision</p>
                </div>
              </div>

              <Link
                to="/faculty/students"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {myStudentsList.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border/80 rounded-xl space-y-1.5">
                <GraduationCap className="h-7 w-7 text-muted-foreground mx-auto opacity-40 mb-0.5" />
                <p className="text-xs font-bold text-foreground">No Supervised Students Assigned Yet</p>
                <p className="text-[0.68rem] text-muted-foreground max-w-xs mx-auto">
                  Students will appear here once you approve their supervision requests under Supervision Requests.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myStudentsList.slice(0, 3).map((student) => (
                  <div
                    key={student.id || student._id}
                    className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-2 hover:border-emerald-500/40 transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold text-xs shrink-0">
                          <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-bold text-[0.65rem]">
                            {getUserInitials({ name: student.name, email: student.email, role: "student", profileCompleted: true })}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-foreground text-xs leading-tight">{student.name}</h4>
                          <p className="text-[0.68rem] text-muted-foreground flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5" /> {student.email}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[0.65rem] font-bold w-fit py-0"
                      >
                        Under Supervision
                      </Badge>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-card/60 p-2.5 space-y-1.5 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 text-muted-foreground">
                        <span className="text-[0.68rem]">Research Project:</span>
                        <span className="font-semibold text-foreground truncate max-w-xs">{student.activeProject}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 text-muted-foreground">
                        <span className="text-[0.68rem]">Domain:</span>
                        <span className="font-medium text-foreground">{student.domain}</span>
                      </div>
                      <div className="space-y-1 pt-0.5">
                        <div className="flex justify-between text-[0.65rem] font-semibold text-muted-foreground">
                          <span>Project Progress</span>
                          <span className="text-foreground font-bold">{student.progress}%</span>
                        </div>
                        <Progress value={student.progress} className="h-1.5 rounded-full" />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5 text-xs">
                      <span className="text-[0.65rem] text-muted-foreground">
                        Last Activity: <strong className="text-foreground">{student.lastActivity}</strong>
                      </span>

                      <Button
                        size="sm"
                        onClick={() => {
                          window.location.href = `/faculty/students?studentId=${student.id}&projectId=${student.projectId}`;
                        }}
                        className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-7 px-2.5"
                      >
                        <BookOpen className="h-3 w-3" /> View Workspace
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section 6: Recent Activity */}
          <Card className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/10 text-blue-500">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
                  <p className="text-[0.7rem] text-muted-foreground">Latest research events and submissions</p>
                </div>
              </div>

              <Link
                to="/notifications"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {activityList.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border/80 rounded-xl space-y-1">
                <Activity className="h-6 w-6 text-blue-500 mx-auto opacity-60 mb-0.5" />
                <p className="text-xs font-bold text-foreground">No Recent Activity</p>
                <p className="text-[0.68rem] text-muted-foreground max-w-xs mx-auto">
                  Recent student updates, document uploads, and review actions will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activityList.slice(0, 5).map((act, index) => {
                  const isReview = (act.title || act.action || "").toLowerCase().includes("review");
                  const isUpload = (act.title || act.action || "").toLowerCase().includes("upload") || (act.title || act.action || "").toLowerCase().includes("paper");
                  const isProgress = (act.title || act.action || "").toLowerCase().includes("progress") || (act.title || act.action || "").toLowerCase().includes("project");

                  const IconComp = isReview ? FileCheck : isUpload ? FileText : isProgress ? TrendingUp : Activity;
                  const iconColor = isReview ? "text-purple-500 bg-purple-500/10" : isUpload ? "text-cyan-500 bg-cyan-500/10" : isProgress ? "text-emerald-500 bg-emerald-500/10" : "text-blue-500 bg-blue-500/10";

                  return (
                    <div
                      key={act.id || act._id || index}
                      className="rounded-xl border border-border/60 bg-background/50 p-2.5 flex items-start gap-2.5 hover:border-primary/40 transition-colors"
                    >
                      <div className={`grid h-7 w-7 place-items-center rounded-lg ${iconColor} shrink-0 mt-0.5`}>
                        <IconComp className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 space-y-0.5 text-xs min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="font-semibold text-foreground text-xs leading-tight truncate">
                            <span className="font-bold text-foreground">{act.userName || act.userEmail?.split("@")[0] || "Scholar"}</span>{" "}
                            <span className="font-normal text-muted-foreground">{act.action || act.title || "recorded an activity"}</span>
                          </p>
                          <span className="text-[0.65rem] text-muted-foreground/80 shrink-0 font-medium">
                            {formatRelativeTime(act.timestamp || act.createdAt)}
                          </span>
                        </div>
                        {act.description && (
                          <p className="text-[0.7rem] text-muted-foreground line-clamp-1">
                            {act.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* FOCUSED FACULTY PROFILE EDIT MODAL */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" /> Update Faculty Profile Information
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update your editable profile details (Name, Primary Research Interests, Academic Bio). Institutional details are verified and read-only.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Faculty Name"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Institution Name (Read Only)</Label>
                <Input
                  value={editInstitution}
                  readOnly
                  disabled
                  className="rounded-xl text-xs bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Department (Read Only)</Label>
                <Input
                  value={editDepartment}
                  readOnly
                  disabled
                  className="rounded-xl text-xs bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Designation / Title (Read Only)</Label>
                <Input
                  value={editDesignation}
                  readOnly
                  disabled
                  className="rounded-xl text-xs bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Faculty Employee ID (Read Only)</Label>
                <Input
                  value={editFacultyId}
                  readOnly
                  disabled
                  className="rounded-xl text-xs font-mono bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Primary Research Interests</Label>
              <Input
                value={editResearchInterests}
                onChange={(e) => setEditResearchInterests(e.target.value)}
                placeholder="e.g. AI, Machine Learning, Computer Vision"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Academic Bio & Objectives</Label>
              <Textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Provide a summary of your academic background, research objectives..."
                className="rounded-xl text-xs leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpdateModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitClarification}
              disabled={submittingResponse}
              className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs gap-1.5"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
