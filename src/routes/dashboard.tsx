import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  BookMarked,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  FolderKanban,
  GitCompareArrows,
  GraduationCap,
  Inbox,
  LineChart,
  Megaphone,
  MessageSquare,
  Network,
  Pencil,
  Plus,
  Quote,
  ScanSearch,
  Send,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getHomePathForRole, getUserSession, getUserDisplayName, UserSession } from "@/lib/session";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ScholarNexus AI" },
      {
        name: "description",
        content:
          "Your intelligent research command center: projects, papers, AI insights, and collaboration in one place.",
      },
    ],
  }),
  component: DashboardPage,
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
    icon: Clock,
  },
};

const quickActions = [
  {
    title: "Start New Project",
    desc: "Initialize a dedicated research workspace",
    icon: Plus,
    href: "/projects?create=true",
    gradient: "from-blue-600/20 to-indigo-600/20 border-blue-500/30 hover:border-blue-500/60",
    iconBg: "bg-blue-500/15 text-blue-400",
  },
  {
    title: "Research Projects",
    desc: "Browse and open active research workspaces",
    icon: FolderKanban,
    href: "/projects",
    gradient: "from-purple-600/20 to-pink-600/20 border-purple-500/30 hover:border-purple-500/60",
    iconBg: "bg-purple-500/15 text-purple-400",
  },
  {
    title: "Faculty Directory",
    desc: "Explore mentors and academic advisors",
    icon: GraduationCap,
    href: "/faculty",
    gradient: "from-emerald-600/20 to-teal-600/20 border-emerald-500/30 hover:border-emerald-500/60",
    iconBg: "bg-emerald-500/15 text-emerald-400",
  },
  {
    title: "Notifications",
    desc: "Stay updated on reviews & announcements",
    icon: Bell,
    href: "/notifications",
    gradient: "from-amber-600/20 to-orange-600/20 border-amber-500/30 hover:border-amber-500/60",
    iconBg: "bg-amber-500/15 text-amber-400",
  },
  {
    title: "Account Settings",
    desc: "Manage your profile & preferences",
    icon: Settings,
    href: "/settings",
    gradient: "from-cyan-600/20 to-sky-600/20 border-cyan-500/30 hover:border-cyan-500/60",
    iconBg: "bg-cyan-500/15 text-cyan-400",
  },
];

function DashboardPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") {
      return getUserSession();
    }
    return null;
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    if (session.role === "faculty") {
      window.location.href = "/faculty-dashboard";
      return;
    }

    if (session.role === "admin") {
      window.location.href = "/admin";
      return;
    }

    setUser(session);

    fetch(`/api/projects?email=${encodeURIComponent(session.email)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          setProjects([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setProjects([]);
      })
      .finally(() => setLoadingProjects(false));

    fetch("/api/announcements")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAnnouncements(data.filter((a) => a.targetAudience === "All" || a.targetAudience === "Students"));
        }
      })
      .catch(() => {});
  }, []);

  if (typeof window !== "undefined" && !user) {
    return null;
  }

  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);

  const activeProjects = useMemo(
    () => safeProjects.filter((p) => p && (p.status === "Planning" || p.status === "In Progress")),
    [safeProjects]
  );
  const reviewProjects = useMemo(
    () => safeProjects.filter((p) => p && p.status === "Under Review"),
    [safeProjects]
  );
  const completedProjects = useMemo(
    () => safeProjects.filter((p) => p && p.status === "Completed"),
    [safeProjects]
  );

  const overallAvgProgress = useMemo(() => {
    if (safeProjects.length === 0) return 0;
    const sum = safeProjects.reduce((acc, p) => acc + (Number(p.progress) || 0), 0);
    return Math.round(sum / safeProjects.length);
  }, [safeProjects]);

  const upcomingDeadline = useMemo(() => {
    const sorted = [...safeProjects]
      .filter((p) => p.expectedCompletionDate)
      .sort((a, b) => new Date(a.expectedCompletionDate).getTime() - new Date(b.expectedCompletionDate).getTime());
    return sorted[0] || null;
  }, [safeProjects]);

  const mostRecentProject = useMemo(() => {
    if (safeProjects.length === 0) return null;
    const sorted = [...safeProjects].sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    return sorted[0] || null;
  }, [safeProjects]);

  const computedStats = [
    {
      label: "Active Projects",
      icon: FolderKanban,
      value: loadingProjects ? "…" : activeProjects.length,
      hint: `${safeProjects.length} total projects active`,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Reference Papers",
      icon: BookOpen,
      value: "0",
      hint: "Collected reference literature",
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Research Documents",
      icon: Pencil,
      value: "1",
      hint: "Student academic writing documents",
      color: "text-purple-500",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Faculty Feedback",
      icon: MessageSquare,
      value: safeProjects.filter((p) => p.faculty && p.faculty !== "Independent Research").length,
      hint: "Supervisors & advisors assigned",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

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

  // Generate Activity Timeline based on real database records
  const recentActivities = useMemo(() => {
    const activities: Array<{
      id: string;
      title: string;
      desc: string;
      timestamp: string;
      type: "create" | "update" | "faculty" | "milestone";
      icon: typeof Plus;
      iconBg: string;
    }> = [];

    safeProjects.forEach((p) => {
      if (p.createdAt) {
        activities.push({
          id: `create-${p.id || p._id}`,
          title: `Project Established: "${p.title}"`,
          desc: `Domain: ${p.domain} • Status: ${p.status}`,
          timestamp: p.createdAt,
          type: "create",
          icon: FolderKanban,
          iconBg: "bg-blue-500/15 text-blue-400",
        });
      }
      if (p.faculty && p.faculty !== "Independent Research") {
        activities.push({
          id: `faculty-${p.id || p._id}`,
          title: `Faculty Advisor Assigned: ${p.faculty}`,
          desc: `Assigned to research project "${p.title}"`,
          timestamp: p.updatedAt || p.createdAt,
          type: "faculty",
          icon: GraduationCap,
          iconBg: "bg-emerald-500/15 text-emerald-400",
        });
      }
      if (Number(p.progress) > 0) {
        activities.push({
          id: `progress-${p.id || p._id}`,
          title: `Progress Milestone Updated (${p.progress}%)`,
          desc: `Project "${p.title}" reached ${p.progress}% completion`,
          timestamp: p.updatedAt || p.createdAt,
          type: "milestone",
          icon: TrendingUp,
          iconBg: "bg-purple-500/15 text-purple-400",
        });
      }
    });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [safeProjects]);

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 pb-10">
        {/* 1. Welcome Section */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <div className="absolute inset-0 grid-neural opacity-30 dark:opacity-20" aria-hidden />
          <div
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Badge className="gap-1.5 rounded-full border-none bg-accent/15 px-3 py-1 text-xs font-medium text-foreground hover:bg-accent/20">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> ScholarNexus Academic Command Center
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
                Welcome back, {getUserDisplayName(user)}! 👋
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Advance your academic journey. Synthesize literature insights, track project milestones, and collaborate with faculty advisors in one intelligent workspace.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() => (window.location.href = "/projects?create=true")}
                  className="gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
                >
                  <Plus className="h-4 w-4" /> Start New Research Project
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/projects")}
                  className="gap-2 rounded-xl border-border bg-card hover:bg-muted"
                >
                  <FolderKanban className="h-4 w-4 text-primary" /> Browse Projects ({safeProjects.length})
                </Button>
              </div>
            </div>

            {/* Visual Focus Widget */}
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[380px]">
              <div className="rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-md transition-all hover:border-primary/40">
                <div className="flex items-center gap-2 mb-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Target className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">Overall Milestone</span>
                </div>
                <p className="text-xl font-bold text-foreground">{overallAvgProgress}% Avg Progress</p>
                <Progress value={overallAvgProgress} className="mt-2 h-1.5 rounded-full" />
              </div>

              <div className="rounded-2xl border border-border/80 bg-background/60 p-4 backdrop-blur-md transition-all hover:border-primary/40">
                <div className="flex items-center gap-2 mb-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">Next Target Date</span>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">
                  {upcomingDeadline
                    ? formatDate(upcomingDeadline.expectedCompletionDate)
                    : "No pending target"}
                </p>
                <p className="mt-1 text-[0.7rem] text-muted-foreground truncate">
                  {upcomingDeadline ? upcomingDeadline.title : "All timelines clear"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Continue Working Section */}
        {mostRecentProject && (
          <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/15 text-primary text-xs font-semibold">
                  ⚡ Continue Working
                </Badge>
                <h3 className="text-xl font-bold text-foreground">{mostRecentProject.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 max-w-2xl">
                  {mostRecentProject.description || "No description provided."}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <span className="text-muted-foreground">Domain: <strong className="text-foreground font-medium">{mostRecentProject.domain || "General"}</strong></span>
                  <span className="text-muted-foreground">Status: <strong className="text-foreground font-medium">{mostRecentProject.status}</strong></span>
                  <span className="text-muted-foreground">Progress: <strong className="text-primary font-bold">{mostRecentProject.progress || 0}%</strong></span>
                  {mostRecentProject.faculty && (
                    <span className="text-muted-foreground">Mentor: <strong className="text-foreground font-medium">{mostRecentProject.faculty}</strong></span>
                  )}
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = `/projects/${mostRecentProject._id || mostRecentProject.id}`)}
                className="shrink-0 gap-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90"
              >
                <FolderKanban className="h-4 w-4" /> Open Workspace <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* 3. Dashboard Overview (Summary Cards) */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {computedStats.map((s) => (
            <Card
              key={s.label}
              className="group surface-elevated relative overflow-hidden rounded-2xl border-border bg-card/70 p-5 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
                  <p className="flex items-center gap-1 text-[0.725rem] text-muted-foreground pt-1">
                    <TrendingUp className="h-3 w-3 text-primary" /> {s.hint}
                  </p>
                </div>
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${s.bg} transition-transform group-hover:scale-110`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* 2. Research Projects (Hero Section - Prominent Workspace Heart) */}
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
                <FolderKanban className="h-6 w-6 text-primary" />
                Research Projects Workspace
              </h2>
              <p className="text-xs text-muted-foreground md:text-sm">
                Your active academic projects, progress completion, and mentor assignments.
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/projects")}
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-border text-xs text-primary hover:bg-muted"
            >
              View All Projects ({safeProjects.length}) <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          <Card className="surface-elevated rounded-2xl border-border p-6">
            <Tabs defaultValue="all">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
                <TabsList className="rounded-xl bg-muted/60 p-1">
                  <TabsTrigger value="all" className="rounded-lg text-xs font-medium">
                    All ({safeProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="active" className="rounded-lg text-xs font-medium">
                    Active ({activeProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="review" className="rounded-lg text-xs font-medium">
                    Under Review ({reviewProjects.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="rounded-lg text-xs font-medium">
                    Completed ({completedProjects.length})
                  </TabsTrigger>
                </TabsList>

                <Button
                  onClick={() => (window.location.href = "/projects?create=true")}
                  size="sm"
                  className="gap-1.5 rounded-xl bg-primary text-xs font-medium text-primary-foreground"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Project
                </Button>
              </div>

              {/* Tab Contents */}
              {["all", "active", "review", "completed"].map((tabKey) => {
                const displayList =
                  tabKey === "all"
                    ? safeProjects
                    : tabKey === "active"
                    ? activeProjects
                    : tabKey === "review"
                    ? reviewProjects
                    : completedProjects;

                return (
                  <TabsContent key={tabKey} value={tabKey} className="mt-5">
                    {loadingProjects ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                          <Card key={i} className="rounded-2xl border-border bg-card p-5 space-y-3">
                            <Skeleton className="h-5 w-24 rounded-full" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-2 w-full rounded-full" />
                          </Card>
                        ))}
                      </div>
                    ) : displayList.length === 0 ? (
                      /* 7. Empty State */
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 px-4 text-center bg-card/40">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-primary mb-4">
                          <FolderKanban className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">
                          {safeProjects.length === 0
                            ? "Start your first research project and begin your research journey."
                            : `No projects in "${tabKey}" state.`}
                        </h3>
                        <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
                          Organize literature, assign faculty advisors, and manage milestone progress seamlessly.
                        </p>
                        <Button
                          onClick={() => (window.location.href = "/projects?create=true")}
                          className="mt-5 gap-2 rounded-xl bg-primary font-medium text-primary-foreground shadow-sm"
                        >
                          <Plus className="h-4 w-4" /> Create Research Project
                        </Button>
                      </div>
                    ) : (
                      /* Project Cards Grid */
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {displayList.slice(0, 6).map((p) => {
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
                                    <div className="flex items-center justify-between gap-2">
                                      <Badge variant="outline" className="truncate rounded-full border-border bg-muted/50 px-2.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
                                        {p.domain || "General"}
                                      </Badge>
                                      <Badge variant="outline" className={`gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold ${statusCfg.className}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {statusCfg.label}
                                      </Badge>
                                    </div>

                                    <div className="space-y-1">
                                      <h3 className="truncate text-base font-bold text-foreground transition-colors group-hover:text-primary">
                                        {p.title}
                                      </h3>
                                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                        {p.description || "No description provided."}
                                      </p>
                                    </div>

                                    <div className="space-y-1.5 pt-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-muted-foreground">Progress</span>
                                        <span className="font-bold text-foreground">{p.progress || 0}%</span>
                                      </div>
                                      <Progress value={p.progress || 0} className="h-2 rounded-full bg-muted" />
                                    </div>
                                  </div>

                                  <div className="mt-4 space-y-3 border-t border-border/60 pt-3">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <GraduationCap className="h-3.5 w-3.5 text-primary" />
                                        {p.faculty || "Independent"}
                                      </span>
                                      <span className="flex items-center gap-1 text-[0.7rem]">
                                        <Clock className="h-3 w-3" />
                                        {p.updatedAt ? formatDate(p.updatedAt) : formatDate(p.createdAt)}
                                      </span>
                                    </div>

                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = `/projects/${p._id || p.id}`;
                                      }}
                                      className="w-full gap-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-semibold text-xs transition-colors"
                                    >
                                      <FolderKanban className="h-3.5 w-3.5" /> Open Workspace
                                    </Button>
                                  </div>
                                </Card>
                              );
                        })}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </Card>
        </section>

        {/* 5. Quick Actions Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">Quick Actions</h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              Instant research utilities and tools to accelerate your workflow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {quickActions.map((qa) => (
              <Card
                key={qa.title}
                onClick={() => (window.location.href = qa.href)}
                className={`group cursor-pointer rounded-2xl border bg-gradient-to-br ${qa.gradient} p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
              >
                <div className="flex flex-col justify-between h-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${qa.iconBg}`}>
                      <qa.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary">
                      {qa.title}
                    </h3>
                    <p className="mt-1 text-[0.725rem] text-muted-foreground leading-snug">
                      {qa.desc}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* 6. Research Progress & 4. Recent Activity Timeline (Side by Side) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 6. Research Progress Card */}
          <Card className="surface-elevated rounded-2xl border-border p-6 flex flex-col justify-between">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <LineChart className="h-5 w-5 text-primary" /> Research Progress & Milestones
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Overall completion milestones and active research phases across projects.
              </p>
            </CardHeader>
            <CardContent className="p-0 space-y-5">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Overall Workspace Completion</span>
                  <span className="text-primary font-bold">{overallAvgProgress}%</span>
                </div>
                <Progress value={overallAvgProgress} className="h-2.5 rounded-full" />
                <p className="text-[0.7rem] text-muted-foreground">
                  Based on average progress across {safeProjects.length} registered research projects.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Milestone Phases
                </h4>
                {[
                  { phase: "Literature Review & Synthesis", progress: safeProjects.length > 0 ? 80 : 0 },
                  { phase: "Methodology & Framework Setup", progress: safeProjects.length > 0 ? 60 : 0 },
                  { phase: "Data Collection & Experiments", progress: safeProjects.length > 0 ? 40 : 0 },
                  { phase: "Analysis & Manuscript Draft", progress: safeProjects.length > 0 ? 25 : 0 },
                ].map((item) => (
                  <div key={item.phase} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{item.phase}</span>
                      <span className="text-muted-foreground font-semibold">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-1.5 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 4. Recent Activity Timeline Card */}
          <Card className="surface-elevated rounded-2xl border-border p-6 flex flex-col justify-between">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Activity className="h-5 w-5 text-primary" /> Recent Activity Timeline
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Recent research events, project updates, and mentor assignments.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-10 px-4 text-center">
                  <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No recent activity yet. Create a research project to start tracking your timeline!
                  </p>
                </div>
              ) : (
                <div className="relative space-y-4 pl-6 pt-1">
                  <span className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border" aria-hidden />
                  {recentActivities.map((act) => {
                    const ActIcon = act.icon;
                    return (
                      <div key={act.id} className="relative flex items-start gap-3">
                        <div className={`absolute -left-[1.65rem] top-0.5 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-xs shadow-sm`}>
                          <ActIcon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-xs font-bold text-foreground line-clamp-1">{act.title}</p>
                          <p className="text-[0.725rem] text-muted-foreground leading-normal">{act.desc}</p>
                          <p className="text-[0.675rem] text-muted-foreground/80">{formatDate(act.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
