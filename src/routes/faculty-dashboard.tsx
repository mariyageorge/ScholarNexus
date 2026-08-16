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
  UserCheck,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Mail,
  Edit,
  ExternalLink,
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

function FacultyDashboardHome() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic DB States
  const [requests, setRequests] = useState<any[]>([]);
  const [myStudentsList, setMyStudentsList] = useState<SupervisedStudentItem[]>([]);
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

    // Fetch user profile status
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
        }
      })
      .catch((err) => console.error("Error loading profile status:", err));

    // Fetch dynamic supervisor dashboard data from MongoDB
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

  const summaryCards = [
    {
      title: "Supervised Students",
      value: dashboardStats.myStudents.toString(),
      subText: "Active Supervised Scholars",
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Pending Requests",
      value: dashboardStats.pendingRequests.toString(),
      subText: "Supervision Applications",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Research Work to Review",
      value: dashboardStats.pendingReviews.toString(),
      subText: "Awaiting Faculty Feedback",
      icon: FileCheck,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Reviewed Work",
      value: dashboardStats.reviewedWork.toString(),
      subText: "Feedback Published",
      icon: CheckCircle2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
  ];

  const pendingRequestsList = requests.filter((r) => r.status === "Pending");

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
  const facultyDesignation = dbUserStatus?.designation || session?.designation || "Faculty Member";
  const facultyDept = dbUserStatus?.department || session?.department || "Academic Department";
  const facultyInstitution = dbUserStatus?.institution || dbUserStatus?.affiliation || session?.institution || session?.affiliation || "Academic Institution";
  const userPhoto = dbUserStatus?.profileImage || dbUserStatus?.photoURL || session?.profileImage || session?.photoURL;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* TOP WELCOME SECTION */}
        <Card className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Avatar className="h-20 w-20 border-2 border-emerald-500/30 shadow-md">
                {userPhoto ? (
                  <AvatarImage src={userPhoto} alt={facultyName} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-emerald-600 text-white font-bold text-2xl">
                  {getUserInitials(session || { email: "", role: "faculty", name: facultyName, profileCompleted: true })}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Welcome, {facultyName}
                  </h1>
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-500/40 text-emerald-600 bg-emerald-500/10 px-3 py-1 font-bold text-xs gap-1"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Academic Supervisor
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm font-medium text-muted-foreground flex flex-wrap items-center gap-2">
                  <span>{facultyDesignation}</span>
                  <span>•</span>
                  <span>{facultyDept}</span>
                </p>

                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <Building className="h-3.5 w-3.5 text-primary" /> {facultyInstitution}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center lg:items-end gap-3 border-t lg:border-t-0 border-border pt-4 lg:pt-0">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium pb-1 sm:pb-0">
                <Calendar className="h-3.5 w-3.5 text-emerald-500" /> {currentDateFormatted}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5 hover:border-primary/50"
                >
                  <Link to="/faculty/students">
                    <Users className="h-3.5 w-3.5 text-emerald-500" /> My Students
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5 hover:border-primary/50"
                >
                  <Link to="/faculty/supervision-requests">
                    <Clock className="h-3.5 w-3.5 text-amber-500" /> Supervision Requests
                  </Link>
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <Link to="/faculty/reviews">
                    <MessageSquare className="h-3.5 w-3.5" /> Reviews & Feedback
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Verification Alert Banner if Info Requested */}
        {isInfoRequested && !bannerDismissed && (
          <Card className="rounded-2xl border-blue-500/40 bg-blue-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500 text-white shrink-0 font-bold">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-blue-700 dark:text-blue-300 text-sm">Administrator requested additional information</p>
                <p className="text-muted-foreground truncate max-w-xl text-xs mt-0.5">
                  Reason: "{dbUserStatus.adminMessage || dbUserStatus.infoRequestMessage || "Please upload your institutional ID card or updated appointment letter."}"
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBannerDismissed(true)}
                className="rounded-xl text-xs font-semibold"
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={() => setUpdateModalOpen(true)}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-sm"
              >
                Update Application
              </Button>
            </div>
          </Card>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((s) => (
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

              <div className="mt-3 space-y-1">
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <p className="text-[0.68rem] text-muted-foreground font-medium">{s.subText}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* MAIN SUPERVISOR SECTIONS */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2 Cols: My Supervised Students */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-500" /> My Supervised Students
                  </h3>
                  <p className="text-xs text-muted-foreground">Scholars currently under your academic supervision.</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="rounded-xl text-xs font-bold text-primary gap-1">
                  <Link to="/faculty/students">
                    View All ({myStudentsList.length}) <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {myStudentsList.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-border rounded-2xl space-y-3">
                  <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-sm font-bold text-foreground">No Supervised Students Assigned Yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Students will appear here once you approve their supervision requests under Supervision Requests.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myStudentsList.map((student) => (
                    <div
                      key={student.id}
                      className="rounded-2xl border border-border bg-background p-4 space-y-3 hover:border-emerald-500/40 transition-all shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-base border border-emerald-500/20 shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground text-sm leading-snug">{student.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3 w-3" /> {student.email}
                            </p>
                          </div>
                        </div>

                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[0.68rem] font-bold w-fit">
                          Under Supervision
                        </Badge>
                      </div>

                      <div className="rounded-xl border border-border/70 bg-card p-3 space-y-2 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Research Project:</span>
                          <span className="font-semibold text-foreground truncate max-w-[250px]">{student.activeProject}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Domain:</span>
                          <span className="font-medium text-foreground">{student.domain}</span>
                        </div>
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[0.7rem] font-semibold text-muted-foreground">
                            <span>Project Progress</span>
                            <span className="text-foreground">{student.progress}%</span>
                          </div>
                          <Progress value={student.progress} className="h-2 rounded-full" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[0.68rem] text-muted-foreground">
                          Last Activity: <strong className="text-foreground">{student.lastActivity}</strong>
                        </span>

                        <Button
                          size="sm"
                          onClick={() => {
                            window.location.href = `/faculty/students?studentId=${student.id}&projectId=${student.projectId}`;
                          }}
                          className="rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-8 px-4"
                        >
                          <BookOpen className="h-3.5 w-3.5" /> View Student Workspace
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right 1 Col: Pending Supervision Requests */}
          <div className="space-y-4">
            <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" /> Pending Requests
                </h3>
                <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs font-semibold">
                  {pendingRequestsList.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {pendingRequestsList.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border rounded-2xl space-y-1">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto opacity-50" />
                    <p className="text-xs font-semibold text-foreground">No Pending Requests</p>
                    <p className="text-[0.68rem] text-muted-foreground">All supervision requests have been processed.</p>
                  </div>
                ) : (
                  pendingRequestsList.map((req) => (
                    <div key={req.id} className="rounded-2xl border border-border bg-background p-4 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-foreground text-xs">{req.studentName}</h4>
                          <p className="text-[0.7rem] text-muted-foreground">{req.studentEmail}</p>
                        </div>
                        <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-[0.65rem] font-bold shrink-0">
                          Pending
                        </Badge>
                      </div>

                      <div className="rounded-lg bg-card p-2.5 border border-border/60 space-y-1">
                        <span className="font-semibold text-foreground block truncate">{req.projectTitle}</span>
                        <span className="text-[0.68rem] text-muted-foreground block">Domain: {req.domain}</span>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs font-semibold text-amber-600 border-amber-500/30 h-7"
                        >
                          <Link to="/faculty/supervision-requests">Review Request →</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <Button asChild variant="ghost" className="w-full text-xs font-semibold justify-between rounded-xl">
                  <Link to="/faculty/supervision-requests">
                    Manage Supervision Queue <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
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
