import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  GraduationCap,
  Mail,
  BookOpen,
  Award,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Download,
  Eye,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Pencil,
  Send,
} from "lucide-react";
import { getUserSession, UserSession } from "@/lib/session";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty/students")({
  head: () => ({
    meta: [
      { title: "My Students — ScholarNexus AI Faculty" },
      { name: "description", content: "Supervised student directory and dedicated academic supervision workspace." },
    ],
  }),
  component: FacultyStudentsPage,
});

interface SupervisedStudent {
  id: string;
  _id?: string;
  name: string;
  email: string;
  department: string;
  degreeProgram: string;
  activeProject: string;
  projectId?: string;
  paperCount?: number;
  status: "Under Supervision";
  joinedDate: string;
}

interface WorkspaceData {
  student: SupervisedStudent;
  project: {
    id: string;
    title: string;
    description: string;
    domain: string;
    keywords: string[];
    progress: number;
    status: string;
    supervisionStatus: string;
    startDate: string;
    expectedCompletionDate: string;
    supervisionStartDate: string;
  } | null;
  papers: {
    id: string;
    title: string;
    uploadDate: string;
    fileType: string;
    url?: string;
    fileData?: string;
    authors?: string;
    summary?: string;
    reviewStatus: "Pending Review" | "Reviewed" | "No Review Requested";
    reviewId?: string;
    feedback?: string;
  }[];
  referencePapers?: {
    id: string;
    title: string;
    uploadDate: string;
    fileType: string;
    url?: string;
    fileData?: string;
    authors?: string;
  }[];
  researchWork?: {
    id: string;
    title: string;
    templateType: string;
    abstract: string;
    keywords: string[];
    sections: { id: string; title: string; content: string }[];
    reviewStatus: "Draft" | "Pending Review" | "Reviewed";
    reviewId?: string;
    feedback?: string;
    lastSaved: string;
  }[];
  activities: {
    id: string;
    action: string;
    title: string;
    description: string;
    timestamp: string;
    userName: string;
  }[];
}

function FacultyStudentsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<SupervisedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Selected Student Workspace State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("studentId");
    }
    return null;
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("projectId");
    }
    return null;
  });

  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Review Feedback Modal State
  const [reviewPaper, setReviewPaper] = useState<any | null>(null);
  const [selectedWorkDoc, setSelectedWorkDoc] = useState<any | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Paper Viewing Preview Modal State
  const [viewingPaper, setViewingPaper] = useState<any | null>(null);

  useEffect(() => {
    const user = getUserSession();
    if (user) {
      setSession(user);
      fetchSupervisedStudents(user.email);
    }
  }, []);

  const handleWorkDocSubmitFeedback = async () => {
    if (!selectedWorkDoc || !feedbackText.trim()) {
      toast.error("Please enter constructive academic feedback before submitting.");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedWorkDoc.id,
          projectId: workspaceData?.project?.id || (workspaceData?.project as any)?._id,
          studentEmail: workspaceData?.student?.email,
          studentName: workspaceData?.student?.name,
          facultyEmail: session?.email,
          facultyName: session?.name,
          feedback: feedbackText.trim(),
        }),
      });

      if (res.ok) {
        toast.success(`Faculty feedback submitted for "${selectedWorkDoc.title}".`);
        const updatedFeedback = feedbackText.trim();
        setSelectedWorkDoc((prev: any) => prev ? { ...prev, reviewStatus: "Reviewed", feedback: updatedFeedback } : null);
        setWorkspaceData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            researchWork: prev.researchWork?.map((w: any) =>
              w.id === selectedWorkDoc.id ? { ...w, reviewStatus: "Reviewed", feedback: updatedFeedback } : w
            ),
          };
        });
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to submit feedback.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    if (session?.email && selectedStudentId) {
      fetchStudentWorkspace(session.email, selectedStudentId, selectedProjectId || undefined);
    }
  }, [session, selectedStudentId, selectedProjectId]);

  const fetchSupervisedStudents = async (facultyEmail: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty/students?facultyEmail=${encodeURIComponent(facultyEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(data);
        }
      }
    } catch (err) {
      console.error("Error fetching supervised students:", err);
      toast.error("Failed to load supervised students directory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentWorkspace = async (facultyEmail: string, studentId: string, projectId?: string) => {
    setLoadingWorkspace(true);
    try {
      const pQuery = projectId ? `&projectId=${encodeURIComponent(projectId)}` : "";
      const res = await fetch(
        `/api/faculty/students?facultyEmail=${encodeURIComponent(facultyEmail)}&studentId=${encodeURIComponent(studentId)}${pQuery}`
      );
      if (res.ok) {
        const data = await res.json();
        setWorkspaceData(data);
      } else if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Access Denied: You do not have approved supervision access for this specific project.");
        setSelectedStudentId(null);
        setSelectedProjectId(null);
      }
    } catch (err) {
      console.error("Error fetching student workspace:", err);
      toast.error("Failed to load student supervision workspace.");
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const openStudentWorkspace = (studentId: string, projectId?: string) => {
    setSelectedStudentId(studentId);
    setSelectedProjectId(projectId || null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("studentId", studentId);
      if (projectId) {
        url.searchParams.set("projectId", projectId);
      } else {
        url.searchParams.delete("projectId");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  const closeStudentWorkspace = () => {
    setSelectedStudentId(null);
    setSelectedProjectId(null);
    setWorkspaceData(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("studentId");
      url.searchParams.delete("projectId");
      window.history.pushState({}, "", url.toString());
    }
  };

  const handleOpenReviewModal = (paper: any) => {
    setReviewPaper(paper);
    setFeedbackText(paper.feedback || "");
  };

  const handleSubmitFeedback = async () => {
    if (!reviewPaper || !feedbackText.trim()) {
      toast.error("Please enter constructive academic feedback before submitting.");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const targetReviewId = reviewPaper.reviewId;
      const payload: any = {
        feedback: feedbackText.trim(),
      };

      if (targetReviewId) {
        payload.id = targetReviewId;
      } else {
        // If paper doesn't have reviewId yet, pass IDs
        payload.projectId = workspaceData?.project?.id;
        payload.documentId = reviewPaper.id;
        payload.studentEmail = workspaceData?.student?.email;
      }

      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Faculty feedback submitted for "${reviewPaper.title}".`);
        setReviewPaper(null);
        setFeedbackText("");
        // Reload workspace data to update UI immediately
        if (session?.email && selectedStudentId) {
          fetchStudentWorkspace(session.email, selectedStudentId);
        }
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to submit review feedback.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.activeProject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {selectedStudentId && loadingWorkspace ? (
          <div className="space-y-6 animate-pulse">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <Skeleton className="h-8 w-64 rounded-xl" />
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>
            <Card className="rounded-3xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
              </div>
            </Card>
            <Card className="rounded-3xl border border-border p-6 space-y-3">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
            </Card>
          </div>
        ) : selectedStudentId && workspaceData ? (
          /* ==================================================
             STUDENT SUPERVISION WORKSPACE VIEW
             ================================================== */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Workspace Header & Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeStudentWorkspace}
                  className="rounded-xl gap-2 hover:bg-muted text-xs font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to My Students
                </Button>
                <div>
                  <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold">
                    Supervision Workspace
                  </Badge>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                    {workspaceData.student.name}
                  </h1>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("overview")}
                  className={`rounded-xl text-xs font-semibold gap-1.5 ${activeTab === "overview" ? "border-primary text-primary" : ""}`}
                >
                  <BookOpen className="h-3.5 w-3.5" /> View Project
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("papers")}
                  className={`rounded-xl text-xs font-semibold gap-1.5 ${activeTab === "papers" ? "border-primary text-primary" : ""}`}
                >
                  <FileText className="h-3.5 w-3.5" /> View Papers ({workspaceData.papers.length})
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("papers")}
                  className="rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Review Work
                </Button>
              </div>
            </div>

            {/* Student Header Info Card */}
            <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-2xl border border-emerald-500/20">
                    {workspaceData.student.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-foreground">{workspaceData.student.name}</h2>
                      <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold">
                        Supervision status: Under Supervision
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {workspaceData.student.email}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-indigo-500" /> {workspaceData.student.degreeProgram} • {workspaceData.student.department}
                    </p>
                  </div>
                </div>

                {workspaceData.project && (
                  <div className="rounded-2xl border border-border bg-background p-4 min-w-[280px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Overall Project Progress</span>
                      <span className="text-xs font-bold text-primary">{workspaceData.project.progress}%</span>
                    </div>
                    <Progress value={workspaceData.project.progress} className="h-2 rounded-full" />
                    <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground pt-1">
                      <span>Status: <strong className="text-foreground">{workspaceData.project.status}</strong></span>
                      <span>Target: <strong className="text-foreground">{workspaceData.project.expectedCompletionDate}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Currently Supervised Research Project Summary */}
            {workspaceData.project ? (
              <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-emerald-500" /> Supervised Research Project
                  </span>
                  <Badge variant="outline" className="w-fit border-indigo-500/30 text-indigo-500 bg-indigo-500/10 text-xs font-semibold">
                    Domain: {workspaceData.project.domain}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="text-lg font-bold text-foreground leading-snug">{workspaceData.project.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{workspaceData.project.description}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="font-semibold text-foreground">{workspaceData.project.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Completion:</span>
                      <span className="font-semibold text-foreground">{workspaceData.project.expectedCompletionDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supervision Start:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{workspaceData.project.supervisionStartDate}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="rounded-3xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">No active research project registered for this student yet.</p>
              </Card>
            )}

            {/* Workspace Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-muted/60 p-1 rounded-2xl border border-border w-full justify-start overflow-x-auto">
                <TabsTrigger value="overview" className="rounded-xl text-xs font-semibold gap-2 px-4 py-2">
                  <Layers className="h-3.5 w-3.5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="research-work" className="rounded-xl text-xs font-semibold gap-2 px-4 py-2">
                  <Pencil className="h-3.5 w-3.5 text-primary" /> Research Work ({workspaceData.researchWork?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="papers" className="rounded-xl text-xs font-semibold gap-2 px-4 py-2">
                  <BookOpen className="h-3.5 w-3.5" /> Reference Papers ({workspaceData.referencePapers?.length || workspaceData.papers.length})
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-xl text-xs font-semibold gap-2 px-4 py-2">
                  <Activity className="h-3.5 w-3.5" /> Project Activity
                </TabsTrigger>
                <TabsTrigger value="progress" className="rounded-xl text-xs font-semibold gap-2 px-4 py-2">
                  <TrendingUp className="h-3.5 w-3.5" /> Progress & Timeline
                </TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-6">
                {workspaceData.project ? (
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                        <BookOpen className="h-4 w-4 text-emerald-500" /> Objectives & Scope
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {workspaceData.project.description || "The primary objective of this supervised research project is to analyze, design, and validate experimental methodologies within the research domain."}
                      </p>

                      <div className="pt-3 border-t border-border space-y-2">
                        <span className="text-xs font-semibold text-foreground">Keywords & Research Focus</span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {workspaceData.project.keywords.map((kw, idx) => (
                            <Badge key={idx} variant="secondary" className="rounded-xl text-[0.7rem] px-2.5 py-0.5 font-medium">
                              #{kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>

                    <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-foreground border-b border-border pb-3">
                        Supervision Summary
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[0.7rem]">Current Status</span>
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold mt-1">
                            {workspaceData.project.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[0.7rem]">Overall Progress</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={workspaceData.project.progress} className="h-2 flex-1" />
                            <span className="font-bold text-foreground">{workspaceData.project.progress}%</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border space-y-1.5">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Start Date:</span>
                            <span className="font-medium text-foreground">{workspaceData.project.startDate}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Expected Completion:</span>
                            <span className="font-medium text-foreground">{workspaceData.project.expectedCompletionDate}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Supervision Start:</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">{workspaceData.project.supervisionStartDate}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No project overview available.</p>
                )}
              </TabsContent>

              {/* RESEARCH WORK TAB (FACULTY VIEW) */}
              <TabsContent value="research-work" className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Pencil className="h-4 w-4 text-primary" /> Research Work
                    </h3>
                    <p className="text-xs text-muted-foreground">The student's research papers, proposals, and academic writing.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-border text-xs font-semibold">
                    {(workspaceData.researchWork?.length || 0) === 1 ? "1 Document" : `${workspaceData.researchWork?.length || 0} Documents`}
                  </Badge>
                </div>

                {!workspaceData.researchWork || workspaceData.researchWork.length === 0 ? (
                  <Card className="rounded-3xl border border-dashed border-border p-8 text-center space-y-2">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-bold text-foreground">No Research Work Created Yet</p>
                    <p className="text-xs text-muted-foreground">The student has not created any research documents in this workspace.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {workspaceData.researchWork.map((work) => (
                      <Card key={work.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-purple-500/30 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-500/10 text-purple-500 font-bold shrink-0">
                              <Pencil className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 text-[0.65rem] font-semibold">
                                {work.templateType || "Research Paper"}
                              </Badge>
                              <h4 className="font-bold text-foreground text-sm leading-snug">{work.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                Last updated: {new Date(work.lastSaved).toLocaleDateString()} • {work.sections?.length || 0} Sections
                              </p>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={
                              work.reviewStatus === "Pending Review"
                                ? "border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs font-semibold w-fit"
                                : work.reviewStatus === "Reviewed"
                                ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold w-fit"
                                : "border-border text-muted-foreground text-xs font-normal w-fit"
                            }
                          >
                            {work.reviewStatus}
                          </Badge>
                        </div>

                        {work.abstract && (
                          <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5 text-xs italic text-muted-foreground">
                            <strong className="text-foreground not-italic block mb-0.5">Abstract:</strong>
                            "{work.abstract}"
                          </div>
                        )}

                        {work.feedback && (
                          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-foreground italic">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block not-italic">Published Faculty Feedback:</span>
                            "{work.feedback}"
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-[0.7rem] text-muted-foreground">
                            {work.reviewStatus === "Pending Review"
                              ? "Student requested faculty review"
                              : work.reviewStatus === "Reviewed"
                              ? "Faculty feedback published"
                              : "Review not requested yet"}
                          </span>

                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedWorkDoc(work);
                              setFeedbackText(work.feedback || "");
                            }}
                            className={`rounded-xl text-xs font-bold gap-1.5 shadow-sm ${
                              work.reviewStatus === "Reviewed"
                                ? "bg-muted text-foreground border border-border hover:bg-muted/80"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            }`}
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            {work.reviewStatus === "Reviewed" ? "View Feedback / Edit" : "Review & Provide Feedback"}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* REFERENCE PAPERS TAB (FACULTY VIEW) */}
              <TabsContent value="papers" className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" /> Reference Papers
                    </h3>
                    <p className="text-xs text-muted-foreground">Literature and reference material collected by the student for research background</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-border text-xs">
                    Total: {workspaceData.referencePapers?.length || workspaceData.papers.length} Papers
                  </Badge>
                </div>

                {(workspaceData.referencePapers?.length || workspaceData.papers.length) === 0 ? (
                  <Card className="rounded-3xl border border-dashed border-border p-8 text-center space-y-2">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-bold text-foreground">No Reference Papers Added Yet</p>
                    <p className="text-xs text-muted-foreground">The student scholar has not collected any reference papers for this project workspace.</p>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {(workspaceData.referencePapers || workspaceData.papers).map((paper) => (
                      <Card key={paper.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-primary/30 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-500 font-bold shrink-0">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground text-sm leading-snug">{paper.title}</h4>
                              <p className="text-xs text-muted-foreground pt-0.5">
                                Uploaded: {paper.uploadDate} • Format: <span className="font-medium text-foreground">{paper.fileType || "PDF"}</span>
                              </p>
                            </div>
                          </div>

                          <Badge variant="outline" className="border-border text-muted-foreground text-xs font-normal w-fit">
                            Reference Only
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-[0.7rem] text-muted-foreground">
                            Literature Reference Material
                          </span>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (paper.url) window.open(paper.url, "_blank");
                                else toast.info(`Viewing metadata for "${paper.title}".`);
                              }}
                              className="rounded-xl text-xs font-semibold h-8 gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Reference Paper
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* PROJECT ACTIVITY TAB */}
              <TabsContent value="activity" className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Project Activity Feed</h3>
                    <p className="text-xs text-muted-foreground">Chronological record of student updates, uploads, and supervision events</p>
                  </div>
                  <Badge variant="outline" className="rounded-full border-border text-xs">
                    Newest First
                  </Badge>
                </div>

                {workspaceData.activities.length === 0 ? (
                  <Card className="rounded-3xl border border-dashed border-border p-8 text-center">
                    <p className="text-xs text-muted-foreground">No recent activity recorded for this project.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {workspaceData.activities.map((act) => (
                      <Card key={act.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-start gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold shrink-0 mt-0.5">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 flex-1 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-foreground">{act.title}</span>
                            <span className="text-[0.7rem] text-muted-foreground">{new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-muted-foreground">{act.description}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* PROGRESS & TIMELINE TAB */}
              <TabsContent value="progress" className="space-y-6">
                {workspaceData.project && (
                  <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <h3 className="text-base font-bold text-foreground">Overall Project Progress</h3>
                        <p className="text-xs text-muted-foreground">Visual indicator of current thesis / project milestones</p>
                      </div>
                      <Badge variant="outline" className="rounded-full border-primary/30 text-primary bg-primary/10 text-sm font-bold px-3 py-1">
                        {workspaceData.project.progress}% Complete
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-semibold text-foreground">
                        <span>Progress Metric</span>
                        <span>{workspaceData.project.progress}%</span>
                      </div>
                      <Progress value={workspaceData.project.progress} className="h-3 rounded-full" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 pt-4 border-t border-border text-xs">
                      <div className="rounded-2xl border border-border p-4 space-y-1 bg-muted/20">
                        <span className="text-muted-foreground block text-[0.7rem]">Current Status</span>
                        <p className="font-bold text-foreground text-sm">{workspaceData.project.status}</p>
                      </div>

                      <div className="rounded-2xl border border-border p-4 space-y-1 bg-muted/20">
                        <span className="text-muted-foreground block text-[0.7rem]">Project Start Date</span>
                        <p className="font-bold text-foreground text-sm">{workspaceData.project.startDate}</p>
                      </div>

                      <div className="rounded-2xl border border-border p-4 space-y-1 bg-muted/20">
                        <span className="text-muted-foreground block text-[0.7rem]">Expected Completion</span>
                        <p className="font-bold text-foreground text-sm">{workspaceData.project.expectedCompletionDate}</p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* ==================================================
             FACULTY MY STUDENTS DIRECTORY VIEW
             ================================================== */
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
              <div>
                <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold">
                  Supervision Directory
                </Badge>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
                  My Supervised Students
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Access dedicated academic workspaces for students assigned to you through approved supervision requests
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border">
                  Total: {students.length} Assigned Scholars
                </span>
              </div>
            </div>

            {/* Toolbar & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scholar name, email, or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Loading Skeleton */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-3xl" />
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <Card className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3">
                <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-bold text-foreground">No Supervised Students Assigned Yet</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Students will appear here once their supervision requests are approved by you under Faculty → Supervision Requests.
                </p>
              </Card>
            ) : (
              /* Student Cards Grid */
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {filteredStudents.map((student) => (
                  <Card key={student.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-emerald-500/40 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-lg border border-emerald-500/20">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{student.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" /> {student.email}
                          </p>
                        </div>
                      </div>

                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[0.65rem] font-semibold">
                        Under Supervision
                      </Badge>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-3.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium"><Award className="h-3.5 w-3.5 text-indigo-500" /> Program</span>
                        <span className="font-bold text-foreground">{student.degreeProgram}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium"><BookOpen className="h-3.5 w-3.5 text-emerald-500" /> Supervised Project</span>
                      </div>
                      <p className="font-semibold text-foreground truncate">{student.activeProject}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[0.7rem] text-muted-foreground font-medium flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-primary" /> {student.paperCount ?? 0} Reference Papers
                      </span>
                      <Button
                        onClick={() => openStudentWorkspace(student.id, student.projectId)}
                        className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-9 px-4"
                      >
                        View Student Workspace
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEW FEEDBACK MODAL */}
        <Dialog open={!!reviewPaper} onOpenChange={(open) => !open && setReviewPaper(null)}>
          <DialogContent className="sm:max-w-xl rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Faculty Feedback
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Provide academic feedback for student paper: <strong className="text-foreground">{reviewPaper?.title}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-2xl border border-border bg-muted/30 p-3 space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Student Scholar:</span>
                  <span className="font-semibold text-foreground">{workspaceData?.student?.name}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Paper Format:</span>
                  <span className="font-semibold text-foreground">{reviewPaper?.fileType}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-foreground">Academic Feedback</label>
                <Textarea
                  placeholder="Enter constructive academic feedback..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  className="rounded-2xl text-xs border-border"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setReviewPaper(null)} className="rounded-xl text-xs font-semibold">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback || !feedbackText.trim()}
                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm"
              >
                {submittingFeedback ? "Submitting..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* COMPLETE RESEARCH WORK VIEWER & FACULTY REVIEW MODAL */}
        <Dialog open={!!selectedWorkDoc} onOpenChange={(open) => !open && setSelectedWorkDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] rounded-3xl p-6 overflow-y-auto space-y-6">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs font-semibold">
                      {selectedWorkDoc?.templateType || "Research Paper"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        selectedWorkDoc?.reviewStatus === "Pending Review"
                          ? "border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs font-semibold"
                          : selectedWorkDoc?.reviewStatus === "Reviewed"
                          ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold"
                          : "text-muted-foreground text-xs border-border"
                      }
                    >
                      {selectedWorkDoc?.reviewStatus || "Draft"}
                    </Badge>
                  </div>
                  <DialogTitle className="text-xl font-bold text-foreground">
                    {selectedWorkDoc?.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Student Scholar: <strong className="text-foreground">{workspaceData?.student?.name}</strong> ({workspaceData?.student?.email}) • Project: <strong className="text-foreground">{workspaceData?.project?.title}</strong>
                  </DialogDescription>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <span>Last Updated: <strong className="text-foreground">{selectedWorkDoc?.lastSaved ? new Date(selectedWorkDoc.lastSaved).toLocaleDateString() : "Recently"}</strong></span>
                </div>
              </div>
            </DialogHeader>

            {/* COMPLETE DOCUMENT SECTIONS VIEW */}
            <div className="space-y-6">
              {/* ABSTRACT SECTION */}
              <div className="space-y-2 border-b border-border pb-5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Abstract
                </h3>
                {selectedWorkDoc?.abstract ? (
                  <p className="text-xs text-foreground italic leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/60">
                    "{selectedWorkDoc.abstract}"
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-border/50">
                    Not added yet
                  </p>
                )}
              </div>

              {/* KEYWORDS SECTION */}
              <div className="space-y-2 border-b border-border pb-5">
                <h3 className="text-xs font-bold text-foreground">Keywords</h3>
                {selectedWorkDoc?.keywords && selectedWorkDoc.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWorkDoc.keywords.map((kw: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="rounded-xl text-[0.7rem] px-2.5 py-0.5 font-medium">
                        #{kw}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Not added yet</p>
                )}
              </div>

              {/* ALL COMPLETE DOCUMENT SECTIONS */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">
                  Document Content & Academic Sections
                </h3>
                {selectedWorkDoc?.sections && selectedWorkDoc.sections.length > 0 ? (
                  selectedWorkDoc.sections.map((sec: any, idx: number) => (
                    <div key={sec.id || idx} className="space-y-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
                      <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">{idx + 1}</span>
                        {sec.title}
                      </h4>
                      {sec.content ? (
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap pt-1 font-sans">
                          {sec.content}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic pt-1">
                          Not added yet
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No document sections available.</p>
                )}
              </div>

              {/* FACULTY REVIEW & FEEDBACK SECTION */}
              <div className="space-y-3 pt-4 border-t border-border bg-muted/20 p-5 rounded-3xl border">
                <label className="font-bold text-foreground flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-primary" /> Faculty Review & Academic Feedback
                </label>
                <p className="text-xs text-muted-foreground">
                  Provide guidance, suggestions, and corrections for the student's research document.
                </p>
                <Textarea
                  placeholder="Enter constructive academic feedback for this research document..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={5}
                  className="rounded-2xl text-xs border-border bg-background"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setSelectedWorkDoc(null)} className="rounded-xl text-xs">
                    Close Viewer
                  </Button>
                  <Button
                    onClick={handleWorkDocSubmitFeedback}
                    disabled={submittingFeedback || !feedbackText.trim()}
                    className="rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {submittingFeedback ? "Submitting Feedback..." : "Submit Feedback"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* PAPER PREVIEW MODAL */}
        <Dialog open={!!viewingPaper} onOpenChange={(open) => !open && setViewingPaper(null)}>
          <DialogContent className="sm:max-w-2xl rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> {viewingPaper?.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Uploaded Date: {viewingPaper?.uploadDate} • Format: {viewingPaper?.fileType}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {viewingPaper?.summary && (
                <div className="space-y-1">
                  <span className="font-semibold text-foreground">Abstract / Summary:</span>
                  <p className="text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-2xl border border-border">
                    {viewingPaper.summary}
                  </p>
                </div>
              )}

              {viewingPaper?.fileData && (
                <div className="space-y-2">
                  <span className="font-semibold text-foreground">Document File Preview:</span>
                  <div className="h-64 rounded-2xl border border-border bg-slate-950 p-4 text-slate-200 overflow-y-auto font-mono text-[0.75rem]">
                    {viewingPaper.fileData.startsWith("data:application/pdf") ? (
                      <iframe src={viewingPaper.fileData} className="w-full h-full rounded-xl" title="Paper PDF Preview" />
                    ) : (
                      <p className="whitespace-pre-wrap">{viewingPaper.fileData.slice(0, 1000)}...</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingPaper(null)} className="rounded-xl text-xs font-semibold">
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
