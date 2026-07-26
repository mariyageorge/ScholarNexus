import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  GitCompareArrows,
  GraduationCap,
  Inbox,
  Layers,
  LineChart,
  Loader2,
  MessageSquare,
  Network,
  Pencil,
  Plus,
  Quote,
  RefreshCcw,
  ScanSearch,
  Send,
  Settings,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project Workspace — ScholarNexus AI" },
      {
        name: "description",
        content: "Central research project command center for papers, AI assistant, literature synthesis, and faculty feedback.",
      },
    ],
  }),
  component: ProjectWorkspacePage,
});

export type ProjectStatus = "Planning" | "In Progress" | "Under Review" | "Completed" | "On Hold";

export interface Project {
  id: string;
  _id?: string;
  userEmail: string;
  title: string;
  description: string;
  domain: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  expectedCompletionDate: string;
  faculty?: string;
  createdAt: string;
  updatedAt: string;
}

interface FacultyMember {
  name: string;
  email?: string;
  title?: string;
  department?: string;
}

const STATUS_VARIANTS: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  Planning: {
    label: "Planning",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400",
    icon: Clock,
  },
  "In Progress": {
    label: "In Progress",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400",
    icon: TrendingUp,
  },
  "Under Review": {
    label: "Under Review",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-400",
    icon: AlertCircle,
  },
  Completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  "On Hold": {
    label: "On Hold",
    className: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/15 dark:text-slate-400",
    icon: Layers,
  },
};

