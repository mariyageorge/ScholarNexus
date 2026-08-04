import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  FolderKanban,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Building,
  Award,
  Sparkles,
  BookOpen,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { getUserSession, UserSession } from "@/lib/session";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty-dashboard")({
  head: () => ({
    meta: [
      { title: "Faculty Research Dashboard — ScholarNexus AI" },
      { name: "description", content: "Academic faculty research portal and student supervision manager." },
    ],
  }),
  component: FacultyDashboardHome,
});

interface SupervisionRequest {
  id: string;
  studentName: string;
  studentEmail: string;
  projectTitle: string;
  domain: string;
  dateSubmitted: string;
  status: "Pending" | "Accepted" | "Declined";
}

interface ActiveProject {
  id: string;
  title: string;
  leadStudent: string;
  domain: string;
  progress: number;
  status: string;
  lastUpdated: string;
}

function FacultyDashboardHome() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard Data State
  const [requests, setRequests] = useState<SupervisionRequest[]>([
    {
      id: "sr-101",
      studentName: "Alex Chen",
      studentEmail: "alex.chen@university.edu",
      projectTitle: "Neural Architecture Search for Lightweight LLMs",
      domain: "Artificial Intelligence",
      dateSubmitted: "2026-08-02",
      status: "Pending",
    },
    {
      id: "sr-102",
      studentName: "Sophia Martinez",
      studentEmail: "sophia.m@university.edu",
      projectTitle: "Distributed Consensus Algorithms in Edge Computing",
      domain: "Distributed Systems",
      dateSubmitted: "2026-08-01",
      status: "Pending",
    },
  ]);

  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([
    {
      id: "proj-201",
      title: "Quantum-Resistant Lattice Cryptography Framework",
      leadStudent: "Ethan Vance",
      domain: "Cybersecurity",
      progress: 75,
      status: "In Progress",
      lastUpdated: "2026-08-03",
    },
    {
      id: "proj-202",
      title: "Biomedical Graph Representation for Molecular Docking",
      leadStudent: "Maya Lin",
      domain: "Bioinformatics",
      progress: 40,
      status: "Under Review",
      lastUpdated: "2026-08-04",
    },
  ]);

  useEffect(() => {
    const activeUser = getUserSession();
    if (!activeUser) {
      window.location.href = "/login";
      return;
    }
    setSession(activeUser);
    setIsLoading(false);
  }, []);

  const handleAcceptRequest = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Accepted" as const } : r))
    );
    toast.success("Supervision request accepted successfully!");
  };

  const handleDeclineRequest = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Declined" as const } : r))
    );
    toast.info("Supervision request declined.");
  };

  const stats = [
    {
      title: "My Students",
      value: "14",
      subText: "Supervised Scholars",
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Active Projects",
      value: String(activeProjects.length + 3),
      subText: "Under Active Mentorship",
      icon: FolderKanban,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      title: "Pending Requests",
      value: String(requests.filter((r) => r.status === "Pending").length),
      subText: "Awaiting Your Action",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Reviews Pending",
      value: "5",
      subText: "Manuscripts to Review",
      icon: FileCheck,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold">
                Faculty Portal
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">Academic Year 2026–2027</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {session?.displayName || session?.name || "Professor"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
              <Building className="h-3.5 w-3.5 text-primary" />
              <span>{session?.institution || "ScholarNexus Partner Institution"}</span>
              <span>•</span>
              <Award className="h-3.5 w-3.5 text-indigo-500" />
              <span>{session?.department || "Department of Computer Science"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Refreshed Faculty Dashboard metrics.")}
              className="gap-2 rounded-xl text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
            </Button>
            <Button
              size="sm"
              onClick={() => (window.location.href = "/faculty/projects")}
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
            >
              <Plus className="h-3.5 w-3.5" /> New Research Group
            </Button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card
              key={s.title}
              className={`rounded-3xl border ${s.border} bg-card p-5 shadow-sm transition hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{s.title}</span>
                <div className={`grid h-10 w-10 place-items-center rounded-2xl ${s.bg} ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <span className="text-3xl font-bold tracking-tight text-foreground">{s.value}</span>
                <p className="text-[0.7rem] font-medium text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" /> {s.subText}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Left Column (2 Spans) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supervision Requests Section */}
            <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" /> Student Supervision Requests
                  </h2>
                  <p className="text-xs text-muted-foreground">Scholars seeking thesis & research mentorship</p>
                </div>
                <Badge variant="secondary" className="rounded-full text-xs font-semibold">
                  {requests.filter((r) => r.status === "Pending").length} Action Required
                </Badge>
              </div>

              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{req.studentName}</span>
                        <Badge variant="outline" className="text-[0.65rem] border-primary/30 text-primary">
                          {req.domain}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground">{req.projectTitle}</p>
                      <span className="text-[0.65rem] text-muted-foreground">Submitted on {req.dateSubmitted}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === "Pending" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(req.id)}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-8 px-3"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineRequest(req.id)}
                            className="rounded-xl text-xs font-semibold h-8 px-3 text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            Decline
                          </Button>
                        </>
                      ) : (
                        <Badge
                          variant="outline"
                          className={
                            req.status === "Accepted"
                              ? "border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
                              : "border-destructive/40 text-destructive bg-destructive/10"
                          }
                        >
                          {req.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Active Supervised Projects */}
            <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-indigo-500" /> Active Research Projects
                  </h2>
                  <p className="text-xs text-muted-foreground">Supervised student research initiatives</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = "/faculty/projects")}
                  className="gap-1 text-xs font-semibold text-primary hover:text-primary/80"
                >
                  View All Projects <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-4">
                {activeProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="rounded-2xl border border-border bg-background p-4 space-y-3 hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{proj.title}</h3>
                        <p className="text-xs text-muted-foreground">Lead Scholar: <span className="font-semibold text-foreground">{proj.leadStudent}</span> • {proj.domain}</p>
                      </div>
                      <Badge variant="outline" className="text-[0.65rem] border-indigo-500/30 text-indigo-500 bg-indigo-500/10">
                        {proj.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Milestone Completion</span>
                        <span className="text-foreground">{proj.progress}%</span>
                      </div>
                      <Progress value={proj.progress} className="h-2 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar Right Column (1 Span) */}
          <div className="space-y-6">
            {/* Attention Required Card */}
            <Card className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Requires Attention
              </h2>

              <div className="space-y-3 text-xs">
                <div className="rounded-2xl border border-amber-500/20 bg-background p-3.5 space-y-1">
                  <p className="font-bold text-foreground">Manuscript Draft Review</p>
                  <p className="text-muted-foreground">"Edge Computing Security" submitted by Ethan Vance is waiting for review.</p>
                  <span className="text-[0.65rem] text-amber-500 font-semibold">Due in 2 days</span>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-background p-3.5 space-y-1">
                  <p className="font-bold text-foreground">Supervision Sign-off</p>
                  <p className="text-muted-foreground">Mid-term progress assessment for Maya Lin due for department submission.</p>
                  <span className="text-[0.65rem] text-amber-500 font-semibold">Due tomorrow</span>
                </div>
              </div>
            </Card>

            {/* Recent Activity Timeline */}
            <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" /> Faculty Activity Feed
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex gap-3 items-start">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Approved Project Milestone</p>
                    <p className="text-[0.65rem] text-muted-foreground">Approved Chapter 3 for Alex Chen</p>
                    <span className="text-[0.6rem] text-muted-foreground">2 hours ago</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Uploaded Research Reference</p>
                    <p className="text-[0.65rem] text-muted-foreground">Added 2 papers to Lattice Cryptography</p>
                    <span className="text-[0.6rem] text-muted-foreground">Yesterday</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
