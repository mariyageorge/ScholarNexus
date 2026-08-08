import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Mail,
  Copy,
  Send,
  Building,
  Calendar,
  FolderKanban,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Loader2,
  AlertCircle,
  Tag,
  UserX,
  UserCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty")({
  head: () => ({
    meta: [
      { title: "My Faculty Guide — ScholarNexus AI" },
      { name: "description", content: "Assigned faculty guide and supervision status for your research projects." },
    ],
  }),
  component: MyFacultyPage,
});

interface AssignedFaculty {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  designation?: string;
  title?: string;
  department?: string;
  institution?: string;
  affiliation?: string;
  researchInterests?: string[];
  bio?: string;
  photoURL?: string;
  supervisionStatus?: string;
}

interface StudentProject {
  id: string;
  _id?: string;
  title: string;
  domain?: string;
  status?: string;
  faculty?: string;
  supervisionStatus?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  createdAt: string;
}

function MyFacultyPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname !== "/faculty" && pathname !== "/faculty/") {
    return <Outlet />;
  }

  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") return getUserSession();
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<StudentProject | null>(null);
  const [assignedFaculty, setAssignedFaculty] = useState<AssignedFaculty | null>(null);
  const [pendingRequest, setPendingRequest] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    if (window.location.pathname === "/faculty" && session.role === "faculty") {
      window.location.href = "/faculty/profile";
      return;
    }
    setUser(session);
    fetchMyFacultyData(session.email);
  }, []);

  const fetchMyFacultyData = async (email: string) => {
    setLoading(true);
    try {
      // 1. Fetch Student Projects from MongoDB
      const projRes = await fetch(`/api/projects?email=${encodeURIComponent(email)}`);
      let projects: StudentProject[] = [];
      if (projRes.ok) {
        projects = await projRes.json();
      }

      // 2. Fetch Supervision Requests for Student
      const reqRes = await fetch(`/api/supervision-requests?studentEmail=${encodeURIComponent(email)}`);
      let requests: any[] = [];
      if (reqRes.ok) {
        requests = await reqRes.json();
      }

      const pending = requests.find((r) => r.status === "Pending");
      setPendingRequest(pending || null);

      // Check if any project is Under Supervision
      const supervisedProject = projects.find(
        (p) => p.supervisionStatus === "Under Supervision" || (p.faculty && p.faculty.trim())
      );

      if (supervisedProject) {
        setActiveProject(supervisedProject);
        const facultyNameStr = supervisedProject.faculty?.trim() || "";

        // Fetch Faculty Directory
        const facultyListRes = await fetch("/api/faculty-list");
        if (facultyListRes.ok) {
          const facultyList: AssignedFaculty[] = await facultyListRes.json();
          const matched = facultyList.find(
            (f) =>
              (f.email && f.email.toLowerCase() === facultyNameStr.toLowerCase()) ||
              f.name.toLowerCase().includes(facultyNameStr.toLowerCase()) ||
              facultyNameStr.toLowerCase().includes(f.name.toLowerCase())
          );

          if (matched) {
            setAssignedFaculty({ ...matched, supervisionStatus: "Under Supervision" });
          } else {
            setAssignedFaculty({
              name: facultyNameStr || "Faculty Guide",
              email: `${(facultyNameStr || "faculty").toLowerCase().replace(/\s+/g, ".")}@university.edu`,
              title: "Professor & Academic Advisor",
              designation: "Professor & Academic Advisor",
              department: "School of Computer Science & AI",
              institution: "University Institute of Technology",
              researchInterests: ["Academic Research", "Artificial Intelligence"],
              supervisionStatus: "Under Supervision",
            });
          }
        }
      } else if (pending) {
        setActiveProject(projects.find((p) => (p._id || p.id) === pending.projectId) || projects[0] || null);

        // Fetch details of requested faculty
        const facultyListRes = await fetch("/api/faculty-list");
        if (facultyListRes.ok) {
          const facultyList: AssignedFaculty[] = await facultyListRes.json();
          const matched = facultyList.find(
            (f) =>
              (f.id && f.id === pending.facultyId) ||
              (f._id && f._id === pending.facultyId) ||
              f.name.toLowerCase().includes((pending.facultyName || "").toLowerCase())
          );
          if (matched) {
            setAssignedFaculty({ ...matched, supervisionStatus: "Pending Approval" });
          } else {
            setAssignedFaculty({
              name: pending.facultyName || "Requested Faculty Guide",
              email: pending.facultyEmail || "faculty@university.edu",
              title: "Requested Advisor",
              designation: "Requested Advisor",
              department: "Academic Department",
              institution: "University Research Institute",
              supervisionStatus: "Pending Approval",
            });
          }
        }
      } else {
        setActiveProject(projects[0] || null);
        setAssignedFaculty(null);
      }
    } catch {
      toast.error("Failed to load faculty information.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    if (!assignedFaculty?.email) return;
    navigator.clipboard.writeText(assignedFaculty.email);
    toast.success("Faculty email copied to clipboard!");
  };

  const handleSendEmail = () => {
    if (!assignedFaculty?.email) return;
    const subject = encodeURIComponent(`Research Project Guidance: ${activeProject?.title || "Academic Query"}`);
    window.location.href = `mailto:${assignedFaculty.email}?subject=${subject}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (typeof window !== "undefined" && !user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 pb-12">
        {/* Header */}
        <div className="space-y-1">
          <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
            Academic Supervision & Mentorship
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> My Faculty
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Overview of your assigned faculty guide and active supervision request status.
          </p>
        </div>

        {loading ? (
          <Card className="rounded-2xl border border-border bg-card p-8 space-y-6">
            <div className="flex items-center gap-5">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <div className="space-y-3 w-full">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </Card>
        ) : assignedFaculty && assignedFaculty.supervisionStatus === "Under Supervision" ? (
          /* STATE 1: ASSIGNED SUPERVISOR DISPLAY */
          <div className="space-y-6">
            <Card className="surface-elevated overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                  {/* Photo */}
                  <div className="relative shrink-0">
                    {assignedFaculty.photoURL ? (
                      <img
                        src={assignedFaculty.photoURL}
                        alt={assignedFaculty.name}
                        className="h-20 w-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm"
                      />
                    ) : (
                      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-card border-2 border-emerald-500/40 text-emerald-600 font-bold text-2xl shadow-sm">
                        {(assignedFaculty.name || "Faculty")
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow-md">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl font-bold text-foreground">{assignedFaculty.name}</h2>
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[0.65rem] font-bold rounded-full px-2.5 py-0.5">
                        Under Supervision
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-primary">
                      {assignedFaculty.designation || assignedFaculty.title || "Faculty Supervisor"}
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                        {assignedFaculty.department || "Academic Department"}
                      </span>
                      {assignedFaculty.institution && (
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          {assignedFaculty.institution}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        {assignedFaculty.email}
                      </span>
                    </div>

                    {assignedFaculty.bio && (
                      <p className="text-xs text-muted-foreground leading-relaxed pt-1 max-w-xl">
                        {assignedFaculty.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-center md:justify-end">
                  <Button
                    onClick={handleCopyEmail}
                    variant="outline"
                    className="gap-2 rounded-xl text-xs font-semibold border-border hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5 text-primary" /> Copy Email
                  </Button>
                  <Button
                    onClick={handleSendEmail}
                    className="gap-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" /> Send Email
                  </Button>
                </div>
              </div>

              {assignedFaculty.researchInterests && assignedFaculty.researchInterests.length > 0 && (
                <div className="pt-4 border-t border-border/60 space-y-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" /> Research Specializations & Interests
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {assignedFaculty.researchInterests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="outline"
                        className="rounded-lg text-[0.7rem] border-primary/20 bg-primary/5 text-foreground font-medium px-2.5 py-1"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {activeProject && (
              <Card className="surface-elevated rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-primary" /> Supervised Research Project
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={() => (window.location.href = `/projects/${activeProject.id || activeProject._id}`)}
                    className="text-xs text-primary font-bold hover:bg-primary/10 rounded-xl"
                  >
                    Open Workspace →
                  </Button>
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-foreground">{activeProject.title}</p>
                  <p className="text-xs text-muted-foreground">Domain: <span className="font-semibold text-foreground">{activeProject.domain || "General"}</span></p>
                </div>
              </Card>
            )}
          </div>
        ) : pendingRequest || (assignedFaculty && assignedFaculty.supervisionStatus === "Pending Approval") ? (
          /* STATE 2: PENDING SUPERVISION REQUEST DISPLAY */
          <div className="space-y-6">
            <Card className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-5 text-center md:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 font-bold shrink-0">
                    <Clock className="h-8 w-8" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl font-bold text-foreground">Supervisor Request Pending</h2>
                      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[0.65rem] font-bold rounded-full px-2.5 py-0.5">
                        Pending Approval
                      </Badge>
                    </div>

                    <p className="text-sm font-semibold text-foreground">
                      Requested Faculty: <span className="text-primary font-bold">{pendingRequest?.facultyName || assignedFaculty?.name}</span>
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Requested on {pendingRequest?.submittedAt || (pendingRequest?.requestedAt ? new Date(pendingRequest.requestedAt).toLocaleDateString() : "Recently")}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (pendingRequest?.projectId) {
                      window.location.href = `/projects/${pendingRequest.projectId}`;
                    } else if (activeProject) {
                      window.location.href = `/projects/${activeProject.id || activeProject._id}`;
                    }
                  }}
                  variant="outline"
                  className="rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold gap-1.5"
                >
                  <FolderKanban className="h-4 w-4" /> View Project Workspace
                </Button>
              </div>

              {pendingRequest && (
                <div className="rounded-xl border border-amber-500/20 bg-background/80 p-4 space-y-2 text-xs">
                  <p className="font-semibold text-foreground">Project: <span className="text-primary">{pendingRequest.projectTitle}</span></p>
                  <p className="text-muted-foreground italic">"{pendingRequest.message || "I would like you to supervise my research project."}"</p>
                </div>
              )}
            </Card>
          </div>
        ) : (
          /* STATE 3: NO SUPERVISOR ASSIGNED OR REQUESTED */
          <Card className="surface-elevated rounded-2xl border-dashed border-border py-16 px-6 text-center space-y-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted/40 text-muted-foreground mx-auto">
              <UserX className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-foreground">No supervisor assigned yet.</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Request a supervisor for one of your research projects.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => (window.location.href = "/projects")}
                className="gap-2 rounded-xl bg-primary text-xs font-bold shadow-md text-primary-foreground px-5 py-2.5"
              >
                <FolderKanban className="h-4 w-4" /> View Research Projects
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