const DOMAIN_OPTIONS = [
  "Artificial Intelligence",
  "Data Science & Analytics",
  "Quantum Computing",
  "Neuroscience & Cognitive Science",
  "Biomedical Engineering",
  "Cybersecurity & Privacy",
  "Environmental Science",
  "Robotics & Automation",
  "Physics & Astronomy",
  "Other / General",
];

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getMinCompletionDateString(startDateStr: string) {
  if (!startDateStr) return getTodayString();
  const d = new Date(startDateStr);
  if (isNaN(d.getTime())) return getTodayString();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function ProjectWorkspacePage() {
  const { projectId } = Route.useParams();
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") {
      return getUserSession();
    }
    return null;
  });

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);

  // Navigation state for active workspace section & sub-features
  const [activeMainTab, setActiveMainTab] = useState("overview");
  const [activePaperSubTab, setActivePaperSubTab] = useState("library");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const todayStr = getTodayString();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    domain: "Artificial Intelligence",
    status: "Planning" as ProjectStatus,
    progress: 0,
    startDate: todayStr,
    expectedCompletionDate: getMinCompletionDateString(todayStr),
    faculty: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setUser(session);
    fetchProject(session.email, projectId);
    fetchFacultyList();
  }, [projectId]);

  const fetchProject = async (email: string, id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const found = data.find(
            (p: Project) =>
              (p._id && String(p._id) === id) ||
              (p.id && String(p.id) === id) ||
              (p.id || p._id) === id
          );
          if (found) {
            setProject(found);
            populateForm(found);
          } else {
            setProject(null);
            toast.error("Project not found.");
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyList = async () => {
    try {
      const res = await fetch("/api/faculty-list");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFacultyList(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const populateForm = (p: Project) => {
    const start = p.startDate || getTodayString();
    setFormData({
      title: p.title || "",
      description: p.description || "",
      domain: p.domain || "Artificial Intelligence",
      status: p.status || "Planning",
      progress: Number(p.progress) || 0,
      startDate: start,
      expectedCompletionDate: p.expectedCompletionDate || getMinCompletionDateString(start),
      faculty: p.faculty || "",
    });
  };

  // Field Errors & Validation
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    const titleTrim = (formData.title || "").trim();
    if (!titleTrim) {
      errors.title = "Project Title is required.";
    } else if (titleTrim.length < 5) {
      errors.title = "Project Title must be at least 5 characters long.";
    } else if (titleTrim.length > 150) {
      errors.title = "Project Title cannot exceed 150 characters.";
    }

    if (!formData.domain || !formData.domain.trim()) {
      errors.domain = "Research Domain is required.";
    }

    if (!formData.status) {
      errors.status = "Project Status is required.";
    }

    const descTrim = (formData.description || "").trim();
    if (!descTrim) {
      errors.description = "Description is required.";
    } else if (descTrim.length < 20) {
      errors.description = "Description must be at least 20 characters long.";
    } else if (descTrim.length > 1000) {
      errors.description = "Description cannot exceed 1000 characters.";
    }

    const prog = Number(formData.progress);
    if (isNaN(prog) || prog < 0 || prog > 100) {
      errors.progress = "Progress must be between 0 and 100.";
    }

    if (!formData.startDate) {
      errors.startDate = "Start Date is required.";
    } else if (formData.startDate < todayStr) {
      errors.startDate = "Start Date cannot be a past date.";
    }

    if (!formData.expectedCompletionDate) {
      errors.expectedCompletionDate = "Expected Completion Date is required.";
    } else if (formData.startDate) {
      const startMs = new Date(formData.startDate).getTime();
      const completionMs = new Date(formData.expectedCompletionDate).getTime();
      if (isNaN(completionMs)) {
        errors.expectedCompletionDate = "Invalid completion date.";
      } else if (completionMs < startMs) {
        errors.expectedCompletionDate = "Expected Completion Date cannot be before Start Date.";
      } else {
        const diffDays = (completionMs - startMs) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          errors.expectedCompletionDate = "Expected Completion Date must be at least 7 days after Start Date.";
        }
      }
    }

    return errors;
  }, [formData, todayStr]);

  const isFormValid = useMemo(() => Object.keys(fieldErrors).length === 0, [fieldErrors]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleUpdateProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !project) return;

    setTouched({
      title: true,
      description: true,
      domain: true,
      status: true,
      progress: true,
      startDate: true,
      expectedCompletionDate: true,
    });

    if (!isFormValid) {
      const firstError = Object.values(fieldErrors)[0];
      toast.error(firstError || "Please resolve form validation errors.");
      return;
    }

    setSubmitting(true);
    try {
      const projId = project._id || project.id;
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
        },
        body: JSON.stringify({
          id: projId,
          userEmail: user.email,
          ...formData,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
        populateForm(updated);
        toast.success("Project updated successfully!");
        setIsEditModalOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update project.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating project.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!project || !user) return;
    setSubmitting(true);
    try {
      const projId = project._id || project.id;
      const newStatus: ProjectStatus = project.status === "Completed" ? "In Progress" : "Completed";
      const newProgress = newStatus === "Completed" ? 100 : project.progress;

      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
        },
        body: JSON.stringify({
          id: projId,
          userEmail: user.email,
          title: project.title,
          description: project.description,
          domain: project.domain,
          status: newStatus,
          progress: newProgress,
          startDate: project.startDate,
          expectedCompletionDate: project.expectedCompletionDate,
          faculty: project.faculty,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
        populateForm(updated);
        toast.success(`Project marked as ${newStatus}.`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating project status.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || !user) return;
    setSubmitting(true);
    try {
      const projId = project._id || project.id;
      const res = await fetch(
        `/api/projects?id=${encodeURIComponent(projId!)}&email=${encodeURIComponent(user.email)}`,
        {
          method: "DELETE",
          headers: {
            "x-user-email": user.email,
          },
        }
      );

      if (res.ok) {
        toast.success(`Project "${project.title}" deleted.`);
        window.location.href = "/projects";
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete project.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting project.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (typeof window !== "undefined" && !user) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px] space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px] flex flex-col items-center justify-center py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Project Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The requested research project does not exist or was deleted.
          </p>
          <Button onClick={() => (window.location.href = "/projects")} className="mt-6 gap-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Return to Projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusKey = project.status || "Planning";
  const statusCfg = STATUS_VARIANTS[statusKey] || STATUS_VARIANTS["Planning"];
  const StatusIcon = statusCfg.icon;

  const mainNavigationTabs = [
    { id: "overview", label: "Overview", icon: FolderKanban },
    { id: "papers", label: "Research Papers", icon: FileText },
    { id: "assistant", label: "AI Assistant", icon: Bot },
    { id: "faculty", label: "Faculty", icon: GraduationCap },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 pb-12">
        {/* Back Link */}
        <div>
          <Button
            onClick={() => (window.location.href = "/projects")}
            variant="ghost"
            size="sm"
            className="gap-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
          </Button>
        </div>

        {/* 2. Redesigned Premium Project Header Card */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-card/90 p-6 md:p-8 shadow-sm">
          <div className="absolute inset-0 grid-neural opacity-25" aria-hidden />
          <div
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />

          <div className="relative space-y-6">
            {/* Top Badges & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-border bg-muted/60 px-3 py-1 text-xs font-medium">
                  {project.domain || "General"}
                </Badge>
                <Badge variant="outline" className={`gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.className}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusCfg.label}
                </Badge>
              </div>

              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl border-border bg-card/80 backdrop-blur-md text-xs shadow-sm hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5 text-amber-500" /> Edit Project
              </Button>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
                {project.title}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-4xl">
                {project.description || "No description provided."}
              </p>
            </div>

            {/* Key Metadata Grid */}
            <div className="grid gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-muted-foreground">Progress Completion</span>
                  <span className="text-primary font-bold">{project.progress || 0}%</span>
                </div>
                <Progress value={project.progress || 0} className="h-2 rounded-full" />
              </div>

              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 backdrop-blur-md">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Faculty Mentor
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                  {project.faculty || "Independent Research"}
                </span>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 backdrop-blur-md">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Start Date
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  {formatDate(project.startDate)}
                </span>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 backdrop-blur-md">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Target Completion
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  {formatDate(project.expectedCompletionDate)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Clean 5 Navigation Cards/Buttons (No horizontal scrollbar) */}
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-card/60 border border-border/80 p-1.5 rounded-2xl shadow-sm h-auto">
            {mainNavigationTabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/50"
                >
                  <TabIcon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            {/* 5. Meaningful Research Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="group surface-elevated rounded-2xl border-border bg-card p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Uploaded Papers</p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">0</p>
                    <p className="text-[0.725rem] text-muted-foreground pt-1">Indexed literature</p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
              </Card>

              <Card className="group surface-elevated rounded-2xl border-border bg-card p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Research Progress</p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">{project.progress}%</p>
                    <p className="text-[0.725rem] text-muted-foreground pt-1">{project.status}</p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </Card>

              <Card className="group surface-elevated rounded-2xl border-border bg-card p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">AI Conversations</p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">0</p>
                    <p className="text-[0.725rem] text-muted-foreground pt-1">Queries in workspace</p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
              </Card>

              <Card className="group surface-elevated rounded-2xl border-border bg-card p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Faculty Feedback</p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      {project.faculty && project.faculty !== "Independent Research" ? 1 : 0}
                    </p>
                    <p className="text-[0.725rem] text-muted-foreground pt-1 font-medium truncate max-w-[140px]">
                      {project.faculty || "No mentor"}
                    </p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </div>

            {/* 7. Large Modern Quick Action Cards */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-foreground">Quick Research Actions</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card
                  onClick={() => {
                    setActiveMainTab("papers");
                    setActivePaperSubTab("library");
                  }}
                  className="group cursor-pointer rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/15 to-indigo-600/15 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-md"
                >
                  <div className="flex flex-col justify-between h-full space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-primary">Upload Research Paper</h4>
                      <p className="mt-1 text-[0.725rem] text-muted-foreground leading-snug">Index literature into this workspace</p>
                    </div>
                  </div>
                </Card>

                <Card
                  onClick={() => setActiveMainTab("assistant")}
                  className="group cursor-pointer rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/15 to-pink-600/15 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-purple-500/60 hover:shadow-md"
                >
                  <div className="flex flex-col justify-between h-full space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/20 text-purple-400">
                        <Bot className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-primary">Ask AI Assistant</h4>
                      <p className="mt-1 text-[0.725rem] text-muted-foreground leading-snug">Contextual paper synthesis & Q&A</p>
                    </div>
                  </div>
                </Card>

                <Card
                  onClick={() => {
                    setActiveMainTab("papers");
                    setActivePaperSubTab("comparison");
                  }}
                  className="group cursor-pointer rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-600/15 to-sky-600/15 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/60 hover:shadow-md"
                >
                  <div className="flex flex-col justify-between h-full space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-400">
                        <GitCompareArrows className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-primary">Compare Papers</h4>
                      <p className="mt-1 text-[0.725rem] text-muted-foreground leading-snug">Side-by-side empirical matrix</p>
                    </div>
                  </div>
                </Card>

                <Card
                  onClick={() => {
                    setActiveMainTab("papers");
                    setActivePaperSubTab("citations");
                  }}
                  className="group cursor-pointer rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/15 to-teal-600/15 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-md"
                >
                  <div className="flex flex-col justify-between h-full space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Quote className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-primary">Generate Citation</h4>
                      <p className="mt-1 text-[0.725rem] text-muted-foreground leading-snug">APA, MLA, Chicago, IEEE styles</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 6. Overview Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 surface-elevated rounded-2xl border-border bg-card p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-2">Project Description & Objectives</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-base font-bold text-foreground mb-3">Research Timeline & Milestones</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Current Completion ({project.progress}%)</span>
                      <span className="text-primary font-bold">{project.status}</span>
                    </div>
                    <Progress value={project.progress} className="h-2.5 rounded-full" />

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                        <span className="text-muted-foreground block mb-1">Start Date</span>
                        <span className="font-semibold text-foreground">{formatDate(project.startDate)}</span>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                        <span className="text-muted-foreground block mb-1">Expected Completion</span>
                        <span className="font-semibold text-foreground">{formatDate(project.expectedCompletionDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sidebar Block: Mentor & Recent Activity */}
              <div className="space-y-6">
                <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" /> Faculty Mentor
                  </h3>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      {project.faculty || "Independent Research"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.faculty ? "Assigned Academic Advisor & Reviewer" : "No external mentor assigned."}
                    </p>
                  </div>
                </Card>

                <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Recent Project Activity
                  </h3>
                  <div className="relative space-y-3 pl-4">
                    <span className="absolute left-1 top-1 bottom-1 w-0.5 bg-border" aria-hidden />
                    <div className="relative">
                      <span className="absolute -left-[1.25rem] top-1 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-xs font-semibold text-foreground">Project Workspace Initialized</p>
                      <p className="text-[0.7rem] text-muted-foreground">{formatDate(project.createdAt)}</p>
                    </div>
                    {project.updatedAt && (
                      <div className="relative">
                        <span className="absolute -left-[1.25rem] top-1 h-2 w-2 rounded-full bg-amber-500" />
                        <p className="text-xs font-semibold text-foreground">Project Parameters Updated</p>
                        <p className="text-[0.7rem] text-muted-foreground">{formatDate(project.updatedAt)}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: RESEARCH PAPERS (CONSOLIDATING ALL LITERATURE TOOLS) */}
          <TabsContent value="papers" className="space-y-6">
            <Tabs value={activePaperSubTab} onValueChange={setActivePaperSubTab} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3 gap-3">
                <TabsList className="rounded-xl bg-muted/60 p-1 flex-wrap">
                  <TabsTrigger value="library" className="rounded-lg text-xs font-semibold gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Paper Library
                  </TabsTrigger>
                  <TabsTrigger value="summaries" className="rounded-lg text-xs font-semibold gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Summaries
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="rounded-lg text-xs font-semibold gap-1.5">
                    <GitCompareArrows className="h-3.5 w-3.5" /> Comparison Matrix
                  </TabsTrigger>
                  <TabsTrigger value="citations" className="rounded-lg text-xs font-semibold gap-1.5">
                    <Quote className="h-3.5 w-3.5" /> Citations
                  </TabsTrigger>
                  <TabsTrigger value="similarity" className="rounded-lg text-xs font-semibold gap-1.5">
                    <ScanSearch className="h-3.5 w-3.5" /> Similarity Checker
                  </TabsTrigger>
                </TabsList>

                <Button onClick={() => toast.info("Paper upload capability will be enabled in a future release.")} size="sm" className="gap-1.5 rounded-xl bg-primary text-xs font-medium">
                  <Plus className="h-3.5 w-3.5" /> Upload Paper
                </Button>
              </div>

              {/* Sub-tab 1: Library */}
              <TabsContent value="library">
                <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-4 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-primary mb-4">
                    <FileText className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">No Research Papers Uploaded Yet</h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Upload PDFs or research documents to index literature into this project workspace.
                  </p>
                  <Button onClick={() => toast.info("Paper upload capability will be enabled in a future release.")} className="mt-6 gap-2 rounded-xl bg-primary text-primary-foreground">
                    <Plus className="h-4 w-4" /> Upload Research Paper
                  </Button>
                </Card>
              </TabsContent>

              {/* Sub-tab 2: Summaries */}
              <TabsContent value="summaries">
                <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-4 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-primary mb-4">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">AI Paper Summaries</h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    AI-generated paper summaries, key findings, and methodologies will appear here after research papers are uploaded.
                  </p>
                </Card>
              </TabsContent>

              {/* Sub-tab 3: Comparison */}
              <TabsContent value="comparison">
                <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-4 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-primary mb-4">
                    <GitCompareArrows className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Paper Comparison Matrix</h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Compare multiple uploaded research papers side-by-side across methodologies, sample sizes, and empirical conclusions.
                  </p>
                </Card>
              </TabsContent>

              {/* Sub-tab 4: Citations */}
              <TabsContent value="citations">
                <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-4 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-primary mb-4">
                    <Quote className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Citation Generator</h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Formatted citations in APA, MLA, Chicago, and IEEE styles will be automatically generated from literature added to this project.
                  </p>
                </Card>
              </TabsContent>

              {/* Sub-tab 5: Similarity */}
              <TabsContent value="similarity">
                <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-4 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-primary mb-4">
                    <ScanSearch className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Similarity & Overlap Reports</h3>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Document similarity scans and academic overlap analysis reports will be generated once project drafts or papers are submitted.
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* TAB 3: AI ASSISTANT */}
          <TabsContent value="assistant">
            <Card className="surface-elevated overflow-hidden rounded-2xl border-border bg-card">
              <div className="border-b border-border bg-muted/40 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">AI Research Assistant</h3>
                    <p className="text-[0.7rem] text-muted-foreground">Project Context: {project.title}</p>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full text-[0.65rem] border-primary/30 text-primary">
                  Ready for queries
                </Badge>
              </div>

              <div className="p-10 text-center flex flex-col items-center justify-center min-h-[320px]">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-purple-500/10 text-purple-400 mb-3">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h4 className="text-base font-bold text-foreground">Upload Research Papers to Start Asking AI Questions</h4>
                <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
                  The AI assistant reads and indexes literature linked to "{project.title}" to synthesize findings and answer research queries.
                </p>
              </div>

              <div className="border-t border-border p-4 flex gap-2">
                <Input placeholder="Upload research papers to start asking AI questions…" disabled className="rounded-xl text-xs bg-muted/50" />
                <Button disabled className="rounded-xl shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 4: FACULTY */}
          <TabsContent value="faculty" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> Assigned Faculty Mentor
                </h3>
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 space-y-2">
                  <p className="text-base font-bold text-foreground">
                    {project.faculty || "Independent Research"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.faculty ? "Assigned Academic Advisor & Reviewer" : "No external mentor assigned."}
                  </p>
                </div>
              </Card>

              <Card className="lg:col-span-2 surface-elevated rounded-2xl border-border bg-card p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-foreground">Faculty Feedback & Review Timeline</h3>
                  <p className="text-xs text-muted-foreground">
                    Comments, suggestions, and feedback timeline from assigned faculty advisor: {project.faculty || "Independent Study"}.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 px-4 text-center bg-card/40">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                  <h4 className="text-sm font-bold text-foreground">No Faculty Feedback Yet</h4>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    Faculty feedback and peer reviews for "{project.title}" will appear here when submitted by your advisor.
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 5: SETTINGS */}
          <TabsContent value="settings">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" /> Project Actions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage status, metadata, or visibility of this project.
                </p>

                <div className="space-y-3 pt-2">
                  <Button onClick={() => setIsEditModalOpen(true)} className="w-full justify-start gap-2 rounded-xl" variant="outline">
                    <Pencil className="h-4 w-4 text-amber-500" /> Edit Project Parameters
                  </Button>

                  <Button onClick={handleArchiveProject} className="w-full justify-start gap-2 rounded-xl" variant="outline">
                    <Archive className="h-4 w-4 text-blue-500" /> {project.status === "Completed" ? "Reopen Project (In Progress)" : "Mark as Completed"}
                  </Button>

                  <Button onClick={() => setIsDeleteDialogOpen(true)} className="w-full justify-start gap-2 rounded-xl text-destructive hover:bg-destructive/10" variant="outline">
                    <Trash2 className="h-4 w-4" /> Delete Project
                  </Button>
                </div>
              </Card>

              <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" /> Metadata & Information
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Project ID</span>
                    <span className="font-mono text-foreground">{project._id || project.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Owner Account</span>
                    <span className="font-medium text-foreground">{project.userEmail}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Created Date</span>
                    <span className="font-medium text-foreground">{formatDate(project.createdAt)}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium text-foreground">{formatDate(project.updatedAt || project.createdAt)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-border bg-card p-6 shadow-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Pencil className="h-5 w-5 text-primary" /> Edit Research Project
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update project parameters, status, or milestone progress.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProject} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                onBlur={() => handleBlur("title")}
                className={`rounded-xl text-sm ${
                  touched.title && fieldErrors.title ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
              />
              {touched.title && fieldErrors.title && (
                <p className="text-[0.75rem] text-destructive font-medium mt-1">{fieldErrors.title}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Domain <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.domain}
                  onValueChange={(val) => handleFieldChange("domain", val)}
                >
                  <SelectTrigger className={`rounded-xl text-xs ${touched.domain && fieldErrors.domain ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {DOMAIN_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.domain && fieldErrors.domain && (
                  <p className="text-[0.75rem] text-destructive font-medium mt-1">{fieldErrors.domain}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Status <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: ProjectStatus) => handleFieldChange("status", val)}
                >
                  <SelectTrigger className={`rounded-xl text-xs ${touched.status && fieldErrors.status ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Planning" className="text-xs">Planning</SelectItem>
                    <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                    <SelectItem value="Under Review" className="text-xs">Under Review</SelectItem>
                    <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                    <SelectItem value="On Hold" className="text-xs">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                {touched.status && fieldErrors.status && (
                  <p className="text-[0.75rem] text-destructive font-medium mt-1">{fieldErrors.status}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs font-semibold text-foreground">Progress Completion (%)</Label>
                <span className="text-xs font-bold text-primary">{formData.progress}%</span>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.progress}
                onChange={(e) => handleFieldChange("progress", Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                onBlur={() => handleBlur("progress")}
                className={`rounded-xl text-sm ${touched.progress && fieldErrors.progress ? "border-destructive" : ""}`}
              />
              {touched.progress && fieldErrors.progress && (
                <p className="text-[0.75rem] text-destructive font-medium mt-1">{fieldErrors.progress}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs font-semibold text-foreground">Description & Objectives <span className="text-destructive">*</span></Label>
                <span className="text-[0.7rem] text-muted-foreground">{formData.description.length}/1000</span>
              </div>
              <Textarea
                rows={3}
                maxLength={1000}
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                onBlur={() => handleBlur("description")}
                className={`rounded-xl text-xs ${touched.description && fieldErrors.description ? "border-destructive" : ""}`}
              />
              {touched.description && fieldErrors.description && (
                <p className="text-[0.75rem] text-destructive font-medium mt-1">{fieldErrors.description}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Start Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  min={todayStr}
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    const minCompletion = getMinCompletionDateString(newStart);
                    const newCompletion =
                      formData.expectedCompletionDate && formData.expectedCompletionDate >= minCompletion
                        ? formData.expectedCompletionDate
                        : minCompletion;
                    setFormData((prev) => ({
                      ...prev,
                      startDate: newStart,
                      expectedCompletionDate: newCompletion,
                    }));
                    setTouched((prev) => ({ ...prev, startDate: true, expectedCompletionDate: true }));
                  }}
                  onBlur={() => handleBlur("startDate")}
                  className={`rounded-xl text-xs ${touched.startDate && fieldErrors.startDate ? "border-destructive" : ""}`}
                />
                {touched.startDate && fieldErrors.startDate && (
                  <p className="text-[0.75rem] text-destructive font-medium mt-1">{fieldErrors.startDate}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Expected Completion Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  min={getMinCompletionDateString(formData.startDate)}
                  value={formData.expectedCompletionDate}
                  onChange={(e) => handleFieldChange("expectedCompletionDate", e.target.value)}
                  onBlur={() => handleBlur("expectedCompletionDate")}
                  className={`rounded-xl text-xs ${touched.expectedCompletionDate && fieldErrors.expectedCompletionDate ? "border-destructive" : ""}`}
                />
                {touched.expectedCompletionDate && fieldErrors.expectedCompletionDate && (
                  <p className="text-[0.75rem] text-destructive font-medium mt-1">{fieldErrors.expectedCompletionDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Faculty Mentor / Advisor</Label>
              <Select
                value={formData.faculty}
                onValueChange={(val) => setFormData({ ...formData, faculty: val === "none" ? "" : val })}
              >
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Assign a faculty mentor from database…" />
                </SelectTrigger>
                <SelectContent className="max-h-56 rounded-xl">
                  {facultyList.length > 0 ? (
                    facultyList.map((f) => (
                      <SelectItem key={f.email || f.name} value={f.name} className="text-xs">
                        {f.name} {f.title ? `— ${f.title}` : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled className="text-xs text-muted-foreground italic">
                      No faculty available
                    </SelectItem>
                  )}
                  <SelectItem value="Independent Research" className="text-xs italic">
                    Independent Research (No Mentor)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid || submitting} className="rounded-xl bg-primary text-primary-foreground">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-border bg-card p-6 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-destructive">
              Delete Research Project?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete <strong className="text-foreground">"{project.title}"</strong>? All project metadata will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={submitting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
