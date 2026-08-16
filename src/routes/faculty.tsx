import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Mail,
  Copy,
  Send,
  Building,
  FolderKanban,
  CheckCircle2,
  Clock,
  UserX,
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
      { name: "description", content: "View your assigned faculty supervisor and project supervision status." },
    ],
  }),
  component: MyFacultyPage,
});

interface FacultyMember {
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
  profileImage?: string;
}

interface StudentProject {
  id: string;
  _id?: string;
  title: string;
  domain?: string;
  status?: string;
  faculty?: string;
  facultyEmail?: string;
  supervisionStatus?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  createdAt: string;
}

interface SupervisionRequest {
  id?: string;
  _id?: string;
  projectId: string;
  projectTitle: string;
  studentEmail: string;
  studentName: string;
  facultyId: string;
  facultyEmail: string;
  facultyName: string;
  message?: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt?: string;
  requestedAt?: string;
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
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [myProjects, setMyProjects] = useState<StudentProject[]>([]);
  const [supervisionRequests, setSupervisionRequests] = useState<SupervisionRequest[]>([]);

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
      const [facultyRes, projectsRes, requestsRes] = await Promise.all([
        fetch("/api/faculty-list"),
        fetch(`/api/projects?email=${encodeURIComponent(email)}`),
        fetch(`/api/supervision-requests?studentEmail=${encodeURIComponent(email)}`),
      ]);

      if (facultyRes.ok) {
        const list = await facultyRes.json();
        if (Array.isArray(list)) setFacultyList(list);
      }

      if (projectsRes.ok) {
        const projs = await projectsRes.json();
        if (Array.isArray(projs)) setMyProjects(projs);
      }

