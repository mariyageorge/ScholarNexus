import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  FolderKanban,
  FileCheck,
  Clock,
  ShieldCheck,
  Building,
  Calendar,
  ArrowRight,
  FileText,
  UserCheck,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Upload,
  Mail,
  Edit,
  Plus,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { getUserSession, getUserInitials, UserSession } from "@/lib/session";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

function FacultyDashboardHome() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic DB States
  const [requests, setRequests] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    myStudents: 0,
    activeProjects: 0,
    pendingReviews: 0,
    publications: 0,
  });

  const [dbUserStatus, setDbUserStatus] = useState<any | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Update Application Modal States
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [editInstitution, setEditInstitution] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editFacultyId, setEditFacultyId] = useState("");
  const [editResearchInterests, setEditResearchInterests] = useState("");
  const [editAreasOfExpertise, setEditAreasOfExpertise] = useState("");
  const [editOrcid, setEditOrcid] = useState("");
  const [infoResponseText, setInfoResponseText] = useState("");

  const [newDocumentBase64, setNewDocumentBase64] = useState("");
  const [newDocumentName, setNewDocumentName] = useState("");
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
          setEditInstitution(data.institution || data.affiliation || "");
          setEditDepartment(data.department || "");
          setEditDesignation(data.designation || "");
          setEditFacultyId(data.facultyId || "");
          setEditResearchInterests(Array.isArray(data.researchInterests) ? data.researchInterests.join(", ") : (data.researchInterests || ""));
          setEditAreasOfExpertise(Array.isArray(data.areasOfExpertise) ? data.areasOfExpertise.join(", ") : (data.areasOfExpertise || ""));
          setEditOrcid(data.orcid || "");
        }
      })
      .catch((err) => console.error("Error loading profile status:", err));

    // Fetch dynamic dashboard data from MongoDB
    fetch(`/api/faculty/dashboard?email=${encodeURIComponent(activeUser.email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.stats) setDashboardStats(data.stats);
          if (data.requests) setRequests(data.requests);
          if (data.projects) setActiveProjects(data.projects);
        }
      })
      .catch((err) => console.error("Error loading faculty dashboard DB data:", err));

    // Check if navigated with ?edit=true URL param
    if (typeof window !== "undefined" && window.location.search.includes("edit=true")) {
      setUpdateModalOpen(true);
    }

    // Event listener to open modal when triggered from top right profile dropdown
    const handleOpenEditModal = () => setUpdateModalOpen(true);
    window.addEventListener("open-edit-profile-modal", handleOpenEditModal);

    return () => {
      window.removeEventListener("open-edit-profile-modal", handleOpenEditModal);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewDocumentBase64(event.target?.result as string);
      setNewDocumentName(file.name);
      toast.success(`Attached verification document: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitClarification = async () => {
    if (!session) return;

    setSubmittingResponse(true);
    try {
      const payload: any = {
        email: session.email,
        status: "Pending",
        approvalStatus: "Pending",
        institution: editInstitution.trim(),
        department: editDepartment.trim(),
        designation: editDesignation.trim(),
        facultyId: editFacultyId.trim(),
        researchInterests: editResearchInterests.trim(),
        areasOfExpertise: editAreasOfExpertise.trim(),
        orcid: editOrcid.trim(),
        infoResponse: infoResponseText.trim(),
      };
      if (newDocumentBase64) {
        payload.verificationDocument = newDocumentBase64;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Application details updated successfully.");
        setUpdateModalOpen(false);
        setInfoResponseText("");
        setNewDocumentBase64("");
        setNewDocumentName("");
        setDbUserStatus((prev: any) => ({ ...prev, status: "Pending", approvalStatus: "Pending" }));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit application update.");
      }
    } catch {
      toast.error("Network error submitting application update.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const summaryCards = [
    {
      title: "Students Supervising",
      value: dashboardStats.myStudents.toString(),
      subText: "Active Scholars",
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Active Projects",
      value: dashboardStats.activeProjects.toString(),
      subText: "Research Labs & Grants",
      icon: FolderKanban,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Pending Supervision Requests",
      value: requests.filter((r) => r.status === "Pending").length.toString(),
      subText: "Student Applications",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Reviews Pending",
      value: dashboardStats.pendingReviews.toString(),
      subText: "Manuscripts & Chapters",
      icon: FileCheck,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  // Recent Activity Feed (Empty by default, populated dynamically from user activity)
  const recentActivities: any[] = [];

  // Upcoming Review Deadlines (Empty by default, populated dynamically from student submissions)
  const upcomingDeadlines: any[] = [];

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
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified Faculty
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
                    <Users className="h-3.5 w-3.5 text-emerald-500" /> View Students
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-semibold gap-1.5 hover:border-primary/50"
                >
                  <Link to="/faculty/supervision-requests">
                    <Clock className="h-3.5 w-3.5 text-amber-500" /> Review Requests
                  </Link>
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="rounded-xl bg-primary text-primary-foreground text-xs font-semibold gap-1.5 shadow-xs hover:bg-primary/90"
                >
                  <Link to="/faculty/projects">
                    <FolderKanban className="h-3.5 w-3.5" /> Research Projects
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

        {/* RECENT ACTIVITY & UPCOMING DEADLINES GRID */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2 Cols: Recent Activity Feed */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" /> Recent Activity
                  </h3>
                  <p className="text-xs text-muted-foreground">Track recent student submissions, reviews, and supervision updates.</p>
                </div>
                <Badge variant="outline" className="rounded-full text-[0.65rem] font-semibold border-muted-foreground/30">
                  Live Feed
                </Badge>
              </div>

              <div className="space-y-3">
                {recentActivities.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border rounded-2xl space-y-2">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                    <p className="text-xs font-semibold text-foreground">No recent activity recorded</p>
                    <p className="text-[0.7rem] text-muted-foreground">Activity logs will update as scholars submit proposals and papers.</p>
                  </div>
                ) : (
                  recentActivities.map((act) => (
                    <div
                      key={act.id}
                      className="rounded-2xl border border-border bg-background p-4 flex items-start gap-4 transition hover:border-primary/40"
                    >
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl font-bold ${act.color}`}>
                        <act.icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-xs text-foreground truncate">{act.title}</h4>
                          <span className="text-[0.65rem] text-muted-foreground shrink-0">{act.timestamp}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{act.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right 1 Col: Upcoming Review Deadlines */}
          <div className="space-y-4">
            <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" /> Upcoming Review Deadlines
                </h3>
              </div>

              <div className="space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-border rounded-2xl space-y-1">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto opacity-50" />
                    <p className="text-xs font-semibold text-foreground">All caught up!</p>
                    <p className="text-[0.68rem] text-muted-foreground">No pending review deadlines.</p>
                  </div>
                ) : (
                  upcomingDeadlines.map((dl) => (
                    <div key={dl.id} className="rounded-2xl border border-border bg-background p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-foreground leading-snug">{dl.title}</h4>
                        <Badge variant="outline" className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full shrink-0 ${dl.tagColor}`}>
                          {dl.tag}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground">
                        <span>Scholar: <span className="font-semibold text-foreground">{dl.scholar}</span></span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">Due {dl.dueDate}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <Button asChild variant="ghost" className="w-full text-xs font-semibold justify-between rounded-xl">
                  <Link to="/faculty/reviews">
                    View All Manuscript Reviews <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* FOCUSED FACULTY RESUBMISSION MODAL */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" /> Update Faculty Application Information
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify your application attributes and re-upload verification proof. Submitting returns your application to the Admin Pending queue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Admin Message Reminder */}
            {isInfoRequested && dbUserStatus?.adminMessage && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs space-y-1">
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Admin Request Instructions:
                </span>
                <p className="text-foreground leading-relaxed">"{dbUserStatus.adminMessage}"</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Institution Name</Label>
                <Input
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department</Label>
                <Input
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Designation / Title</Label>
                <Input
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Faculty Employee ID</Label>
                <Input
                  value={editFacultyId}
                  onChange={(e) => setEditFacultyId(e.target.value)}
                  className="rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Research Interests</Label>
              <Input
                value={editResearchInterests}
                onChange={(e) => setEditResearchInterests(e.target.value)}
                placeholder="e.g. AI, NLP, Machine Learning"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Response Message to Admin</Label>
              <Textarea
                rows={3}
                value={infoResponseText}
                onChange={(e) => setInfoResponseText(e.target.value)}
                placeholder="Provide requested clarifications or notes for system administration..."
                className="rounded-xl text-xs leading-relaxed"
              />
            </div>

            {/* Re-upload document */}
            <div className="space-y-2 border-t border-border pt-3">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Re-upload Verification Document</span>
                <span className="text-[0.65rem] text-muted-foreground font-normal">PDF or Image (Max 5MB)</span>
              </Label>

              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="rounded-xl text-xs cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold"
                />
              </div>
              {newDocumentName && (
                <p className="text-[0.7rem] text-emerald-600 font-semibold flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Ready: {newDocumentName}
                </p>
              )}
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
              <Upload className="h-3.5 w-3.5" /> Submit Updates
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
