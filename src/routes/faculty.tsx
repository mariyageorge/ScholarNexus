import { createFileRoute } from "@tanstack/react-router";
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
  BookOpen,
  MessageSquare,
  Sparkles,
  Loader2,
  AlertCircle,
  Tag,
  UserX,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty")({
  head: () => ({
    meta: [
      { title: "My Faculty Guide — ScholarNexus AI" },
      { name: "description", content: "Assigned faculty guide and review feedback for your research project." },
    ],
  }),
  component: MyFacultyPage,
});

interface AssignedFaculty {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  title: string;
  department: string;
  researchInterests?: string[];
  bio?: string;
  photoURL?: string;
}

interface StudentProject {
  id: string;
  _id?: string;
  title: string;
  domain?: string;
  status?: string;
  faculty?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  createdAt: string;
  latestFeedback?: {
    advisorName?: string;
    date?: string;
    comment?: string;
    rating?: string;
  };
}

function MyFacultyPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") return getUserSession();
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<StudentProject | null>(null);
  const [assignedFaculty, setAssignedFaculty] = useState<AssignedFaculty | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
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

      if (projects.length === 0) {
        setActiveProject(null);
        setAssignedFaculty(null);
        setLoading(false);
        return;
      }

      // Pick the active project (first project or project with assigned faculty)
      const projectWithFaculty = projects.find((p) => Boolean(p.faculty && p.faculty.trim())) || projects[0];
      setActiveProject(projectWithFaculty);

      const assignedFacultyNameOrEmail = projectWithFaculty.faculty?.trim();

      if (!assignedFacultyNameOrEmail) {
        setAssignedFaculty(null);
        setLoading(false);
        return;
      }

      // 2. Fetch ONLY Assigned Faculty from MongoDB via /api/faculty-list
      const facultyListRes = await fetch("/api/faculty-list");
      if (facultyListRes.ok) {
        const facultyList: AssignedFaculty[] = await facultyListRes.json();
        
        // Find matching faculty member by name or email
        const targetQuery = assignedFacultyNameOrEmail.toLowerCase();
        const matched = facultyList.find(
          (f) =>
            f.email.toLowerCase() === targetQuery ||
            f.name.toLowerCase().includes(targetQuery) ||
            targetQuery.includes(f.name.toLowerCase())
        );

        if (matched) {
          setAssignedFaculty(matched);
        } else {
          // Construct fallback structured faculty object if assigned string is available
          setAssignedFaculty({
            name: assignedFacultyNameOrEmail,
            email: `${assignedFacultyNameOrEmail.toLowerCase().replace(/\s+/g, ".")}@university.edu`,
            title: "Assigned Faculty Guide",
            department: "School of Advanced Computing & Research",
            researchInterests: ["Academic Research", "Artificial Intelligence", "Methodology"],
          });
        }
      } else {
        setAssignedFaculty({
          name: assignedFacultyNameOrEmail,
          email: `${assignedFacultyNameOrEmail.toLowerCase().replace(/\s+/g, ".")}@university.edu`,
          title: "Assigned Faculty Guide",
          department: "School of Advanced Computing & Research",
          researchInterests: ["Academic Research", "Artificial Intelligence", "Methodology"],
        });
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

  const getStatusBadge = (status?: string) => {
    const s = status || "In Progress";
    switch (s) {
      case "Completed":
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-none font-semibold text-xs">Completed</Badge>;
      case "In Progress":
      case "Active":
        return <Badge className="bg-primary/15 text-primary border-none font-semibold text-xs animate-pulse">In Progress</Badge>;
      case "Under Review":
        return <Badge className="bg-amber-500/15 text-amber-400 border-none font-semibold text-xs">Under Review</Badge>;
      default:
        return <Badge className="bg-blue-500/15 text-blue-400 border-none font-semibold text-xs">Planning</Badge>;
    }
  };

  if (typeof window !== "undefined" && !user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 pb-12">
        {/* Header */}
        <div className="space-y-1">
          <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
            Academic Guidance & Supervision
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" /> My Faculty
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Details of your assigned academic guide, project status, and latest review feedback.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Card className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
                <div className="space-y-3 w-full">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </Card>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-16 w-full" />
              </Card>
              <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-16 w-full" />
              </Card>
            </div>
          </div>
        ) : !activeProject || !activeProject.faculty || !assignedFaculty ? (
          /* EMPTY STATE WHEN NO FACULTY IS ASSIGNED */
          <Card className="surface-elevated rounded-2xl border-dashed border-border py-20 px-6 text-center space-y-5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto">
              <UserX className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">No Faculty Guide Assigned</h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                No Faculty Guide Assigned. Please contact your administrator.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={() => (window.location.href = "/projects")}
                className="gap-2 rounded-xl bg-primary text-xs font-semibold shadow-md"
              >
                <FolderKanban className="h-4 w-4" /> Manage Research Projects
              </Button>
            </div>
          </Card>
        ) : (
          /* ASSIGNED FACULTY CARD & PROJECT WORKSPACE */
          <div className="space-y-6">
            {/* Main Faculty Profile Card */}
            <Card className="surface-elevated overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {assignedFaculty.photoURL ? (
                      <img
                        src={assignedFaculty.photoURL}
                        alt={assignedFaculty.name}
                        className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/40 shadow-sm"
                      />
                    ) : (
                      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-card border-2 border-primary/40 text-primary font-bold text-2xl shadow-sm">
                        {(assignedFaculty?.name || "Faculty Guide")
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white shadow-md" title="Assigned Guide Active">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl font-bold text-foreground">{assignedFaculty.name}</h2>
                      <Badge variant="outline" className="rounded-full text-[0.65rem] border-primary/30 text-primary font-semibold">
                        Assigned Faculty Guide
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-primary">{assignedFaculty.title}</p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-primary shrink-0" />
                        {assignedFaculty.department}
                      </span>
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

                {/* Email Action Buttons */}
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

              {/* Research Interests */}
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

            {/* Current Project & Faculty Feedback Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Current Project Details Card */}
              <Card className="surface-elevated rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Active Assignment</span>
                    <h3 className="text-base font-bold text-foreground">Current Research Project</h3>
                  </div>
                  {getStatusBadge(activeProject.status)}
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground block">Project Title</span>
                    <p className="text-sm font-bold text-foreground mt-0.5 leading-snug">{activeProject.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40 text-xs">
                    <div>
                      <span className="text-muted-foreground font-medium block flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-primary" /> Start Date
                      </span>
                      <p className="font-bold text-foreground mt-1">
                        {formatDate(activeProject.startDate || activeProject.createdAt)}
                      </p>
                    </div>

                    <div>
                      <span className="text-muted-foreground font-medium block flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary" /> Target Completion
                      </span>
                      <p className="font-bold text-foreground mt-1">
                        {formatDate(activeProject.expectedCompletionDate || "2026-12-15")}
                      </p>
                    </div>
                  </div>

                  {activeProject.domain && (
                    <div className="pt-2">
                      <span className="text-[0.7rem] text-muted-foreground">Domain: </span>
                      <Badge variant="outline" className="rounded-md text-[0.65rem] border-border bg-muted/30">
                        {activeProject.domain}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>

              {/* Faculty Feedback Section */}
              <Card className="surface-elevated rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm flex flex-col justify-between">
                <div className="border-b border-border/60 pb-4">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">Review Status</span>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 mt-0.5">
                    <MessageSquare className="h-4 w-4 text-primary" /> Latest Faculty Feedback
                  </h3>
                </div>

                {activeProject.latestFeedback ? (
                  <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">{activeProject.latestFeedback.advisorName || assignedFaculty.name}</span>
                      <span className="text-muted-foreground text-[0.7rem]">{activeProject.latestFeedback.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      "{activeProject.latestFeedback.comment}"
                    </p>
                  </div>
                ) : (
                  /* PROFESSIONAL EMPTY STATE FOR FEEDBACK */
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 bg-muted/20 rounded-2xl border border-dashed border-border px-4 my-auto">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground">No Feedback Received Yet</h4>
                      <p className="text-[0.725rem] text-muted-foreground max-w-xs leading-relaxed">
                        Your assigned faculty guide has not published formal review feedback for this project yet. Submissions and paper reviews will appear here once reviewed.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 text-right">
                  <Button
                    variant="ghost"
                    onClick={() => (window.location.href = `/projects/${activeProject.id || activeProject._id}`)}
                    className="text-xs text-primary font-semibold hover:bg-primary/10 rounded-xl"
                  >
                    View Project Feedback Workspace →
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