      if (requestsRes.ok) {
        const reqs = await requestsRes.json();
        if (Array.isArray(reqs)) setSupervisionRequests(reqs);
      }
    } catch (err) {
      console.error("Error loading faculty data:", err);
      toast.error("Failed to load supervision data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    toast.success("Faculty email copied to clipboard!");
  };

  const handleSendEmail = (email: string) => {
    if (!email) return;
    const subject = encodeURIComponent("Academic Guidance / Project Query");
    window.location.href = `mailto:${email}?subject=${subject}`;
  };

  // Assigned Supervisors across all projects
  const assignedProjects = myProjects.filter(
    (p) => p.supervisionStatus === "Under Supervision" || (p.faculty && p.faculty.trim())
  );

  // Active Pending Requests
  const pendingRequests = supervisionRequests.filter((r) => r.status === "Pending");

  if (typeof window !== "undefined" && !user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
              Academic Mentorship & Guidance
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" /> My Faculty Guide
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Overview of your assigned faculty guide and active project supervision status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {assignedProjects.length > 0 && (
              <Badge variant="outline" className="rounded-xl border-emerald-500/30 text-emerald-600 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {assignedProjects.length} Supervised Project(s)
              </Badge>
            )}
          </div>
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
        ) : assignedProjects.length === 0 && pendingRequests.length === 0 ? (
          /* EMPTY STATE */
          <Card className="surface-elevated rounded-3xl border-dashed border-border py-16 px-6 text-center space-y-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto">
              <UserX className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-foreground">No supervisor assigned yet</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You currently have no faculty supervisor assigned to your research project.
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
        ) : (
          <div className="space-y-8">
            {/* ASSIGNED FACULTY SUPERVISORS SECTION */}
            {assignedProjects.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Active Faculty Supervisors ({assignedProjects.length})
                  </h3>
                  <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-xs font-semibold">
                    Supervision Active
                  </Badge>
                </div>

                <div className="grid gap-6">
                  {assignedProjects.map((project) => {
                    const matchedFaculty = facultyList.find(
                      (f) =>
                        (project.facultyEmail && f.email.toLowerCase() === project.facultyEmail.toLowerCase()) ||
                        (project.faculty && f.name.toLowerCase().includes(project.faculty.toLowerCase()))
                    );

                    const facultyName = project.faculty || matchedFaculty?.name || "Faculty Supervisor";
                    const facultyEmail = project.facultyEmail || matchedFaculty?.email || "faculty@university.edu";
                    const facultyDept = matchedFaculty?.department || "Academic Department";
                    const photo = matchedFaculty?.photoURL || matchedFaculty?.profileImage;

                    return (
                      <Card key={project.id || project._id} className="surface-elevated rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                            {photo ? (
                              <img
                                src={photo}
                                alt={facultyName}
                                className="h-16 w-16 rounded-2xl object-cover border-2 border-emerald-500/40 shrink-0 shadow-sm"
                              />
                            ) : (
                              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-xl shrink-0 border border-emerald-500/30">
                                {facultyName
                                  .split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <h3 className="text-lg font-bold text-foreground">{facultyName}</h3>
                                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[0.65rem] font-bold rounded-full px-2.5 py-0.5">
                                  Under Supervision
                                </Badge>
                              </div>

                              <p className="text-xs font-semibold text-primary">
                                {matchedFaculty?.designation || matchedFaculty?.title || "Professor & Academic Supervisor"}
                              </p>

                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-0.5">
                                <span className="flex items-center gap-1.5">
                                  <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                                  {facultyDept}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                                  {facultyEmail}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center md:justify-end gap-2 shrink-0">
                            <Button
                              onClick={() => handleCopyEmail(facultyEmail)}
                              variant="outline"
                              className="gap-1.5 rounded-xl text-xs font-semibold border-border hover:bg-muted h-9"
                            >
                              <Copy className="h-3.5 w-3.5 text-primary" /> Copy Email
                            </Button>
                            <Button
                              onClick={() => handleSendEmail(facultyEmail)}
                              className="gap-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm h-9"
                            >
                              <Send className="h-3.5 w-3.5" /> Email Guide
                            </Button>
                          </div>
                        </div>

                        {matchedFaculty?.researchInterests && matchedFaculty.researchInterests.length > 0 && (
                          <div className="pt-3 border-t border-border/60 space-y-1.5">
                            <span className="text-[0.68rem] font-bold text-muted-foreground uppercase tracking-wider block">Specializations:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {matchedFaculty.researchInterests.map((interest) => (
                                <Badge
                                  key={interest}
                                  variant="secondary"
                                  className="rounded-lg text-[0.65rem] px-2.5 py-0.5 font-medium border border-border/60"
                                >
                                  #{interest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-1.5 text-xs">
                          <span className="text-muted-foreground font-semibold block">Supervised Project:</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-foreground text-sm leading-snug">{project.title}</span>
                              <p className="text-[0.7rem] text-muted-foreground pt-0.5">Domain: {project.domain || "General Academic Research"}</p>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => (window.location.href = `/projects/${project.id || project._id}`)}
                              className="text-xs font-bold rounded-xl h-8 gap-1 self-start sm:self-auto hover:bg-primary/10 text-primary border-primary/30"
                            >
                              <FolderKanban className="h-3.5 w-3.5" /> Open Workspace →
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PENDING SUPERVISION REQUESTS SECTION */}
            {pendingRequests.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-border/80 pb-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" /> Pending Supervision Requests ({pendingRequests.length})
                  </h3>
                  <Badge variant="outline" className="rounded-full border-amber-500/30 text-amber-600 bg-amber-500/10 text-xs font-semibold">
                    Awaiting Faculty Review
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {pendingRequests.map((req) => (
                    <Card key={req.id || req._id} className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 shadow-sm space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground text-base leading-tight">Requested Faculty: {req.facultyName}</h4>
                            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[0.65rem] font-bold rounded-full px-2.5">
                              Pending Approval
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Requested for Project: <strong className="text-foreground">{req.projectTitle}</strong> • Email: <strong className="text-foreground">{req.facultyEmail}</strong>
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => (window.location.href = `/projects/${req.projectId}`)}
                          className="rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold h-8 gap-1.5"
                        >
                          <FolderKanban className="h-3.5 w-3.5" /> View Project
                        </Button>
                      </div>

                      {req.message && (
                        <div className="rounded-2xl border border-amber-500/20 bg-background/80 p-3.5 text-xs">
                          <span className="font-semibold text-foreground block mb-0.5">Submitted Message:</span>
                          <p className="text-muted-foreground italic">"{req.message}"</p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
