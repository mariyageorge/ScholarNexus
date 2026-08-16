import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  AlertCircle,
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FolderKanban,
  GraduationCap,
  Layers,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Research Projects — ScholarNexus AI" },
      {
        name: "description",
        content: "Plan, track, and manage your academic research projects with AI insights.",
      },
    ],
  }),
  component: ProjectsRouteLayout,
});

function ProjectsRouteLayout() {
  const matches = useMatches();
  const isWorkspaceRoute = matches.some((m) => m.routeId.includes("$projectId"));

  if (isWorkspaceRoute) {
    return <Outlet />;
  }

  return <ResearchProjectsPage />;
}

export type ProjectStatus = "Planning" | "In Progress" | "Under Review" | "Completed" | "On Hold";

export interface Project {
  id: string;
  _id?: string;
  userEmail: string;
  title: string;
  description: string;
  abstract?: string;
  domain: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  expectedCompletionDate: string;
  facultyId?: string | null;
  faculty?: string | null;
  supervisionStatus?: "Not Assigned" | "Pending Approval" | "Under Supervision" | "Rejected";
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
}

interface FacultyMember {
  name: string;
  email?: string;
  title?: string;
  department?: string;
}

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
    className: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/15 dark:text-primary",
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

function ResearchProjectsPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") {
      return getUserSession();
    }
    return null;
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("updated");

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = getTodayString();

  // Form Fields State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    domain: "Artificial Intelligence",
    status: "Planning" as ProjectStatus,
    progress: 0,
    startDate: todayStr,
    expectedCompletionDate: getMinCompletionDateString(todayStr),
    keywords: "",
  });

  // Form Touch Tracking (Shows validation errors ONLY when invalid and touched or upon form submit)
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setUser(session);
    fetchProjects(session.email);
    fetchFacultyList();

    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "create" || params.get("create") === "true") {
      openCreateModal();
    }
  }, []);

  const fetchProjects = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          setProjects([]);
        }
      } else {
        setProjects([]);
        toast.error("Failed to load research projects.");
      }
    } catch (err) {
      console.error(err);
      setProjects([]);
      toast.error("Network error while loading projects.");
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

  // Field Level Validation Logic
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    // Title: Required, min 5 chars, max 150 chars
    const titleTrim = (formData.title || "").trim();
    if (!titleTrim) {
      errors.title = "Project Title is required.";
    } else if (titleTrim.length < 5) {
      errors.title = "Project Title must be at least 5 characters long.";
    } else if (titleTrim.length > 150) {
      errors.title = "Project Title cannot exceed 150 characters.";
    }

    // Research Domain: Required
    if (!formData.domain || !formData.domain.trim()) {
      errors.domain = "Research Domain is required.";
    }

    // Status: Required
    if (!formData.status) {
      errors.status = "Project Status is required.";
    }

    // Description: Required, min 20 chars, max 1000 chars
    const descTrim = (formData.description || "").trim();
    if (!descTrim) {
      errors.description = "Description is required.";
    } else if (descTrim.length < 20) {
      errors.description = "Description must be at least 20 characters long.";
    } else if (descTrim.length > 1000) {
      errors.description = "Description cannot exceed 1000 characters.";
    }

    // Progress: Number 0 - 100
    const prog = Number(formData.progress);
    if (isNaN(prog) || prog < 0 || prog > 100) {
      errors.progress = "Progress must be between 0 and 100.";
    }

    // Start Date: Required, cannot be a past date
    if (!formData.startDate) {
      errors.startDate = "Start Date is required.";
    } else if (formData.startDate < todayStr) {
      errors.startDate = "Start Date cannot be a past date.";
    }

    // Expected Completion Date: Required, >= startDate, >= startDate + 7 days
    if (!formData.expectedCompletionDate) {
      errors.expectedCompletionDate = "Expected Completion Date is required.";
    } else if (formData.startDate) {
      const startMs = new Date(formData.startDate).getTime();
      const completionMs = new Date(formData.expectedCompletionDate).getTime();
      if (isNaN(completionMs)) {
        errors.expectedCompletionDate = "Invalid completion date.";
      } else if (completionMs < startMs) {
        errors.expectedCompletionDate = "Expected Completion Date cannot be before the Start Date.";
      } else {
        const diffDays = (completionMs - startMs) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          errors.expectedCompletionDate = "Expected Completion Date must be at least 7 days after the Start Date.";
        }
      }
    }

    return errors;
  }, [formData, todayStr]);

  const isFormValid = useMemo(() => {
    return Object.keys(fieldErrors).length === 0;
  }, [fieldErrors]);

  // Safe Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    return list
      .filter((p) => {
        if (!p || typeof p !== "object") return false;
        const pStatus = p.status || "Planning";
        const matchesStatus =
          selectedStatusFilter === "All" || pStatus === selectedStatusFilter;

        const q = (searchQuery || "").toLowerCase().trim();
        const title = (p.title || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const domain = (p.domain || "").toLowerCase();
        const faculty = (p.faculty || "").toLowerCase();

        const matchesSearch =
          !q ||
          title.includes(q) ||
          desc.includes(q) ||
          domain.includes(q) ||
          faculty.includes(q);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const progA = Number(a?.progress) || 0;
        const progB = Number(b?.progress) || 0;
        if (sortBy === "progress-desc") return progB - progA;
        if (sortBy === "progress-asc") return progA - progB;
        if (sortBy === "title") return (a?.title || "").localeCompare(b?.title || "");
        if (sortBy === "created") return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
        return new Date(b?.updatedAt || b?.createdAt || 0).getTime() - new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      });
  }, [projects, selectedStatusFilter, searchQuery, sortBy]);

  // Safe Overall Statistics
  const stats = useMemo(() => {
    const safeList = Array.isArray(projects) ? projects : [];
    const total = safeList.length;
    const inProgress = safeList.filter((p) => p?.status === "In Progress").length;
    const underReview = safeList.filter((p) => p?.status === "Under Review").length;
    const completed = safeList.filter((p) => p?.status === "Completed").length;
    const avgProgress =
      total > 0
        ? Math.round(safeList.reduce((acc, p) => acc + (Number(p?.progress) || 0), 0) / total)
        : 0;

    return { total, inProgress, underReview, completed, avgProgress };
  }, [projects]);

  const openCreateModal = () => {
    setEditingProject(null);
    setTouched({});
    const start = getTodayString();
    setFormData({
      title: "",
      description: "",
      domain: "Artificial Intelligence",
      status: "Planning",
      progress: 0,
      startDate: start,
      expectedCompletionDate: getMinCompletionDateString(start),
      keywords: "",
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setTouched({});
    const start = project.startDate || getTodayString();
    setFormData({
      title: project.title || "",
      description: project.description || "",
      domain: project.domain || "Artificial Intelligence",
      status: project.status || "Planning",
      progress: Number(project.progress) || 0,
      startDate: start,
      expectedCompletionDate: project.expectedCompletionDate || getMinCompletionDateString(start),
      keywords: Array.isArray(project.keywords) ? project.keywords.join(", ") : "",
    });
    setIsFormModalOpen(true);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Mark all fields as touched to display errors if any remain
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
      toast.error(firstError || "Please fix all validation errors before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingProject) {
        const res = await fetch("/api/projects", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": user.email,
          },
          body: JSON.stringify({
            id: editingProject.id || editingProject._id,
            userEmail: user.email,
            ...formData,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setProjects((prev) =>
            Array.isArray(prev)
              ? prev.map((p) => ((p.id || p._id) === (updated.id || updated._id) ? updated : p))
              : [updated]
          );
          toast.success("Research project updated successfully!");
          setIsFormModalOpen(false);
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to update project.");
        }
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": user.email,
          },
          body: JSON.stringify({
            userEmail: user.email,
            ...formData,
          }),
        });

        if (res.ok) {
          const newProj = await res.json();
          setProjects((prev) => (Array.isArray(prev) ? [newProj, ...prev] : [newProj]));
          toast.success("New research project created successfully!");
          setIsFormModalOpen(false);
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to create project.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject || !user) return;

    setSubmitting(true);
    try {
      const projId = deletingProject.id || deletingProject._id;
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
        setProjects((prev) =>
          Array.isArray(prev) ? prev.filter((p) => (p.id || p._id) !== projId) : []
        );
        toast.success(`Project "${deletingProject.title}" deleted successfully.`);
        setDeletingProject(null);
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

  const handleArchiveProject = async (p: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) return;
    try {
      const projId = p._id || p.id;
      const newStatus: ProjectStatus = p.status === "Completed" ? "In Progress" : "Completed";
      const newProgress = newStatus === "Completed" ? 100 : p.progress;

      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
        },
        body: JSON.stringify({
          id: projId,
          userEmail: user.email,
          title: p.title,
          description: p.description,
          domain: p.domain,
          status: newStatus,
          progress: newProgress,
          startDate: p.startDate,
          expectedCompletionDate: p.expectedCompletionDate,
          faculty: p.faculty,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) =>
          prev.map((item) => ((item.id || item._id) === projId ? updated : item))
        );
        toast.success(`Project "${p.title}" marked as ${newStatus}.`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update project status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating project status.");
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

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        {/* Header Section */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="absolute inset-0 grid-neural opacity-30 dark:opacity-20" aria-hidden />
          <div
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Research Projects
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage, organize, and track your academic research projects from proposal to publication.
              </p>
            </div>
            <Button
              onClick={openCreateModal}
              className="gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
            >
              <Plus className="h-4 w-4" /> Create Project
            </Button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 backdrop-blur">
              <p className="text-xs font-medium text-muted-foreground">Total Projects</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 backdrop-blur">
              <p className="text-xs font-medium text-muted-foreground">In Progress</p>
              <p className="mt-1 text-2xl font-bold text-amber-500">{stats.inProgress}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 backdrop-blur">
              <p className="text-xs font-medium text-muted-foreground">Under Review</p>
              <p className="mt-1 text-2xl font-bold text-primary">{stats.underReview}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 backdrop-blur">
              <p className="text-xs font-medium text-muted-foreground">Completed</p>
              <p className="mt-1 text-2xl font-bold text-emerald-500">{stats.completed}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/80 bg-background/50 p-3.5 backdrop-blur">
              <p className="text-xs font-medium text-muted-foreground">Avg. Progress</p>
              <p className="mt-1 text-2xl font-bold text-primary">{stats.avgProgress}%</p>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, domain, description, or faculty mentor…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl pl-10 pr-9 bg-card border-border text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
              {["All", "Planning", "In Progress", "Under Review", "Completed", "On Hold"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${selectedStatusFilter === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] rounded-xl bg-card border-border text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="created">Recently Created</SelectItem>
                <SelectItem value="progress-desc">Highest Progress</SelectItem>
                <SelectItem value="progress-asc">Lowest Progress</SelectItem>
                <SelectItem value="title">Project Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects Grid / Skeleton / Empty State */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="rounded-2xl border-border bg-card p-5">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-2.5 w-full rounded-full" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-14 px-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-primary mb-4">
              <FolderKanban className="h-8 w-8" />
            </div>
            {projects.length === 0 ? (
              <>
                <h3 className="text-xl font-bold text-foreground">No Research Projects Yet</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Start organizing your academic research, tracking progress, and collaborating with faculty by creating your first project.
                </p>
                <Button
                  onClick={openCreateModal}
                  className="mt-6 gap-2 rounded-xl bg-primary font-medium text-primary-foreground"
                >
                  <Plus className="h-4 w-4" /> Create Your First Project
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-foreground">No Projects Match Your Filter</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Try clearing your search query or changing the status filter tab to see more results.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStatusFilter("All");
                  }}
                  className="mt-4 rounded-xl"
                >
                  Clear Filters
                </Button>
              </>
            )}
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((p) => {
              const statusKey = p.status || "Planning";
              const statusCfg = STATUS_VARIANTS[statusKey] || STATUS_VARIANTS["Planning"];
              const StatusIcon = statusCfg.icon;

              return (
                <Card
                  key={p.id || p._id}
                  onClick={() => (window.location.href = `/projects/${p._id || p.id}`)}
                  className="group surface-elevated relative flex flex-col justify-between rounded-2xl border-border bg-card p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="space-y-3">
                    {/* Top Badges & Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="truncate rounded-full border-border bg-muted/50 px-2.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
                        {p.domain || "General"}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold ${statusCfg.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); (window.location.href = `/projects/${p._id || p.id}`); }} className="gap-2 text-xs">
                              <FolderKanban className="h-3.5 w-3.5 text-primary" /> Open Workspace
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditModal(p); }} className="gap-2 text-xs">
                              <Pencil className="h-3.5 w-3.5 text-amber-500" /> Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleArchiveProject(p, e)} className="gap-2 text-xs">
                              <Archive className="h-3.5 w-3.5 text-blue-500" /> {p.status === "Completed" ? "Reopen Project" : "Archive / Complete"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeletingProject(p); }} className="gap-2 text-xs text-destructive focus:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" /> Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {p.description || "No description provided."}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">Progress</span>
                        <span className="font-semibold text-foreground">{p.progress || 0}%</span>
                      </div>
                      <Progress value={p.progress || 0} className="h-2 rounded-full bg-muted" />
                    </div>
                  </div>

                  {/* Card Footer Info & Primary Action */}
                  <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate font-medium text-foreground">
                          {p.supervisionStatus === "Under Supervision" && p.faculty
                            ? p.faculty
                            : p.supervisionStatus === "Pending Approval"
                            ? "Supervisor: Pending"
                            : p.supervisionStatus === "Rejected"
                            ? "Supervisor: Rejected"
                            : "No supervisor assigned"}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-[0.7rem]">
                        <Clock className="h-3 w-3" />
                        {formatDate(p.updatedAt || p.createdAt)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/projects/${p._id || p.id}`;
                      }}
                      className="w-full gap-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/90 transition-all"
                    >
                      <FolderKanban className="h-3.5 w-3.5" /> Open Workspace
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Project Modal Dialog */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-border bg-card p-6 shadow-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FolderKanban className="h-5 w-5 text-primary" />
              {editingProject ? "Edit Research Project" : "Create New Research Project"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingProject
                ? "Update your project parameters, status, and milestone progress."
                : "Fill in all required details to create a new research project."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            {/* Project Title Field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g., Quantum Machine Learning for Drug Discovery"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                onBlur={() => handleBlur("title")}
                className={`rounded-xl text-sm transition-colors ${touched.title && fieldErrors.title
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                  }`}
              />
              {touched.title && fieldErrors.title && (
                <p className="text-[0.75rem] text-destructive font-medium mt-1">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            {/* Research Domain & Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Research Domain <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.domain}
                  onValueChange={(val) => handleFieldChange("domain", val)}
                >
                  <SelectTrigger
                    className={`rounded-xl text-xs ${touched.domain && fieldErrors.domain ? "border-destructive" : ""
                      }`}
                  >
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {DOMAIN_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.domain && fieldErrors.domain && (
                  <p className="text-[0.75rem] text-destructive font-medium mt-1">
                    {fieldErrors.domain}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: ProjectStatus) => handleFieldChange("status", val)}
                >
                  <SelectTrigger
                    className={`rounded-xl text-xs ${touched.status && fieldErrors.status ? "border-destructive" : ""
                      }`}
                  >
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
                  <p className="text-[0.75rem] text-destructive font-medium mt-1">
                    {fieldErrors.status}
                  </p>
                )}
              </div>
            </div>

            {/* Progress Completion Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Progress Completion (%) <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs font-bold text-primary">{formData.progress}%</span>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.progress}
                onChange={(e) =>
                  handleFieldChange(
                    "progress",
                    Math.min(100, Math.max(0, Number(e.target.value) || 0))
                  )
                }
                onBlur={() => handleBlur("progress")}
                className={`rounded-xl text-sm ${touched.progress && fieldErrors.progress
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                  }`}
              />
              {touched.progress && fieldErrors.progress && (
                <p className="text-[0.75rem] text-destructive font-medium mt-1">
                  {fieldErrors.progress}
                </p>
              )}
            </div>

            {/* Description & Objectives */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Description & Objectives <span className="text-destructive">*</span>
                </Label>
                <span className="text-[0.7rem] text-muted-foreground">
                  {formData.description.length}/1000
                </span>
              </div>
              <Textarea
                placeholder="Describe your research objectives, methodology, and expected outcomes (minimum 20 characters)…"
                rows={3}
                maxLength={1000}
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                onBlur={() => handleBlur("description")}
                className={`rounded-xl text-xs ${touched.description && fieldErrors.description
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                  }`}
              />
              {touched.description && fieldErrors.description && (
                <p className="text-[0.75rem] text-destructive font-medium mt-1">
                  {fieldErrors.description}
                </p>
              )}
            </div>

            {/* Start Date & Expected Completion Date */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Start Date <span className="text-destructive">*</span>
                </Label>
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
                  className={`rounded-xl text-xs ${touched.startDate && fieldErrors.startDate
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                    }`}
                />
                {touched.startDate && fieldErrors.startDate && (
                  <p className="text-[0.75rem] text-destructive font-medium mt-1">
                    {fieldErrors.startDate}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Expected Completion Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  min={getMinCompletionDateString(formData.startDate)}
                  value={formData.expectedCompletionDate}
                  onChange={(e) => handleFieldChange("expectedCompletionDate", e.target.value)}
                  onBlur={() => handleBlur("expectedCompletionDate")}
                  className={`rounded-xl text-xs ${touched.expectedCompletionDate && fieldErrors.expectedCompletionDate
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                    }`}
                />
                {touched.expectedCompletionDate && fieldErrors.expectedCompletionDate && (
                  <p className="text-[0.75rem] text-destructive font-medium mt-1">
                    {fieldErrors.expectedCompletionDate}
                  </p>
                )}
              </div>
            </div>

            {/* Keywords Input Field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Keywords <span className="text-muted-foreground">(Comma separated)</span>
              </Label>
              <Input
                placeholder="e.g. artificial intelligence, deep learning, computer vision"
                value={formData.keywords}
                onChange={(e) => handleFieldChange("keywords", e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            {/* Dialog Action Buttons */}
            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || submitting}
                className="rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editingProject ? "Saving Changes…" : "Creating Project…"}
                  </span>
                ) : editingProject ? (
                  "Save Changes"
                ) : (
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Project Details Dialog */}
      <Dialog open={Boolean(detailProject)} onOpenChange={() => setDetailProject(null)}>
        {detailProject && (
          <DialogContent className="max-w-lg rounded-2xl border-border bg-card p-6 shadow-xl sm:max-w-xl">
            <DialogHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-border bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {detailProject.domain || "General"}
                </Badge>
                <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_VARIANTS[detailProject.status || "Planning"]?.className}`}>
                  {detailProject.status || "Planning"}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {detailProject.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {detailProject.description || "No detailed description provided."}
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-1.5 rounded-xl border border-border/80 bg-background/50 p-4">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Completion Milestone</span>
                  <span className="text-primary">{detailProject.progress || 0}%</span>
                </div>
                <Progress value={detailProject.progress || 0} className="h-2 rounded-full" />
              </div>

              {/* Grid Metadata */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <span className="font-semibold text-muted-foreground block mb-1">Faculty Advisor</span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    {detailProject.faculty || "Independent Study"}
                  </span>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <span className="font-semibold text-muted-foreground block mb-1">Project Timeline</span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    {formatDate(detailProject.startDate)} {detailProject.expectedCompletionDate ? `→ ${formatDate(detailProject.expectedCompletionDate)}` : ""}
                  </span>
                </div>
              </div>

              <div className="text-[0.7rem] text-muted-foreground">
                Created: {formatDate(detailProject.createdAt)} • Updated: {formatDate(detailProject.updatedAt || detailProject.createdAt)}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDetailProject(null)} className="rounded-xl">
                Close
              </Button>
              <Button
                onClick={() => {
                  const proj = detailProject;
                  setDetailProject(null);
                  openEditModal(proj);
                }}
                className="gap-1.5 rounded-xl bg-primary text-primary-foreground"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Project
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(deletingProject)} onOpenChange={() => setDeletingProject(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card p-6 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-destructive">
              Delete Research Project?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">"{deletingProject?.title}"</strong>? This action will remove all project metrics and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                </span>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
