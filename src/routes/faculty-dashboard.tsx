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
  HelpCircle,
  Upload,
  Send,
  Edit,
  Mail,
  FileText,
} from "lucide-react";
import { getUserSession, UserSession } from "@/lib/session";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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

  // Mock Supervision Requests
  const [requests, setRequests] = useState([
    {
      id: "req-1",
      studentName: "Alex Rivera",
      topic: "Multi-Agent Reinforcement Learning for Autonomous Drone Swarms",
      submittedDate: "2026-08-02",
      status: "Pending",
      gpa: "3.92",
    },
    {
      id: "req-2",
      studentName: "Sophia Chen",
      topic: "Federated Learning Privacy Preserving Frameworks in Healthcare",
      submittedDate: "2026-08-01",
      status: "Pending",
      gpa: "3.88",
    },
    {
      id: "req-3",
      studentName: "David Kim",
      topic: "Graph Neural Networks for Molecular Property Prediction",
      submittedDate: "2026-07-29",
      status: "Accepted",
      gpa: "3.95",
    },
  ]);

  // Mock Research Projects
  const [activeProjects] = useState([
    {
      id: "proj-101",
      title: "Quantum-Resilient Neural Cryptography",
      studentsCount: 4,
      progress: 75,
      status: "Active",
      lastUpdated: "2026-08-03",
    },
    {
      id: "proj-102",
      title: "Bio-inspired Large Language Model Optimization",
      studentsCount: 3,
      progress: 40,
      status: "Under Review",
      lastUpdated: "2026-08-04",
    },
  ]);

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
    setSession(activeUser);
    setIsLoading(false);

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
        toast.success("Application details updated successfully. Returned to Admin Pending queue for review.");
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
      value: "6",
      subText: "Grant Funded & Labs",
      icon: FolderKanban,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Pending Reviews",
      value: requests.filter((r) => r.status === "Pending").length.toString(),
      subText: "Applications Needing Action",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Publications",
      value: "28",
      subText: "Peer-Reviewed Papers",
      icon: FileCheck,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
  ];

  const isInfoRequested = dbUserStatus?.approvalStatus === "Info Requested" || dbUserStatus?.status === "Awaiting Applicant Response";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Faculty Workspace
              </h1>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold text-xs">
                Verified Advisor
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Welcome back, Dr. {session?.name || "Faculty Portal"}. Manage your research groups, supervise student proposals, and track grants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setUpdateModalOpen(true)}
              variant="outline"
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" /> Edit Profile Details
            </Button>

            <Button
              size="sm"
              className="gap-2 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 font-semibold text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> New Research Group
            </Button>
          </div>
        </div>

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

              <div className="mt-3 space-y-1">
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <p className="text-[0.68rem] text-muted-foreground font-medium">{s.subText}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Grid: Student Proposals & Research Projects */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2 Cols: Student Supervision Requests */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" /> Student Supervision Requests
                  </h3>
                  <p className="text-xs text-muted-foreground">Review applications from students seeking thesis or research project guidance.</p>
                </div>

                <Badge variant="outline" className="rounded-full text-xs font-bold px-3 py-0.5 border-amber-500/40 text-amber-600 bg-amber-500/10">
                  {requests.filter((r) => r.status === "Pending").length} Pending
                </Badge>
              </div>

              <div className="space-y-3">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-border bg-background p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-primary/40"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-foreground truncate">{r.studentName}</h4>
                        <span className="text-[0.68rem] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          GPA: {r.gpa}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate">{r.topic}</p>
                      <p className="text-[0.65rem] text-muted-foreground">Submitted on {r.submittedDate}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === "Pending" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineRequest(r.id)}
                            className="rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/30"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(r.id)}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                          >
                            Accept Student
                          </Button>
                        </>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`rounded-full text-xs font-bold px-3 py-1 ${
                            r.status === "Accepted"
                              ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                              : "border-destructive/40 text-destructive bg-destructive/10"
                          }`}
                        >
                          {r.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right 1 Col: Active Labs & Research Projects */}
          <div className="space-y-4">
            <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-blue-500" /> Active Research Labs
                </h3>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>

              <div className="space-y-3">
                {activeProjects.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-border bg-background p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-xs text-foreground leading-snug">{p.title}</h4>
                      <Badge variant="outline" className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full border-blue-500/40 text-blue-600 bg-blue-500/10 shrink-0">
                        {p.status}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground font-semibold">
                        <span>Milestone Progress</span>
                        <span>{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} className="h-1.5 rounded-full" />
                    </div>

                    <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground pt-1">
                      <span>{p.studentsCount} Active Scholars</span>
                      <span>Updated {p.lastUpdated}</span>
                    </div>
                  </div>
                ))}
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
            {dbUserStatus?.adminMessage && (
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
                  id="dashboard-doc-upload"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="dashboard-doc-upload"
                  className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-all"
                >
                  <Upload className="h-4 w-4 text-primary" /> Choose File
                </label>
                <span className="text-xs text-muted-foreground truncate">
                  {newDocumentName ? newDocumentName : dbUserStatus?.verificationDocument ? "Current proof document attached" : "No new file selected"}
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
    </DashboardLayout>
  );
}
