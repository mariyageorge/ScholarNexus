import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  Lock,
  Building,
  Award,
  BookOpen,
  LogOut,
  Mail,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  XCircle,
  Upload,
  FileText,
  Send,
  Edit,
  X,
} from "lucide-react";
import { getUserSession, clearUserSession, setUserSession, UserSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty-pending")({
  head: () => ({
    meta: [
      { title: "Account Verification Status — ScholarNexus AI" },
      { name: "description", content: "Faculty account verification and administrative review status." },
    ],
  }),
  component: FacultyPendingPage,
});

function FacultyPendingPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);

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

  const populateEditFields = (data: any) => {
    setEditInstitution(data.institution || data.affiliation || "");
    setEditDepartment(data.department || "");
    setEditDesignation(data.designation || "");
    setEditFacultyId(data.facultyId || "");
    setEditResearchInterests(Array.isArray(data.researchInterests) ? data.researchInterests.join(", ") : (data.researchInterests || ""));
    setEditAreasOfExpertise(Array.isArray(data.areasOfExpertise) ? data.areasOfExpertise.join(", ") : (data.areasOfExpertise || ""));
    setEditOrcid(data.orcid || "");
  };

  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchLatestProfile = async (email: string) => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
        populateEditFields(data);

        // Sync local session with latest MongoDB profile status
        const session = getUserSession();
        if (session) {
          const updatedSession = {
            ...session,
            status: data.status || session.status,
            approvalStatus: data.approvalStatus || session.approvalStatus,
          };
          setUserSession(updatedSession);
          setUser(updatedSession);
        }

        // Auto-redirect if approved
        if (data.status === "Active" || data.approvalStatus === "Approved") {
          toast.success("Your faculty account has been approved! Redirecting to dashboard...");
          window.location.href = "/faculty-dashboard";
        }
      }
    } catch (err) {
      console.error("Failed to fetch faculty profile status:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    if (session.role === "admin" || session.email === "scholarnexusadmin@gmail.com") {
      window.location.href = "/admin";
      return;
    }
    if (session.role === "student") {
      window.location.href = "/dashboard";
      return;
    }
    setUser(session);
    fetchLatestProfile(session.email);
  }, []);

  const handleLogout = () => {
    clearUserSession();
    toast.success("Logged out successfully.");
    window.location.href = "/login";
  };

  const handleContactAdmin = () => {
    window.location.href = "mailto:scholarnexusadmin@gmail.com?subject=Faculty%20Account%20Verification%20Inquiry";
  };

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
    if (!user) return;

    setSubmittingResponse(true);
    try {
      const payload: any = {
        email: user.email,
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
        toast.success("Application details updated successfully. Returned to Admin Pending queue for review.");
        setUpdateModalOpen(false);
        setInfoResponseText("");
        setNewDocumentBase64("");
        setNewDocumentName("");
        fetchLatestProfile(user.email);
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

  const currentStatus = dbUser?.status || dbUser?.approvalStatus || user?.status || "Pending";
  const isInfoRequested = currentStatus === "Awaiting Applicant Response" || dbUser?.approvalStatus === "Info Requested";
  const isRejected = currentStatus === "Rejected" || dbUser?.approvalStatus === "Rejected";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 md:p-10">
      {/* Top Brand Nav Header */}
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-emerald-500 shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">ScholarNexus AI</h1>
            <p className="text-[0.68rem] text-muted-foreground font-medium">Academic Research Ecosystem</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </Button>
      </header>

      {/* Main Verification Status Area */}
      <main className="mx-auto my-auto w-full max-w-2xl py-8 space-y-6">
        {loadingProfile ? (
          <Card className="rounded-3xl border border-border bg-card p-8 shadow-sm text-center space-y-3">
            <Clock className="h-8 w-8 text-primary mx-auto animate-spin" />
            <p className="text-xs font-semibold text-muted-foreground">Checking verification status with MongoDB...</p>
          </Card>
        ) : isInfoRequested && !dismissedBanner ? (
          <Card className="rounded-3xl border-blue-500/40 bg-blue-500/5 p-6 md:p-8 shadow-md space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/20 text-blue-500 shrink-0">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-600 bg-blue-500/10 font-bold text-[0.68rem] px-2.5 py-0.5 rounded-full">
                    Action Required: Additional Information Requested
                  </Badge>
                  <h2 className="text-xl font-bold text-foreground mt-1">Administrator Requested Additional Information</h2>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissedBanner(true)}
                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Admin Message Box */}
            <div className="rounded-2xl border border-blue-500/30 bg-card p-4 space-y-1.5 text-xs">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Reason / Instructions from Admin:
              </span>
              <p className="text-foreground leading-relaxed font-medium pl-5 border-l-2 border-blue-500">
                "{dbUser?.adminMessage || dbUser?.infoRequestMessage || "Please upload an official copy of your faculty ID card or institutional appointment letter."}"
              </p>
              <div className="text-[0.68rem] text-muted-foreground pt-1 flex justify-between">
                <span>Requested By: {dbUser?.requestedBy || "scholarnexusadmin@gmail.com"}</span>
                <span>Date: {dbUser?.requestedDate ? new Date(dbUser.requestedDate).toLocaleDateString() : "Recently"}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                onClick={() => setUpdateModalOpen(true)}
                className="w-full sm:w-auto gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-5 px-6 shadow-md shadow-blue-600/20"
              >
                <Edit className="h-4 w-4" /> Update Application Attributes
              </Button>
              <Button
                variant="outline"
                onClick={() => setDismissedBanner(true)}
                className="w-full sm:w-auto rounded-2xl text-xs font-semibold text-muted-foreground"
              >
                Dismiss Notice
              </Button>
            </div>
          </Card>
        ) : isRejected ? (
          /* SCENARIO 2: APPLICATION REJECTED */
          <Card className="rounded-3xl border-destructive/40 bg-destructive/5 p-6 md:p-8 shadow-md space-y-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/20 text-destructive mx-auto">
              <XCircle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10 px-3 py-1 text-xs font-bold rounded-full">
                Application Rejected
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">Faculty Registration Declined</h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Your faculty registration application has been reviewed and declined by system administration.
              </p>
            </div>

            {/* Rejection Reason Display */}
            <div className="rounded-2xl border border-destructive/30 bg-card p-4 text-xs text-left space-y-1">
              <span className="font-bold text-destructive flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" /> Stored Rejection Reason:
              </span>
              <p className="text-foreground leading-relaxed pl-5 border-l-2 border-destructive">
                "{dbUser?.rejectionReason || "Verification documents could not be authenticated with institutional records."}"
              </p>
            </div>
          </Card>
        ) : (
          /* SCENARIO 3: NORMAL PENDING VERIFICATION */
          <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5 p-6 md:p-8 shadow-sm space-y-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/20 text-amber-500 mx-auto animate-pulse">
              <Clock className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <Badge
                variant="outline"
                className="rounded-full border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-300 px-3 py-1 text-xs font-semibold"
              >
                Pending Admin Verification
              </Badge>

              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Welcome, {dbUser?.name || user?.name || "Faculty Member"}
              </h2>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                Your faculty registration has been submitted successfully. Your account is currently under review by system administration.
              </p>
            </div>
          </Card>
        )}

        {/* Submitted Details Card */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Faculty Registration Profile
            </h3>

            {isInfoRequested && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUpdateModalOpen(true)}
                className="gap-1.5 rounded-xl text-xs font-semibold text-blue-600 border-blue-500/30"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Information
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-2xl border border-border bg-background p-3.5 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1.5 font-medium">
                <Building className="h-3.5 w-3.5 text-primary" /> Institution
              </span>
              <p className="font-bold text-foreground truncate">{dbUser?.institution || dbUser?.affiliation || user?.institution || "Not Specified"}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-3.5 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1.5 font-medium">
                <Award className="h-3.5 w-3.5 text-indigo-500" /> Department & Designation
              </span>
              <p className="font-bold text-foreground truncate">{dbUser?.department || "Not Specified"} — {dbUser?.designation || "Faculty"}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-3.5 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1.5 font-medium">
                <GraduationCap className="h-3.5 w-3.5 text-amber-500" /> Faculty Employee ID
              </span>
              <p className="font-mono font-bold text-foreground">{dbUser?.facultyId || "Not Specified"}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-3.5 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1.5 font-medium">
                <BookOpen className="h-3.5 w-3.5 text-emerald-500" /> Research Interests
              </span>
              <p className="font-bold text-foreground truncate">
                {Array.isArray(dbUser?.researchInterests) ? dbUser.researchInterests.join(", ") : (dbUser?.researchInterests || "Not Specified")}
              </p>
            </div>
          </div>
        </Card>

        {/* Verification Timeline */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" /> Verification Timeline Status
          </h3>

          <div className="grid gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-center space-y-1">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white mx-auto">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-[0.75rem]">Account Created</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-center space-y-1">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white mx-auto">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-[0.75rem]">Info Submitted</p>
            </div>

            <div className={`rounded-2xl border p-3 text-center space-y-1 ${isInfoRequested ? "border-blue-500/40 bg-blue-500/10" : isRejected ? "border-destructive/40 bg-destructive/10" : "border-amber-500/40 bg-amber-500/10 animate-pulse"}`}>
              <div className={`grid h-7 w-7 place-items-center rounded-full text-white mx-auto ${isInfoRequested ? "bg-blue-500" : isRejected ? "bg-destructive" : "bg-amber-500"}`}>
                {isInfoRequested ? <HelpCircle className="h-4 w-4" /> : isRejected ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              <p className={`font-bold text-[0.75rem] ${isInfoRequested ? "text-blue-600" : isRejected ? "text-destructive" : "text-amber-600"}`}>
                {isInfoRequested ? "Info Requested" : isRejected ? "Rejected" : "Admin Review"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-3 text-center space-y-1 opacity-60">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground mx-auto">
                <Lock className="h-4 w-4" />
              </div>
              <p className="font-semibold text-muted-foreground text-[0.75rem]">Portal Access</p>
            </div>
          </div>
        </Card>

        {/* Quick Action Footer Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleContactAdmin}
            className="w-full sm:w-auto gap-2 rounded-xl text-xs font-semibold"
          >
            <Mail className="h-4 w-4 text-primary" /> Contact Administrator
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto gap-2 rounded-xl text-xs font-semibold text-muted-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </main>

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
            {dbUser?.adminMessage && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs space-y-1">
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Admin Request Instructions:
                </span>
                <p className="text-foreground leading-relaxed">"{dbUser.adminMessage}"</p>
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
                placeholder="e.g. Distributed Systems, Neural Architecture Search"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Areas of Expertise</Label>
                <Input
                  value={editAreasOfExpertise}
                  onChange={(e) => setEditAreasOfExpertise(e.target.value)}
                  placeholder="e.g. Deep Learning"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">ORCID iD</Label>
                <Input
                  value={editOrcid}
                  onChange={(e) => setEditOrcid(e.target.value)}
                  placeholder="0000-0002-1825-0097"
                  className="rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Document Re-upload */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Re-upload Verification Document</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="modal-doc-upload"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="modal-doc-upload"
                  className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-all"
                >
                  <Upload className="h-4 w-4 text-primary" /> Choose File
                </label>
                <span className="text-xs text-muted-foreground truncate">
                  {newDocumentName ? newDocumentName : dbUser?.verificationDocument ? "Current proof document attached" : "No new file selected"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Clarification Notes for Admin</Label>
              <Textarea
                placeholder="Explain the updates made to your credentials or document file..."
                value={infoResponseText}
                onChange={(e) => setInfoResponseText(e.target.value)}
                className="rounded-xl text-xs min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUpdateModalOpen(false)} className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
            <Button
              disabled={submittingResponse}
              onClick={handleSubmitClarification}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Submit Updated Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-4xl text-center text-xs text-muted-foreground border-t border-border pt-4">
        ScholarNexus AI Platform &copy; 2026. Academic Faculty Verification Portal.
      </footer>
    </div>
  );
}
