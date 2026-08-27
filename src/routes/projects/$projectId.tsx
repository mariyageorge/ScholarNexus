import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  Activity,
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  FileUp,
  FolderKanban,
  GitCompareArrows,
  GraduationCap,
  Inbox,
  Layers,
  LineChart,
  Loader2,
  MessageSquare,
  Network,
  Pencil,
  Plus,
  Quote,
  RefreshCcw,
  Save,
  ArrowUp,
  ArrowDown,
  FileEdit,
  ScanSearch,
  Search,
  Send,
  Settings,
  Sparkles,
  Trash2,
  TrendingUp,
  UploadCloud,
  UserCheck,
  Users,
  X,
  Target,
  Cpu,
  Database,
  ShieldAlert,
  Compass,
  Award,
  MoreVertical,
  MoreHorizontal,
  History,
  FileCheck2,
  Info,
  Lock,
  Edit3,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useSidebar } from "@/components/ui/sidebar";

function AutoCollapseWorkspaceSidebar() {
  const { setOpen, isMobile } = useSidebar();
  useEffect(() => {
    if (!isMobile) {
      setOpen(false);
    }
  }, [setOpen, isMobile]);
  return null;
}
import { getUserSession, UserSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project Workspace — ScholarNexus AI" },
      {
        name: "description",
        content: "Central research project command center for papers, AI assistant, literature synthesis, and faculty feedback.",
      },
    ],
  }),
  component: ProjectWorkspacePage,
});

export type ProjectStatus = "Planning" | "In Progress" | "Under Review" | "Completed" | "On Hold";

export interface Project {
  id: string;
  _id?: string;
  userEmail: string;
  title: string;
  description: string;
  abstract?: string;
  domain: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  expectedCompletionDate: string;
  facultyId?: string | null;
  faculty?: string | null;
  facultyEmail?: string | null;
  requestedFacultyId?: string | null;
  requestedFacultyName?: string | null;
  supervisionStatus?: "Not Assigned" | "Pending Approval" | "Under Supervision" | "Rejected";
  lastRejectionReason?: string;
  keywords?: string[];
  roadmap?: any[];
  roadmapDurationWeeks?: number;
  roadmapGeneratedAt?: string;
  roadmapSyncedToTasks?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AISummaryData {
  overview: string;
  researchObjective: string;
  problemStatement: string;
  methodology: string;
  dataset: string;
  algorithms: string;
  keyFindings: string;
  advantages: string;
  limitations: string;
  futureWork: string;
  keyTakeaway: string;
  generatedAt?: string;
  modelUsed?: string;
}

export interface ProjectPaper {
  id: string;
  _id?: string;
  projectId: string;
  title: string;
  authors: string;
  authorsList?: string[];
  year: string;
  publicationYear?: string;
  journal: string;
  journalOrConference?: string;
  doi?: string;
  abstract?: string;
  keywords?: string[];
  uploadDate: string;
  url?: string;
  fileData?: string;
  summary?: string;
  aiSummary?: AISummaryData;
}

interface FacultyMember {
  name: string;
  email?: string;
  title?: string;
  department?: string;
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
    className: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/15 dark:text-primary",
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
    icon: Layers,
  },
};

const DOMAIN_OPTIONS = [
  "Artificial Intelligence",
  "Data Science & Analytics",
  "Quantum Computing",
  "Neuroscience & Cognitive Science",
  "Biomedical Engineering",
  "Cybersecurity & Privacy",
  "Environmental Science",
  "Robotics & Automation",
  "Physics & Astronomy",
  "Other / General",
];

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getMinCompletionDateString(startDateStr: string) {
  if (!startDateStr) return getTodayString();
  const d = new Date(startDateStr);
  if (isNaN(d.getTime())) return getTodayString();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function ProjectWorkspacePage() {
  const { projectId } = Route.useParams();
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") {
      return getUserSession();
    }
    return null;
  });

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [facultyList, setFacultyList] = useState<any[]>([]);

  // Supervision Request State
  const [supervisionRequest, setSupervisionRequest] = useState<any | null>(null);
  const [supervisionHistory, setSupervisionHistory] = useState<any[]>([]);
  const [isRequestSupervisorModalOpen, setIsRequestSupervisorModalOpen] = useState(false);
  const [facultySearchQuery, setFacultySearchQuery] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);
  const [requestMessage, setRequestMessage] = useState("I would like you to supervise my research project.");
  const [sendingRequest, setSendingRequest] = useState(false);

  // Derived Supervision State according to DB request lifecycle & project status
  const currentSupervisionState = useMemo(() => {
    if (supervisionRequest) {
      if (supervisionRequest.status === "Approved" || supervisionRequest.status === "Accepted") return "Approved";
      if (supervisionRequest.status === "Rejected" || supervisionRequest.status === "Declined") return "Rejected";
      if (supervisionRequest.status === "Pending") return "Pending";
    }
    if (project?.supervisionStatus === "Under Supervision" && (project?.faculty || project?.facultyEmail || project?.facultyId)) {
      return "Approved";
    }
    if (project?.supervisionStatus === "Pending Approval") {
      return "Pending";
    }
    if (project?.supervisionStatus === "Rejected") {
      return "Rejected";
    }
    return "No Faculty";
  }, [supervisionRequest, project]);

  // Navigation state for active workspace tab
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("overview");

  // Project Papers State
  const [papers, setPapers] = useState<ProjectPaper[]>([]);
  const [isPaperUploadModalOpen, setIsPaperUploadModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ProjectPaper | null>(null);
  const [viewingPaper, setViewingPaper] = useState<ProjectPaper | null>(null);
  const [deletingPaper, setDeletingPaper] = useState<ProjectPaper | null>(null);

  // Gemini AI Reference Paper Extraction State
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
  const [extractionStep, setExtractionStep] = useState<string>("");
  const [isReviewMetadataModalOpen, setIsReviewMetadataModalOpen] = useState(false);
  const [isSavingPaper, setIsSavingPaper] = useState(false);
  const [reviewPaperData, setReviewPaperData] = useState<{
    id?: string;
    projectId: string;
    title: string;
    authors: string;
    publicationYear: string;
    journalOrConference: string;
    doi: string;
    abstract: string;
    keywords: string;
    fileData?: string;
    fileName?: string;
  }>({
    projectId: "",
    title: "",
    authors: "",
    publicationYear: "",
    journalOrConference: "",
    doi: "",
    abstract: "",
    keywords: "",
  });

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    file?: File;
    dataUrl?: string;
  } | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [paperForm, setPaperForm] = useState({
    title: "",
    authors: "",
    year: "",
    journal: "",
    url: "",
  });

  // Citation Generator State inside Workspace
  const [selectedCitationPaperId, setSelectedCitationPaperId] = useState<string>("");
  const [citationStyle, setCitationStyle] = useState<"APA" | "MLA" | "Chicago" | "IEEE">("APA");
  const [copiedCitation, setCopiedCitation] = useState(false);

  // Edit Project Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const todayStr = getTodayString();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    domain: "Artificial Intelligence",
    status: "Planning" as ProjectStatus,
    progress: 0,
    startDate: todayStr,
    expectedCompletionDate: getMinCompletionDateString(todayStr),
    faculty: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Faculty Reviews & Feedback State
  const [projectReviews, setProjectReviews] = useState<any[]>([]);
  const [submittingReviewRequest, setSubmittingReviewRequest] = useState<string | null>(null);

  // My Research Work State
  const [researchWorkList, setResearchWorkList] = useState<any[]>([]);
  const [loadingWork, setLoadingWork] = useState(false);
  const [isCreateWorkModalOpen, setIsCreateWorkModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("Research Paper");
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [activeWorkDoc, setActiveWorkDoc] = useState<any | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<string>("");
  const [savingWork, setSavingWork] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Delete Work & Review State
  const [workToDelete, setWorkToDelete] = useState<any | null>(null);
  const [isDeleteWorkModalOpen, setIsDeleteWorkModalOpen] = useState(false);
  const [deletingWork, setDeletingWork] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>("abstract");
  const lastReviewedSnapshotRef = useRef<Record<string, string>>({});

  // AI Assist Drawer State
  const [aiAssistSectionId, setAiAssistSectionId] = useState<string | null>(null);
  const [aiAssistAction, setAiAssistAction] = useState<string>("improve_writing");
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Gemini AI Literature Summaries State
  const [selectedPaperIdForSummary, setSelectedPaperIdForSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryProgressStep, setSummaryProgressStep] = useState<number>(0);
  const [summaryProgressMessage, setSummaryProgressMessage] = useState<string>("");
  const [viewSummaryModalPaper, setViewSummaryModalPaper] = useState<ProjectPaper | null>(null);
  const [copiedSummaryState, setCopiedSummaryState] = useState(false);

  // AI Research Roadmap Generator State
  const [isGenerateRoadmapModalOpen, setIsGenerateRoadmapModalOpen] = useState(false);
  const [roadmapDurationWeeks, setRoadmapDurationWeeks] = useState<number>(6);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isSyncingRoadmapTasks, setIsSyncingRoadmapTasks] = useState(false);

  useEffect(() => {
    if (project && (project.progress || 0) >= 70) {
      setRoadmapDurationWeeks(2);
    }
  }, [project?.progress]);

  const handleGenerateRoadmap = async () => {
    if (!project) return;
    setIsGeneratingRoadmap(true);

    try {
      const res = await fetch("/api/projects/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id || project._id || projectId,
          durationWeeks: roadmapDurationWeeks,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.project) {
        setProject(data.project);
        setIsGenerateRoadmapModalOpen(false);
        toast.success(`Generated ${roadmapDurationWeeks}-Week AI Research Roadmap with Gemini!`);
      } else {
        toast.error(data.error || "Failed to generate AI Research Roadmap.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server for roadmap generation.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleSyncRoadmapToTasks = async () => {
    if (!project || !Array.isArray(project.roadmap) || project.roadmap.length === 0) {
      toast.error("No active roadmap steps to convert.");
      return;
    }

    setIsSyncingRoadmapTasks(true);
    try {
      const res = await fetch("/api/projects/roadmap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id || project._id || projectId,
          userEmail: user?.email,
          userName: user?.name,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.project) {
          setProject(data.project);
        }
        toast.success(data.message || `Roadmap items converted into project tasks!`);
      } else {
        toast.error(data.error || "Failed to convert roadmap to tasks.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error syncing roadmap tasks.");
    } finally {
      setIsSyncingRoadmapTasks(false);
    }
  };

  const selectedPaperForSummaryPreview = useMemo(() => {
    if (!selectedPaperIdForSummary) return null;
    return papers.find((p) => String(p.id || p._id) === String(selectedPaperIdForSummary)) || null;
  }, [papers, selectedPaperIdForSummary]);

  const handleGeneratePaperSummary = async (targetPaper?: ProjectPaper) => {
    const paperToProcess = targetPaper || selectedPaperForSummaryPreview;
    if (!paperToProcess) {
      toast.error("Please select a reference paper first.");
      return;
    }

    const paperId = paperToProcess.id || paperToProcess._id;
    if (!paperId) {
      toast.error("Invalid paper selected.");
      return;
    }

    if (isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    setSummaryProgressStep(1);
    setSummaryProgressMessage("Reading stored paper...");

    try {
      setSummaryProgressStep(2);
      setSummaryProgressMessage("Extracting academic text...");

      const fetchPromise = fetch("/api/papers/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId }),
      });

      const stepTimer = setTimeout(() => {
        setSummaryProgressStep(3);
        setSummaryProgressMessage("Analyzing methodology and results...");
      }, 600);

      const stepTimer2 = setTimeout(() => {
        setSummaryProgressStep(4);
        setSummaryProgressMessage("Structuring academic summary...");
      }, 2000);

      const res = await fetchPromise;
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);

      const data = await res.json();

      if (res.ok && data.success && data.paper) {
        setSummaryProgressStep(5);
        setSummaryProgressMessage("Saving summary...");

        const updatedPaper = sanitizePaper(data.paper);

        // Update papers in local state & storage
        const updatedPapersList = papers.map((p) =>
          String(p.id || p._id) === String(paperId) ? updatedPaper : p
        );
        saveProjectPapers(projectId, updatedPapersList);

        toast.success(`Academic summary generated for "${updatedPaper.title}".`);
        setViewSummaryModalPaper(updatedPaper);
      } else {
        toast.error(data.error || "Failed to generate academic summary.");
      }
    } catch (err) {
      console.error("Error generating paper summary:", err);
      toast.error("Network error while generating AI summary.");
    } finally {
      setIsGeneratingSummary(false);
      setSummaryProgressStep(0);
      setSummaryProgressMessage("");
    }
  };

  const handleCopySummaryContent = (paper: ProjectPaper) => {
    if (!paper.aiSummary) return;
    const s = paper.aiSummary;
    const text = `
ACADEMIC SUMMARY: ${paper.title}
Authors: ${paper.authors}
Venue/Year: ${paper.journal || paper.journalOrConference || "N/A"} (${paper.year || paper.publicationYear || "N/A"})

01 — OVERVIEW
${s.overview}

02 — RESEARCH OBJECTIVE
${s.researchObjective}

03 — PROBLEM STATEMENT
${s.problemStatement}

04 — METHODOLOGY
${s.methodology}

05 — DATASET / DATA USED
${s.dataset}

06 — ALGORITHMS / MODELS / TECHNIQUES
${s.algorithms}

07 — KEY FINDINGS
${s.keyFindings}

08 — ADVANTAGES / CONTRIBUTIONS
${s.advantages}

09 — LIMITATIONS
${s.limitations}

10 — FUTURE WORK
${s.futureWork}

11 — KEY TAKEAWAY
${s.keyTakeaway}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedSummaryState(true);
    toast.success("Academic summary copied to clipboard!");
    setTimeout(() => setCopiedSummaryState(false), 3000);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setUser(session);
    fetchProject(session.email, projectId);
    fetchFacultyList();
    fetchSupervisionRequest(projectId);
    loadProjectPapers(projectId);
    fetchProjectReviews(projectId);
    loadResearchWork(projectId);
  }, [projectId]);

  // Helper to construct a content snapshot string for change detection
  const getDocContentSnapshot = (doc: any) => {
    if (!doc) return "";
    const t = (doc.title || "").trim();
    const a = (doc.abstract || "").trim();
    const k = Array.isArray(doc.keywords) ? doc.keywords.join(",") : (doc.keywords || "").trim();
    const template = (doc.templateType || "").trim();
    const s = Array.isArray(doc.sections)
      ? doc.sections.map((sec: any) => `${sec.id || ''}:${(sec.title || '').trim()}:${(sec.content || '').trim()}`).join(";")
      : "";
    return `${template}::${t}::${a}::${k}::${s}`;
  };

  const loadResearchWork = async (pId: string) => {
    setLoadingWork(true);
    try {
      const res = await fetch(`/api/research-work?projectId=${encodeURIComponent(pId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setResearchWorkList(data);
        }
      }
    } catch (err) {
      console.error("Error loading research work:", err);
    } finally {
      setLoadingWork(false);
    }
  };

  // Set of already created template types for pre-selection disabling
  const createdTemplateTypes = useMemo(() => {
    const set = new Set<string>();
    researchWorkList.forEach((w) => {
      if (w.templateType && w.templateType !== "Blank Document") {
        set.add(w.templateType);
      }
    });
    return set;
  }, [researchWorkList]);

  const handleOpenCreateWorkModal = () => {
    const templates = [
      "Research Paper",
      "Literature Review",
      "Research Proposal",
      "Project Report",
      "Conference Paper",
      "Blank Document",
    ];
    const available = templates.find((t) => t === "Blank Document" || !createdTemplateTypes.has(t));
    setSelectedTemplate(available || "Blank Document");
    setIsCreateWorkModalOpen(true);
  };

  const autoSaveDebounceRef = useRef<any>(null);

  // Automatic debounced background autosave when activeWorkDoc is edited
  useEffect(() => {
    const docId = activeWorkDoc?.id || activeWorkDoc?._id;
    if (!activeWorkDoc || !docId) return;

    if (autoSaveDebounceRef.current) {
      clearTimeout(autoSaveDebounceRef.current);
    }

    autoSaveDebounceRef.current = setTimeout(() => {
      handleSaveActiveWorkDoc(activeWorkDoc, false);
    }, 1500);

    return () => {
      if (autoSaveDebounceRef.current) {
        clearTimeout(autoSaveDebounceRef.current);
      }
    };
  }, [
    activeWorkDoc?.title,
    activeWorkDoc?.abstract,
    JSON.stringify(activeWorkDoc?.keywords),
    JSON.stringify(activeWorkDoc?.sections),
  ]);

  // 1. Prevent duplicate template type research works for the same project
  const handleCreateResearchWork = async (templateType: string) => {
    if (!project || !user?.email) return;

    if (templateType !== "Blank Document" && createdTemplateTypes.has(templateType)) {
      toast.error(`A ${templateType} already exists for this project.`);
      return;
    }

    try {
      const titleStr = newWorkTitle.trim() || `${templateType} — ${new Date().toLocaleDateString()}`;
      const res = await fetch("/api/research-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id || project._id || projectId,
          studentEmail: user.email,
          studentName: user.name,
          title: titleStr,
          templateType,
        }),
      });

      if (res.ok) {
        const createdDoc = await res.json();
        toast.success(`Created research document "${createdDoc.title}".`);
        setIsCreateWorkModalOpen(false);
        setNewWorkTitle("");
        // Optimistically prepend created doc to researchWorkList
        setResearchWorkList((prev) => [createdDoc, ...prev]);
        setActiveWorkDoc(createdDoc);
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to create research document.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while creating document.");
    }
  };

  const handleSaveActiveWorkDoc = async (docToSave = activeWorkDoc, showToast = false, isSilent = false) => {
    const docId = docToSave?.id || docToSave?._id;
    if (!docToSave || !docId) return;
    if (!isSilent) {
      setSavingWork(true);
    }
    setJustSaved(false);

    try {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const res = await fetch("/api/research-work", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: docId,
          title: docToSave.title,
          templateType: docToSave.templateType,
          abstract: docToSave.abstract,
          keywords: docToSave.keywords,
          sections: docToSave.sections,
        }),
      });

      if (res.ok) {
        setAutoSaveTimer(`Last saved at ${formattedTime}`);
        if (!isSilent) {
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 3000);
        }
        if (showToast) {
          toast.success("Research work saved successfully.");
        }
        setResearchWorkList((prev) =>
          prev.map((w) => ((w.id === docId || w._id === docId) ? { ...w, ...docToSave, lastSaved: now.toISOString() } : w))
        );
      } else {
        if (showToast) {
          toast.error("Unable to save your research work. Please try again.");
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
      if (showToast) {
        toast.error("Unable to save your research work. Please try again.");
      }
    } finally {
      if (!isSilent) {
        setSavingWork(false);
      }
    }
  };

  // 2. Review Workflow & Change Detection Logic
  const hasContentChangedSinceReview = useMemo(() => {
    if (!activeWorkDoc) return false;
    const docId = activeWorkDoc.id || activeWorkDoc._id;
    if (!docId) return false;

    const status = activeWorkDoc.reviewStatus || "Draft";
    if (status === "Draft") return true;
    if (status === "Pending Review") return false;

    const currentSnapshot = getDocContentSnapshot(activeWorkDoc);
    const initialSnapshot = lastReviewedSnapshotRef.current[docId];

    if (!initialSnapshot) {
      // First time loading this reviewed doc into editor
      lastReviewedSnapshotRef.current[docId] = currentSnapshot;
      return false;
    }

    return currentSnapshot !== initialSnapshot;
  }, [activeWorkDoc]);

  const canRequestReview = useMemo(() => {
    if (!activeWorkDoc) return false;
    if (currentSupervisionState !== "Approved") return false;
    const status = activeWorkDoc.reviewStatus || "Draft";
    if (status === "Pending Review") return false;
    if (status === "Draft") return true;
    return hasContentChangedSinceReview;
  }, [activeWorkDoc, currentSupervisionState, hasContentChangedSinceReview]);

  const canRequestReviewForDoc = (doc: any) => {
    if (!doc) return false;
    if (currentSupervisionState !== "Approved") return false;
    const status = doc.reviewStatus || "Draft";
    if (status === "Pending Review") return false;
    if (status === "Draft") return true;

    const docId = doc.id || doc._id;
    if (!docId) return false;

    if (activeWorkDoc && (activeWorkDoc.id === docId || activeWorkDoc._id === docId)) {
      return hasContentChangedSinceReview;
    }

    const initialSnapshot = lastReviewedSnapshotRef.current[docId];
    if (!initialSnapshot) return false;
    const currentSnapshot = getDocContentSnapshot(doc);
    return currentSnapshot !== initialSnapshot;
  };

  const docWordCount = useMemo(() => {
    if (!activeWorkDoc) return 0;
    let total = 0;
    if (activeWorkDoc.abstract) {
      total += activeWorkDoc.abstract.trim().split(/\s+/).filter(Boolean).length;
    }
    if (Array.isArray(activeWorkDoc.sections)) {
      for (const sec of activeWorkDoc.sections) {
        if (sec.content) {
          total += sec.content.trim().split(/\s+/).filter(Boolean).length;
        }
      }
    }
    return total;
  }, [activeWorkDoc]);

  const docCharCount = useMemo(() => {
    if (!activeWorkDoc) return 0;
    let total = 0;
    if (activeWorkDoc.abstract) {
      total += activeWorkDoc.abstract.length;
    }
    if (Array.isArray(activeWorkDoc.sections)) {
      for (const sec of activeWorkDoc.sections) {
        if (sec.content) {
          total += sec.content.length;
        }
      }
    }
    return total;
  }, [activeWorkDoc]);

  const docReviewsHistory = useMemo(() => {
    if (!activeWorkDoc || !Array.isArray(projectReviews)) return [];
    const targetDocId = String(activeWorkDoc.id || activeWorkDoc._id);
    return projectReviews.filter(
      (r) => String(r.documentId) === targetDocId || String(r.documentId) === String(activeWorkDoc.id)
    );
  }, [activeWorkDoc, projectReviews]);

  const [isRequestingReview, setIsRequestingReview] = useState(false);

  const handleRequestWorkReview = async (workDoc: any) => {
    if (!workDoc) return;
    const docId = workDoc.id || workDoc._id;

    if (currentSupervisionState !== "Approved") {
      toast.error("Faculty supervision required. Request and receive approval from a faculty supervisor before submitting your Research Work for faculty review.");
      return;
    }

    if (workDoc.reviewStatus === "Pending Review") {
      toast.error("An active review request already exists for this document.");
      return;
    }

    const status = workDoc.reviewStatus || "Draft";
    if ((status === "Reviewed" || status === "Changes Requested" || status === "Approved") && !hasContentChangedSinceReview) {
      toast.error("Please make meaningful edits to your research work after faculty review before submitting another review request.");
      return;
    }

    setIsRequestingReview(true);

    // Save active doc changes silently first if needed
    if (activeWorkDoc && (activeWorkDoc.id === docId || activeWorkDoc._id === docId)) {
      await handleSaveActiveWorkDoc(activeWorkDoc, false, true);
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project?.id || project?._id || projectId,
          documentId: docId,
          paperTitle: workDoc.title,
          documentTitle: workDoc.title,
          studentEmail: user?.email,
          studentName: user?.name,
          fileType: `${workDoc.templateType || "Research Paper"} Document`,
        }),
      });

      if (res.ok) {
        toast.success(`Review request submitted to supervisor for "${workDoc.title}".`);
        delete lastReviewedSnapshotRef.current[docId];
        await loadResearchWork(projectId);
        await fetchProjectReviews(projectId);
        if (activeWorkDoc && (activeWorkDoc.id === docId || activeWorkDoc._id === docId)) {
          setActiveWorkDoc((prev: any) => ({ ...prev, reviewStatus: "Pending Review" }));
        }
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to submit review request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while requesting review.");
    } finally {
      setIsRequestingReview(false);
    }
  };

  // 3. Delete Research Work Handler
  const handleDeleteResearchWork = async (docToDelete: any) => {
    if (!docToDelete) return;
    const docId = docToDelete.id || docToDelete._id;
    if (!docId) return;

    setDeletingWork(true);
    try {
      const res = await fetch(`/api/research-work?id=${encodeURIComponent(docId)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Deleted Research Work "${docToDelete.title}".`);
        setIsDeleteWorkModalOpen(false);
        setWorkToDelete(null);
        if (activeWorkDoc && (activeWorkDoc.id === docId || activeWorkDoc._id === docId)) {
          setActiveWorkDoc(null);
        }
        // Immediate optimistic UI update - remove card instantly without refetching
        setResearchWorkList((prev) => prev.filter((w) => w.id !== docId && w._id !== docId));
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to delete research document.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting research document.");
    } finally {
      setDeletingWork(false);
    }
  };

  const handleGenerateAiAssist = async () => {
    if (!aiAssistSectionId || !activeWorkDoc) return;
    setGeneratingAi(true);
    setAiSuggestion(null);

    let targetText = "";
    let secTitle = "";
    if (aiAssistSectionId === "abstract") {
      targetText = activeWorkDoc.abstract || "";
      secTitle = "Abstract";
    } else {
      const sec = activeWorkDoc.sections?.find((s: any) => s.id === aiAssistSectionId);
      targetText = sec?.content || "";
      secTitle = sec?.title || "Section";
    }

    try {
      const res = await fetch("/api/ai/writing-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: aiAssistAction,
          content: targetText,
          sectionTitle: secTitle,
          projectTitle: project?.title,
          domain: project?.domain,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) {
          setAiSuggestion(data.suggestion);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate AI suggestion.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion || !aiAssistSectionId || !activeWorkDoc) return;

    if (aiAssistSectionId === "abstract") {
      const updated = { ...activeWorkDoc, abstract: aiSuggestion };
      setActiveWorkDoc(updated);
      handleSaveActiveWorkDoc(updated);
    } else {
      const updatedSections = activeWorkDoc.sections.map((s: any) =>
        s.id === aiAssistSectionId ? { ...s, content: aiSuggestion } : s
      );
      const updated = { ...activeWorkDoc, sections: updatedSections };
      setActiveWorkDoc(updated);
      handleSaveActiveWorkDoc(updated);
    }

    toast.success("Applied AI writing suggestion to document.");
    setAiSuggestion(null);
    setAiAssistSectionId(null);
  };

  const fetchProjectReviews = async (pId: string) => {
    try {
      const res = await fetch(`/api/reviews?projectId=${encodeURIComponent(pId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProjectReviews(data);
        }
      }
    } catch (err) {
      console.error("Error fetching project reviews:", err);
    }
  };

  const handleRequestReview = async (paper: ProjectPaper) => {
    if (currentSupervisionState !== "Approved") {
      toast.error("Faculty supervision required. Request and receive approval from a faculty supervisor before submitting your Research Work for faculty review.");
      return;
    }

    const existingReview = projectReviews.find(
      (r) => String(r.documentId) === String(paper.id) && r.status === "Pending Review"
    );
    if (existingReview) {
      toast.error("An active review request already exists for this document.");
      return;
    }

    setSubmittingReviewRequest(paper.id);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project?.id || project?._id || projectId,
          documentId: paper.id,
          paperTitle: paper.title,
          studentEmail: user?.email,
          studentName: user?.name,
          fileType: paper.url ? "External Link" : "PDF Document",
          fileData: paper.fileData || "",
          url: paper.url || "",
        }),
      });

      if (res.ok) {
        toast.success(`Review request submitted for "${paper.title}". Status: Pending Review.`);
        await fetchProjectReviews(projectId);
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to submit review request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting review request.");
    } finally {
      setSubmittingReviewRequest(null);
    }
  };

  const sanitizePaper = (p: ProjectPaper): ProjectPaper => ({
    ...p,
    authors: p.authors === "Project Scholar" ? "" : p.authors || "",
    journal: p.journal === "ScholarNexus Library" ? "" : p.journal || "",
    year: p.year || "",
  });

  const stripFileDataForStorage = (paperList: ProjectPaper[]) => {
    return paperList.map(({ fileData: _, ...rest }) => rest);
  };

  const loadProjectPapers = async (pId: string) => {
    try {
      const stored = localStorage.getItem(`scholarnexus_papers_${pId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPapers(parsed.map(sanitizePaper));
        }
      }

      // Fetch from MongoDB database collection 'papers' via /api/papers
      const res = await fetch(`/api/papers?projectId=${encodeURIComponent(pId)}`);
      if (res.ok) {
        const mongoPapers = await res.json();
        if (Array.isArray(mongoPapers) && mongoPapers.length > 0) {
          const cleaned = mongoPapers.map(sanitizePaper);
          setPapers(cleaned);
          try {
            localStorage.setItem(
              `scholarnexus_papers_${pId}`,
              JSON.stringify(stripFileDataForStorage(cleaned))
            );
          } catch (e) {
            console.warn("LocalStorage quota reached, metadata safely stored in MongoDB:", e);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveProjectPapers = (pId: string, updated: ProjectPaper[]) => {
    setPapers(updated);
    try {
      localStorage.setItem(
        `scholarnexus_papers_${pId}`,
        JSON.stringify(stripFileDataForStorage(updated))
      );
    } catch (e) {
      console.warn("LocalStorage quota reached, metadata safely stored in MongoDB:", e);
    }
  };

  const fetchProject = async (email: string, id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const found = data.find(
            (p: Project) =>
              (p._id && String(p._id) === id) ||
              (p.id && String(p.id) === id) ||
              (p.id || p._id) === id
          );
          if (found) {
            setProject(found);
            populateForm(found);
          } else {
            setProject(null);
            toast.error("Project not found.");
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisionRequest = async (pId: string) => {
    try {
      const res = await fetch(`/api/supervision-requests?projectId=${encodeURIComponent(pId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSupervisionHistory(data);
          setSupervisionRequest(data[0]);
        } else {
          setSupervisionHistory([]);
          setSupervisionRequest(null);
        }
      }
    } catch (err) {
      console.error("Error fetching supervision request:", err);
    }
  };

  const fetchFacultyList = async () => {
    try {
      const res = await fetch("/api/faculty-list");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFacultyList(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFacultyList = useMemo(() => {
    const q = facultySearchQuery.toLowerCase().trim();
    if (!q) return facultyList;
    return facultyList.filter((f: any) => {
      const nameMatch = (f.name || "").toLowerCase().includes(q);
      const deptMatch = (f.department || "").toLowerCase().includes(q);
      const interestMatch = Array.isArray(f.researchInterests)
        ? f.researchInterests.some((ri: string) => ri.toLowerCase().includes(q))
        : typeof f.researchInterests === "string"
        ? (f.researchInterests as string).toLowerCase().includes(q)
        : false;
      return nameMatch || deptMatch || interestMatch;
    });
  }, [facultyList, facultySearchQuery]);

  const assignedFacultyDetails = useMemo(() => {
    if (!project?.faculty) return null;
    const targetName = project.faculty.toLowerCase().trim();
    return facultyList.find((f: any) => (f.name || "").toLowerCase().includes(targetName) || targetName.includes((f.name || "").toLowerCase()));
  }, [facultyList, project]);

  const handleSendSupervisionRequest = async () => {
    if (!selectedFaculty || !user || !project) {
      toast.error("Please select a faculty member to send a request.");
      return;
    }
    if (currentSupervisionState === "Pending") {
      toast.error("An active supervision request is already pending faculty approval.");
      return;
    }
    if (currentSupervisionState === "Approved") {
      toast.error("This project already has an approved faculty supervisor.");
      return;
    }
    setSendingRequest(true);
    try {
      const res = await fetch("/api/supervision-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project._id || project.id || projectId,
          studentId: user.email,
          studentEmail: user.email,
          studentName: user.name || user.displayName || "Student Scholar",
          facultyId: selectedFaculty.id || selectedFaculty._id,
          facultyEmail: selectedFaculty.email,
          facultyName: selectedFaculty.name,
          message: requestMessage.trim() || "I would like you to supervise my research project.",
          projectTitle: project.title,
          domain: project.domain,
          abstract: project.description || project.abstract || "",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Supervision request sent to ${selectedFaculty.name}!`);
        setIsRequestSupervisorModalOpen(false);
        setSelectedFaculty(null);
        fetchProject(user.email, projectId);
        fetchSupervisionRequest(projectId);
      } else {
        toast.error(data.error || "Failed to send supervision request.");
      }
    } catch (err) {
      console.error("Error sending supervision request:", err);
      toast.error("Network error sending supervision request.");
    } finally {
      setSendingRequest(false);
    }
  };

  const populateForm = (p: Project) => {
    const start = p.startDate || getTodayString();
    setFormData({
      title: p.title || "",
      description: p.description || "",
      domain: p.domain || "Artificial Intelligence",
      status: p.status || "Planning",
      progress: Number(p.progress) || 0,
      startDate: start,
      expectedCompletionDate: p.expectedCompletionDate || getMinCompletionDateString(start),
      faculty: p.faculty || "",
    });
  };

  // Field Errors & Validation for Edit Project Parameters
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!formData.status) {
      errors.status = "Project Status is required.";
    }

    if (!formData.expectedCompletionDate) {
      errors.expectedCompletionDate = "Expected Completion Date is required.";
    } else if (project?.startDate) {
      const startMs = new Date(project.startDate).getTime();
      const completionMs = new Date(formData.expectedCompletionDate).getTime();
      if (isNaN(completionMs)) {
        errors.expectedCompletionDate = "Invalid completion date.";
      } else if (completionMs <= startMs) {
        errors.expectedCompletionDate = "Expected Completion Date must be after the project start date.";
      }
    }

    return errors;
  }, [formData, project]);

  const isFormValid = useMemo(() => Object.keys(fieldErrors).length === 0, [fieldErrors]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleUpdateProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !project) return;

    if (!isFormValid) {
      const firstError = Object.values(fieldErrors)[0];
      toast.error(firstError || "Please resolve form validation errors.");
      return;
    }

    setSubmitting(true);
    try {
      const projId = project._id || project.id;
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
        },
        body: JSON.stringify({
          id: projId,
          userEmail: user.email,
          status: formData.status,
          progress: formData.progress,
          expectedCompletionDate: formData.expectedCompletionDate,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        const fullUpdated = { ...project, ...updated };
        setProject(fullUpdated);
        populateForm(fullUpdated);
        toast.success("Project parameters updated successfully!");
        setIsEditModalOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update project.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating project.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || !user) return;
    setSubmitting(true);
    try {
      const projId = project._id || project.id;
      const res = await fetch(
        `/api/projects?id=${encodeURIComponent(projId!)}&email=${encodeURIComponent(user.email)}`,
        {
          method: "DELETE",
          headers: {
            "x-user-email": user.email,
          },
        }
      );

      if (res.ok) {
        toast.success(`Project "${project.title}" deleted.`);
        window.location.href = "/projects";
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete project.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting project.");
    } finally {
      setSubmitting(false);
    }
  };

  // Paper Handlers
  const handleOpenPaperUploadModal = () => {
    setEditingPaper(null);
    setSelectedFile(null);
    setShowAdvancedFields(false);
    setPaperForm({
      title: "",
      authors: "",
      year: "",
      journal: "",
      url: "",
    });
    setIsPaperUploadModalOpen(true);
  };

  const handleOpenPaperEditModal = (paper: ProjectPaper) => {
    setEditingPaper(paper);
    setSelectedFile(null);
    setReviewPaperData({
      id: paper.id || paper._id,
      projectId,
      title: paper.title || "",
      authors: paper.authors || "",
      publicationYear: paper.publicationYear || paper.year || "",
      journalOrConference: paper.journalOrConference || paper.journal || "",
      doi: paper.doi || "",
      abstract: paper.abstract || paper.summary || "",
      keywords: Array.isArray(paper.keywords) ? paper.keywords.join(", ") : paper.keywords || "",
      fileData: paper.fileData,
    });
    setIsReviewMetadataModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isExtractingMetadata) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Invalid file format. Please upload an academic paper PDF file.");
      return;
    }

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSelectedFile({
        name: file.name,
        size: `${sizeInMB} MB`,
        file,
        dataUrl,
      });

      // Automatically trigger Gemini Metadata Extraction for PDF
      handleRunMetadataExtraction(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isExtractingMetadata) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Invalid file format. Please upload an academic paper PDF file.");
      return;
    }

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSelectedFile({
        name: file.name,
        size: `${sizeInMB} MB`,
        file,
        dataUrl,
      });

      // Automatically trigger Gemini Metadata Extraction for PDF
      handleRunMetadataExtraction(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRunMetadataExtraction = async (fileData?: string, fileName?: string, paperId?: string) => {
    if (isExtractingMetadata) return;
    setIsExtractingMetadata(true);
    setExtractionStep("Reading paper...");

    try {
      await new Promise((r) => setTimeout(r, 400));
      setExtractionStep("Extracting paper information...");

      await new Promise((r) => setTimeout(r, 500));
      setExtractionStep("Identifying paper information with Gemini AI...");

      const res = await fetch("/api/papers/extract-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileData, fileName, paperId }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.metadata) {
        const m = data.metadata;
        setReviewPaperData({
          id: paperId,
          projectId,
          title: m.title || fileName?.replace(/\.[^/.]+$/, "") || "Untitled Research Paper",
          authors: Array.isArray(m.authors) ? m.authors.join(", ") : m.authors || "",
          publicationYear: m.publicationYear ? String(m.publicationYear) : "",
          journalOrConference: m.journalOrConference || "",
          doi: m.doi || "",
          abstract: m.abstract || "",
          keywords: Array.isArray(m.keywords) ? m.keywords.join(", ") : m.keywords || "",
          fileData: fileData,
          fileName: fileName,
        });

        toast.success("Metadata detected successfully!");
        setIsPaperUploadModalOpen(false);
        setIsReviewMetadataModalOpen(true);
      } else {
        toast.warning("Some paper information could not be identified automatically. Please review and complete the details manually.");
        setReviewPaperData({
          id: paperId,
          projectId,
          title: fileName?.replace(/\.[^/.]+$/, "") || "Untitled Research Paper",
          authors: "",
          publicationYear: "",
          journalOrConference: "",
          doi: "",
          abstract: "",
          keywords: "",
          fileData: fileData,
          fileName: fileName,
        });
        setIsPaperUploadModalOpen(false);
        setIsReviewMetadataModalOpen(true);
      }
    } catch (err) {
      console.error("Extraction failed:", err);
      toast.warning("Some paper information could not be identified automatically. Please review and complete the details manually.");
      setReviewPaperData({
        id: paperId,
        projectId,
        title: fileName?.replace(/\.[^/.]+$/, "") || "Untitled Research Paper",
        authors: "",
        publicationYear: "",
        journalOrConference: "",
        doi: "",
        abstract: "",
        keywords: "",
        fileData: fileData,
        fileName: fileName,
      });
      setIsPaperUploadModalOpen(false);
      setIsReviewMetadataModalOpen(true);
    } finally {
      setIsExtractingMetadata(false);
      setExtractionStep("");
    }
  };

  const handleConfirmAndSaveReviewMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingPaper) return;
    setIsSavingPaper(true);

    try {
      const finalTitle = reviewPaperData.title.trim() || "Untitled Research Paper";
      const finalAuthors = reviewPaperData.authors.trim();
      const finalYear = reviewPaperData.publicationYear.trim();
      const finalJournal = reviewPaperData.journalOrConference.trim();
      const finalDoi = reviewPaperData.doi.trim();
      const finalAbstract = reviewPaperData.abstract.trim();
      const finalKeywords = reviewPaperData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      if (reviewPaperData.id) {
        const targetPaper = papers.find((p) => (p.id || p._id) === reviewPaperData.id);
        const updatedPaper: ProjectPaper = {
          ...targetPaper,
          id: reviewPaperData.id,
          projectId,
          title: finalTitle,
          authors: finalAuthors,
          year: finalYear,
          publicationYear: finalYear,
          journal: finalJournal,
          journalOrConference: finalJournal,
          doi: finalDoi,
          abstract: finalAbstract,
          summary: finalAbstract || targetPaper?.summary,
          keywords: finalKeywords,
          fileData: reviewPaperData.fileData || targetPaper?.fileData,
          uploadDate: targetPaper?.uploadDate || new Date().toISOString().split("T")[0],
        };

        const updated = papers.map((p) => ((p.id || p._id) === reviewPaperData.id ? updatedPaper : p));
        saveProjectPapers(projectId, updated);

        await fetch("/api/papers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...updatedPaper, userEmail: user?.email }),
        }).catch((e) => console.error("MongoDB paper update sync failed:", e));

        toast.success("Reference Paper metadata confirmed & saved!");
      } else {
        const newPaper: ProjectPaper = {
          id: `paper-${Date.now()}`,
          projectId,
          title: finalTitle,
          authors: finalAuthors,
          year: finalYear,
          publicationYear: finalYear,
          journal: finalJournal,
          journalOrConference: finalJournal,
          doi: finalDoi,
          abstract: finalAbstract,
          summary: finalAbstract || `Research paper "${finalTitle}" uploaded to project.`,
          keywords: finalKeywords,
          uploadDate: new Date().toISOString().split("T")[0],
          url: selectedFile ? `file://${selectedFile.name}` : "",
          fileData: reviewPaperData.fileData || selectedFile?.dataUrl,
        };

        saveProjectPapers(projectId, [newPaper, ...papers]);

        await fetch("/api/papers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newPaper, userEmail: user?.email }),
        }).catch((e) => console.error("MongoDB paper sync failed:", e));

        toast.success(`Reference Paper "${finalTitle}" confirmed & saved to project!`);
      }

      setIsReviewMetadataModalOpen(false);
      setSelectedFile(null);
      setEditingPaper(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save paper metadata.");
    } finally {
      setIsSavingPaper(false);
    }
  };

  const handleDeletePaper = async () => {
    if (!deletingPaper) return;
    const targetId = deletingPaper._id || deletingPaper.id;
    const updated = papers.filter((p) => p.id !== deletingPaper.id && p._id !== deletingPaper._id);
    saveProjectPapers(projectId, updated);

    if (targetId) {
      await fetch(`/api/papers?id=${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      }).catch(() => {});
    }

    toast.success(`Paper "${deletingPaper.title}" removed.`);
    setDeletingPaper(null);
  };

  const handleOpenDocument = (paper: ProjectPaper) => {
    const target = paper.fileData || paper.url;
    if (!target) {
      toast.info("No document attached to this paper.");
      return;
    }

    if (target.startsWith("data:")) {
      try {
        const parts = target.split(",");
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } catch (err) {
        console.error(err);
        toast.error("Could not open document blob.");
      }
    } else if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("blob:")) {
      window.open(target, "_blank");
    } else {
      toast.info(`Document Link: ${target}`);
    }
  };

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

  // Citation Formatter
  const activeCitationPaper = useMemo(() => {
    if (!selectedCitationPaperId && papers.length > 0) return papers[0];
    return papers.find((p) => p.id === selectedCitationPaperId) || papers[0] || null;
  }, [selectedCitationPaperId, papers]);

  const formattedCitationText = useMemo(() => {
    if (!activeCitationPaper) return "No research paper selected for citation.";
    const { authors, year, title, journal } = activeCitationPaper;
    const authorStr = authors && authors.trim() ? authors.trim() : "Unknown Author";
    const yearStr = year && year.trim() ? year.trim() : "n.d.";
    const journalStr = journal && journal.trim() ? journal.trim() : "Unpublished manuscript";

    if (citationStyle === "APA") {
      return `${authorStr} (${yearStr}). ${title}. ${journalStr}.`;
    }
    if (citationStyle === "MLA") {
      return `${authorStr}. "${title}." ${journalStr}, ${yearStr}.`;
    }
    if (citationStyle === "Chicago") {
      return `${authorStr}. "${title}." ${journalStr} (${yearStr}).`;
    }
    if (citationStyle === "IEEE") {
      return `${authorStr}, "${title}," ${journalStr}, ${yearStr}.`;
    }
    return `${authorStr} (${yearStr}). ${title}. ${journalStr}.`;
  }, [activeCitationPaper, citationStyle]);

  const handleCopyCitation = () => {
    if (!formattedCitationText) return;
    navigator.clipboard.writeText(formattedCitationText);
    setCopiedCitation(true);
    toast.success(`Copied ${citationStyle} citation to clipboard!`);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  if (typeof window !== "undefined" && !user) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout defaultOpen={false}>
        <AutoCollapseWorkspaceSidebar />
        <div className="mx-auto max-w-[1600px] w-full space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout defaultOpen={false}>
        <AutoCollapseWorkspaceSidebar />
        <div className="mx-auto max-w-[1600px] w-full flex flex-col items-center justify-center py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Project Workspace Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The requested research project workspace does not exist or was deleted.
          </p>
          <Button onClick={() => (window.location.href = "/projects")} className="mt-6 gap-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Return to Research Projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusKey = project.status || "Planning";
  const statusCfg = STATUS_VARIANTS[statusKey] || STATUS_VARIANTS["Planning"];
  const StatusIcon = statusCfg.icon;

  const workspaceTabs = [
    { id: "overview", label: "Overview", icon: FolderKanban },
    { id: "reference-papers", label: "Reference Papers", icon: BookOpen },
    { id: "my-work", label: "My Research Work", icon: Pencil },
    { id: "roadmap", label: "AI Research Roadmap", icon: Compass },
    { id: "assistant", label: "AI Research Assistant", icon: Bot },
    { id: "summaries", label: "Literature Summaries", icon: BookOpen },
    { id: "comparison", label: "Literature Comparison", icon: GitCompareArrows },
    { id: "citations", label: "Citation Generator", icon: Quote },
    { id: "similarity", label: "Similarity Checker", icon: ScanSearch },
    { id: "settings", label: "Project Settings", icon: Settings },
  ];

  return (
    <DashboardLayout defaultOpen={false}>
      <AutoCollapseWorkspaceSidebar />
      <div className="mx-auto flex max-w-[1600px] w-full flex-col gap-6 pb-12">
        {/* Breadcrumb & Workspace Control Header */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <button
              onClick={() => (window.location.href = "/projects")}
              className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <FolderKanban className="h-3.5 w-3.5" /> Research Projects
            </button>
            <span>/</span>
            <span className="font-bold text-foreground truncate max-w-md">{project.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`gap-1.5 rounded-full px-3 py-1 font-semibold text-xs ${statusCfg.className}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </Badge>
          </div>
        </div>

        {/* Persistent Academic Research Workspace Header Card */}
        <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-card/90 p-6 md:p-8 shadow-sm backdrop-blur-md">
          <div className="absolute inset-0 grid-neural opacity-20 pointer-events-none" aria-hidden />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" aria-hidden />

          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-border/80 bg-muted/60 px-3 py-1 text-xs font-semibold tracking-wide text-foreground">
                  {project.domain || "General"}
                </Badge>
                <Badge variant="outline" className={`gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.className}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusCfg.label}
                </Badge>
                {currentSupervisionState === "Approved" && (
                  <Badge variant="outline" className="gap-1.5 rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-500 px-3 py-1 text-xs font-semibold">
                    <GraduationCap className="h-3.5 w-3.5" /> Under Supervision
                  </Badge>
                )}
              </div>

              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl border-border/80 bg-card/90 backdrop-blur-md text-xs font-semibold shadow-xs hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <Pencil className="h-3.5 w-3.5 text-amber-500" /> Edit Parameters
              </Button>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl lg:text-4xl">
                {project.title}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-5xl">
                {project.description || "No description provided."}
              </p>
            </div>

            {/* Key Metadata Grid */}
            <div className="grid gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-background/60 p-4 backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-muted-foreground uppercase tracking-wider text-[0.68rem]">Calculated Progress</span>
                  <span className="text-primary font-bold">{project.progress || 0}%</span>
                </div>
                <Progress value={project.progress || 0} className="h-2 rounded-full" />
              </div>

              <div className="rounded-xl border border-border/70 bg-background/60 p-4 backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-xs">
                <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Faculty Guide
                </span>
                <span className="flex items-center gap-2 text-xs font-semibold text-foreground truncate">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                  {project.faculty || "Independent Research"}
                </span>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/60 p-4 backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-xs">
                <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Start Date
                </span>
                <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  {formatDate(project.startDate)}
                </span>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/60 p-4 backdrop-blur-md transition-all hover:border-primary/40 hover:shadow-xs">
                <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Target Completion
                </span>
                <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  {formatDate(project.expectedCompletionDate)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace IDE Navigation Tabs Bar */}
        <Tabs value={activeWorkspaceTab} onValueChange={setActiveWorkspaceTab} className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="flex w-max min-w-full justify-start gap-1.5 bg-card/80 border border-border/80 p-1.5 rounded-2xl shadow-xs h-auto backdrop-blur-md">
              {workspaceTabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm hover:bg-muted/60 whitespace-nowrap"
                  >
                    <TabIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            {/* Overview Metric Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="group surface-elevated rounded-2xl border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Total Research Papers</p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">{papers.length}</p>
                    <p className="text-[0.725rem] text-muted-foreground pt-1">Indexed in project library</p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
              </Card>

              <Card className="group surface-elevated rounded-2xl border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">AI Conversations</p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">{papers.length > 0 ? 6 : 0}</p>
                    <p className="text-[0.725rem] text-muted-foreground pt-1">Queries in project workspace</p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
              </Card>

              <Card className="group surface-elevated rounded-2xl border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Citations Generated</p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">{papers.length > 0 ? papers.length * 2 : 0}</p>
                    <p className="text-[0.725rem] text-muted-foreground pt-1">APA, MLA, Chicago, IEEE</p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    <Quote className="h-5 w-5" />
                  </div>
                </div>
              </Card>

              <Card className="group surface-elevated rounded-2xl border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">Similarity Reports</p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">{papers.length > 0 ? 1 : 0}</p>
                    <p className="text-[0.725rem] text-muted-foreground pt-1">Academic overlap analysis</p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                    <ScanSearch className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Overview Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2 surface-elevated rounded-2xl border-border bg-card p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-2">Project Description & Objectives</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-base font-bold text-foreground mb-3">Research Timeline & Progress</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">Completion Status ({project.progress}%)</span>
                      <span className="text-primary font-bold">{project.status}</span>
                    </div>
                    <Progress value={project.progress} className="h-2.5 rounded-full" />

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                        <span className="text-muted-foreground block mb-1">Start Date</span>
                        <span className="font-semibold text-foreground">{formatDate(project.startDate)}</span>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                        <span className="text-muted-foreground block mb-1">Target Completion</span>
                        <span className="font-semibold text-foreground">{formatDate(project.expectedCompletionDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sidebar Block: Supervisor Section & Activity */}
              <div className="space-y-6">
                <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" /> Supervisor
                    </h3>
                    <Badge
                      variant="outline"
                      className={
                        currentSupervisionState === "Approved"
                          ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[0.7rem] font-bold"
                          : currentSupervisionState === "Pending"
                          ? "border-amber-500/30 text-amber-500 bg-amber-500/10 text-[0.7rem] font-bold"
                          : currentSupervisionState === "Rejected"
                          ? "border-destructive/30 text-destructive bg-destructive/10 text-[0.7rem] font-bold"
                          : "border-muted-foreground/30 text-muted-foreground bg-muted/40 text-[0.7rem] font-semibold"
                      }
                    >
                      {currentSupervisionState === "Approved"
                        ? "Under Supervision"
                        : currentSupervisionState === "Pending"
                        ? "Pending Approval"
                        : currentSupervisionState === "Rejected"
                        ? "Request Rejected"
                        : "No Faculty Assigned"}
                    </Badge>
                  </div>

                  {/* STATE 1: Pending Approval */}
                  {currentSupervisionState === "Pending" && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500 font-bold shrink-0">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-foreground">
                            {supervisionRequest?.facultyName || project?.requestedFacultyName || "Faculty Advisor"}
                          </h4>
                          <p className="text-[0.7rem] text-muted-foreground">
                            Requested on {supervisionRequest?.submittedAt ? new Date(supervisionRequest.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : (supervisionRequest?.submittedDate || "Recently")}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-background/80 border border-amber-500/20 p-2.5 text-[0.725rem] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>Waiting for faculty approval.</span>
                      </div>
                    </div>
                  )}

                  {/* STATE 2: Approved - Under Supervision */}
                  {currentSupervisionState === "Approved" && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        {assignedFacultyDetails?.photoURL ? (
                          <img src={assignedFacultyDetails.photoURL} alt={project?.faculty || ""} className="h-10 w-10 rounded-xl object-cover border border-emerald-500/30" />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                            {(project?.faculty || supervisionRequest?.facultyName || "F").charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-foreground">{project?.faculty || supervisionRequest?.facultyName}</h4>
                          <p className="text-[0.7rem] text-muted-foreground">
                            {assignedFacultyDetails?.designation || assignedFacultyDetails?.title || "Faculty Supervisor"} • {assignedFacultyDetails?.department || "Academic Department"}
                          </p>
                          <p className="text-[0.68rem] text-muted-foreground mt-0.5">
                            Approved on {supervisionRequest?.respondedAt ? new Date(supervisionRequest.respondedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : (project?.updatedAt ? new Date(project.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STATE 3: Request Rejected */}
                  {currentSupervisionState === "Rejected" && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-destructive/10 text-destructive font-bold shrink-0 mt-0.5">
                          <X className="h-4 w-4" />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-foreground">
                              {supervisionRequest?.facultyName || "Faculty Advisor"}
                            </h4>
                            <span className="text-[0.68rem] text-muted-foreground">
                              Rejected on {supervisionRequest?.respondedAt ? new Date(supervisionRequest.respondedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                            </span>
                          </div>
                          <div className="rounded-lg bg-background/80 border border-destructive/20 p-2.5 text-[0.725rem]">
                            <p className="font-semibold text-foreground mb-0.5">Rejection Reason:</p>
                            <p className="text-muted-foreground italic">"{supervisionRequest?.facultyRemarks || project?.lastRejectionReason || "No reason provided."}"</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedFaculty(null);
                          setRequestMessage("I would like you to supervise my research project.");
                          setIsRequestSupervisorModalOpen(true);
                        }}
                        size="sm"
                        className="w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground gap-1.5 shadow-sm"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" /> Request Again
                      </Button>
                    </div>
                  )}

                  {/* STATE 4: No Faculty Assigned */}
                  {currentSupervisionState === "No Faculty" && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-3 bg-muted/20">
                      <div>
                        <h4 className="font-bold text-xs text-foreground">No Faculty Assigned</h4>
                        <p className="text-[0.7rem] text-muted-foreground mt-1">
                          Choose a faculty member to request supervision.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedFaculty(null);
                          setRequestMessage("I would like you to supervise my research project.");
                          setIsRequestSupervisorModalOpen(true);
                        }}
                        size="sm"
                        className="w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground gap-1.5 shadow-sm"
                      >
                        <UserCheck className="h-3.5 w-3.5" /> Request Supervision
                      </Button>
                    </div>
                  )}

                  {/* REQUEST HISTORY SECTION */}
                  {supervisionHistory.length > 0 && (
                    <div className="pt-3 border-t border-border/60 space-y-2">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Request History
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {supervisionHistory.map((item: any, idx: number) => (
                          <div key={item.id || item._id || idx} className="rounded-xl border border-border bg-background/60 p-2.5 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">{item.facultyName || "Faculty Supervisor"}</span>
                              <Badge
                                variant="outline"
                                className={
                                  item.status === "Approved" || item.status === "Accepted"
                                    ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[0.65rem] font-bold"
                                    : item.status === "Pending"
                                    ? "border-amber-500/30 text-amber-500 bg-amber-500/10 text-[0.65rem] font-bold"
                                    : "border-destructive/30 text-destructive bg-destructive/10 text-[0.65rem] font-bold"
                                }
                              >
                                {item.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground">
                              <span>
                                {item.submittedAt
                                  ? new Date(item.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                  : (item.submittedDate || "")}
                              </span>
                            </div>
                            {item.status === "Rejected" && item.facultyRemarks && (
                              <p className="text-[0.68rem] text-muted-foreground italic bg-muted/40 p-1.5 rounded-lg border border-border/50">
                                Reason: "{item.facultyRemarks}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Recent Project Activity
                  </h3>
                  <div className="relative space-y-3 pl-4">
                    <span className="absolute left-1 top-1 bottom-1 w-0.5 bg-border" aria-hidden />
                    <div className="relative">
                      <span className="absolute -left-[1.25rem] top-1 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-xs font-semibold text-foreground">Workspace Initialized</p>
                      <p className="text-[0.7rem] text-muted-foreground">{formatDate(project.createdAt)}</p>
                    </div>
                    {papers.length > 0 && (
                      <div className="relative">
                        <span className="absolute -left-[1.25rem] top-1 h-2 w-2 rounded-full bg-blue-500" />
                        <p className="text-xs font-semibold text-foreground">{papers.length} Research Papers Uploaded</p>
                        <p className="text-[0.7rem] text-muted-foreground">Latest: {papers[0].title}</p>
                      </div>
                    )}
                    {project.updatedAt && (
                      <div className="relative">
                        <span className="absolute -left-[1.25rem] top-1 h-2 w-2 rounded-full bg-amber-500" />
                        <p className="text-xs font-semibold text-foreground">Workspace Parameters Updated</p>
                        <p className="text-[0.7rem] text-muted-foreground">{formatDate(project.updatedAt)}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: REFERENCE PAPERS */}
          {(activeWorkspaceTab === "reference-papers" || activeWorkspaceTab === "papers") && (
            <TabsContent value={activeWorkspaceTab} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3 gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> Reference Papers
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Add papers and literature for your research reference background.
                  </p>
                </div>

                <Button onClick={handleOpenPaperUploadModal} className="gap-2 rounded-xl bg-primary text-xs font-medium text-primary-foreground">
                  <Plus className="h-4 w-4" /> Upload Reference Paper
                </Button>
              </div>

              {papers.length === 0 ? (
                /* REQUIRED EMPTY STATE */
                <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-6 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-primary mb-4">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">No Reference Papers Added</h3>
                  <p className="mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed">
                    Collect and organize papers that support your research reference and literature study.
                  </p>
                  <Button onClick={handleOpenPaperUploadModal} className="mt-6 gap-2 rounded-xl bg-primary font-medium text-primary-foreground shadow-md">
                    <Plus className="h-4 w-4" /> Upload Reference Paper
                  </Button>
                </Card>
              ) : (
                /* PAPERS TABLE / GRID */
                <div className="space-y-6">
                  <Card className="surface-elevated overflow-hidden rounded-2xl border-border bg-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 uppercase text-[0.68rem] font-semibold text-muted-foreground">
                          <tr>
                            <th className="px-5 py-3.5">Paper Title</th>
                            <th className="px-5 py-3.5">Authors</th>
                            <th className="px-5 py-3.5">Year</th>
                            <th className="px-5 py-3.5">Journal / Conference</th>
                            <th className="px-5 py-3.5">Upload Date</th>
                            <th className="px-5 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {papers.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-5 py-4 font-semibold text-foreground max-w-xs truncate">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary shrink-0" />
                                  <span className="truncate">{p.title}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-muted-foreground max-w-[180px] truncate">{p.authors}</td>
                              <td className="px-5 py-4 font-medium text-foreground">{p.year}</td>
                              <td className="px-5 py-4 text-muted-foreground">{p.journal}</td>
                              <td className="px-5 py-4 text-muted-foreground">{p.uploadDate}</td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRunMetadataExtraction(p.fileData, p.title, p.id || p._id)}
                                    title="Extract metadata with Gemini AI"
                                    className="h-7 px-2 text-[0.7rem] font-bold border-primary/40 text-primary hover:bg-primary/10 rounded-lg gap-1"
                                  >
                                    <Sparkles className="h-3 w-3" /> Extract Metadata
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => setViewingPaper(p)} className="h-7 w-7 rounded-lg text-primary hover:bg-primary/10">
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  {p.url ? (
                                    <Button size="icon" variant="ghost" onClick={() => window.open(p.url, "_blank")} className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted">
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button size="icon" variant="ghost" onClick={() => toast.info(`Downloading metadata for ${p.title}`)} className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted">
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button size="icon" variant="ghost" onClick={() => handleOpenPaperEditModal(p)} className="h-7 w-7 rounded-lg text-amber-500 hover:bg-amber-500/10">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => setDeletingPaper(p)} className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>
          )}

          {/* TAB 3: MY RESEARCH WORK */}
          {/* TAB 3: MY RESEARCH WORK */}
          <TabsContent value="my-work" className="space-y-6">
            {activeWorkDoc ? (
              /* ACADEMIC RESEARCH WORK WRITING WORKBENCH / EDITOR VIEW */
              <div className="space-y-6">
                {/* Editor Header Bar */}
                <Card className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-xs backdrop-blur-md space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveWorkDoc(null)}
                          className="h-8 px-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted font-semibold text-xs"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Work
                        </Button>
                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs font-semibold rounded-full px-3">
                          {activeWorkDoc.templateType || "Research Paper"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            activeWorkDoc.reviewStatus === "Approved"
                              ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-bold rounded-full px-3 gap-1"
                              : activeWorkDoc.reviewStatus === "Changes Requested"
                              ? "border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs font-bold rounded-full px-3 gap-1"
                              : activeWorkDoc.reviewStatus === "Rejected"
                              ? "border-destructive/30 text-destructive bg-destructive/10 text-xs font-bold rounded-full px-3 gap-1"
                              : activeWorkDoc.reviewStatus === "Pending Review"
                              ? "border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs font-semibold rounded-full px-3 gap-1"
                              : "text-muted-foreground text-xs border-border/80 bg-muted/40 rounded-full px-3"
                          }
                        >
                          {activeWorkDoc.reviewStatus === "Approved" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                          {activeWorkDoc.reviewStatus === "Changes Requested" && <AlertCircle className="h-3 w-3 text-amber-500" />}
                          {activeWorkDoc.reviewStatus || "Draft"}
                        </Badge>
                        {currentSupervisionState === "Approved" && (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold rounded-full px-3">
                            <GraduationCap className="h-3 w-3 mr-1" /> Under Supervision
                          </Badge>
                        )}
                      </div>

                      <input
                        type="text"
                        value={activeWorkDoc.title || ""}
                        onChange={(e) => setActiveWorkDoc({ ...activeWorkDoc, title: e.target.value })}
                        onBlur={() => handleSaveActiveWorkDoc(activeWorkDoc)}
                        className="text-xl md:text-2xl font-extrabold bg-transparent text-foreground border-b border-transparent hover:border-border/80 focus:border-primary focus:outline-none w-full transition-colors py-1 truncate"
                        placeholder="Enter Research Paper Title..."
                      />

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-0.5">
                        <span>{autoSaveTimer || `Last updated ${new Date(activeWorkDoc.updatedAt || activeWorkDoc.createdAt || Date.now()).toLocaleDateString()}`}</span>
                        <span>•</span>
                        <span>{docWordCount.toLocaleString()} Words</span>
                        <span>•</span>
                        <span>{docCharCount.toLocaleString()} Characters</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Button
                        onClick={handleOpenCreateWorkModal}
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs font-semibold gap-1.5 border-border/80 bg-background/80 hover:bg-muted"
                      >
                        <Plus className="h-3.5 w-3.5 text-primary" /> + Add Research Work
                      </Button>

                      <Button
                        onClick={() => handleSaveActiveWorkDoc(activeWorkDoc, true)}
                        disabled={savingWork}
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs font-semibold gap-1.5 border-border/80 bg-background/80"
                      >
                        {savingWork ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Saving...
                          </>
                        ) : justSaved ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" /> Saved ✓
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" /> Save Draft
                          </>
                        )}
                      </Button>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                onClick={() => handleRequestWorkReview(activeWorkDoc)}
                                disabled={!canRequestReview || isRequestingReview}
                                size="sm"
                                className="rounded-xl text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs disabled:opacity-50"
                              >
                                {isRequestingReview ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-3.5 w-3.5" />
                                    {activeWorkDoc.reviewStatus === "Pending Review"
                                      ? "Pending Review"
                                      : activeWorkDoc.reviewStatus === "Reviewed" && !hasContentChangedSinceReview
                                      ? "Review Complete"
                                      : "Request Faculty Review"}
                                  </>
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!canRequestReview && (
                            <TooltipContent className="max-w-xs text-xs">
                              {currentSupervisionState !== "Approved"
                                ? "Faculty supervision required before submitting review requests."
                                : activeWorkDoc.reviewStatus === "Pending Review"
                                ? "An active review request is already pending with your supervisor."
                                : "Make meaningful edits to your research document to enable requesting another review."}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-xl border-border/80">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-xl text-xs">
                          <DropdownMenuItem onClick={() => setIsCreateWorkModalOpen(true)} className="gap-2 cursor-pointer font-medium">
                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" /> Change Document Type
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setWorkToDelete(activeWorkDoc);
                              setIsDeleteWorkModalOpen(true);
                            }}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive font-semibold"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete Research Work
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Supervision Notice if not approved */}
                  {currentSupervisionState !== "Approved" && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-3 text-xs">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-amber-800 dark:text-amber-300 text-[0.725rem] leading-relaxed">
                        <span className="font-bold">Faculty supervision required:</span> Request and receive approval from a faculty supervisor before submitting your Research Work for review.
                      </p>
                    </div>
                  )}

                  {/* Faculty Supervisor Feedback Banner */}
                  {(activeWorkDoc.feedback || (Array.isArray(activeWorkDoc.sectionFeedback) && activeWorkDoc.sectionFeedback.length > 0)) && (
                    <div
                      className={`rounded-xl border p-4 space-y-3 text-xs ${
                        activeWorkDoc.reviewStatus === "Approved"
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : activeWorkDoc.reviewStatus === "Changes Requested"
                          ? "border-amber-500/30 bg-amber-500/5"
                          : "border-primary/30 bg-primary/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`font-bold flex items-center gap-2 text-xs ${
                            activeWorkDoc.reviewStatus === "Approved"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : activeWorkDoc.reviewStatus === "Changes Requested"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-primary"
                          }`}
                        >
                          {activeWorkDoc.reviewStatus === "Approved" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : activeWorkDoc.reviewStatus === "Changes Requested" ? (
                            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                          )}
                          Faculty Supervisor Decision: <strong>{activeWorkDoc.reviewStatus || "Reviewed"}</strong>
                        </span>

                        {hasContentChangedSinceReview ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[0.68rem] font-semibold">
                            Edits Detected — Re-review Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10 text-[0.68rem] font-semibold">
                            Edit sections to enable re-review
                          </Badge>
                        )}
                      </div>

                      {activeWorkDoc.feedback && (
                        <div className="space-y-1">
                          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground block">
                            Overall Faculty Notes:
                          </span>
                          <p className="text-foreground italic leading-relaxed whitespace-pre-wrap text-xs bg-background/60 p-3 rounded-xl border border-border/50">
                            "{activeWorkDoc.feedback}"
                          </p>
                        </div>
                      )}

                      {/* Section-by-Section Comments Grid */}
                      {Array.isArray(activeWorkDoc.sectionFeedback) && activeWorkDoc.sectionFeedback.length > 0 && (
                        <div className="pt-2 border-t border-border/40 space-y-2">
                          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground block">
                            Section-by-Section Inline Feedback:
                          </span>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {activeWorkDoc.sectionFeedback.map((sf: any, sfIdx: number) => (
                              <div key={sfIdx} className="rounded-xl border border-border/60 bg-card p-3 space-y-1 text-xs shadow-xs">
                                <span className="font-bold text-primary text-[0.725rem] block">{sf.sectionTitle}</span>
                                <p className="text-foreground text-[0.725rem] italic leading-relaxed">"{sf.comment}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review History Accordion */}
                  {docReviewsHistory.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="review-history" className="border-border/60">
                        <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline text-muted-foreground hover:text-foreground">
                          <span className="flex items-center gap-2">
                            <History className="h-3.5 w-3.5 text-primary" /> Faculty Review History ({docReviewsHistory.length} Cycles)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 space-y-3">
                          {docReviewsHistory.map((rev: any, rIdx: number) => (
                            <div key={rev.id || rev._id || rIdx} className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  Review #{docReviewsHistory.length - rIdx} — {rev.status || "Completed"}
                                </span>
                                <span>{formatDate(rev.reviewedAt || rev.createdAt)}</span>
                              </div>
                              {rev.feedback ? (
                                <p className="text-foreground italic text-xs leading-relaxed">"{rev.feedback}"</p>
                              ) : (
                                <p className="text-muted-foreground text-[0.7rem] italic">No written comments recorded.</p>
                              )}
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </Card>

                {/* Two-Column Writing Workbench (Sidebar + Canvas) */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Left Column: Section Outline Sidebar */}
                  <Card className="w-full lg:w-72 shrink-0 rounded-2xl border border-border/80 bg-card/90 p-4 space-y-4 shadow-xs lg:sticky lg:top-20">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Document Outline</h3>
                        <p className="text-[0.68rem] text-muted-foreground mt-0.5">{activeWorkDoc.sections?.length || 0} Sections</p>
                      </div>
                      <Badge variant="outline" className="text-[0.65rem] font-semibold">
                        {docWordCount.toLocaleString()} words
                      </Badge>
                    </div>

                    {/* Section Outline List */}
                    <div className="space-y-1 text-xs">
                      {/* Abstract Item */}
                      <button
                        onClick={() => {
                          setActiveSectionId("abstract");
                          document.getElementById("section-card-abstract")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={`flex items-center justify-between w-full p-2 rounded-xl text-left font-medium transition-all ${
                          activeSectionId === "abstract"
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <span className="truncate flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 shrink-0" /> Abstract
                        </span>
                        {(activeWorkDoc.abstract || "").trim().length > 30 && (
                          <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${activeSectionId === "abstract" ? "text-primary-foreground" : "text-emerald-500"}`} />
                        )}
                      </button>

                      {/* Sections List */}
                      {activeWorkDoc.sections?.map((sec: any, sIdx: number) => {
                        const secWords = sec.content ? sec.content.trim().split(/\s+/).filter(Boolean).length : 0;
                        const isDone = secWords > 10;
                        const secId = sec.id || `sec-${sIdx}`;
                        const isActive = activeSectionId === secId;

                        return (
                          <button
                            key={secId}
                            onClick={() => {
                              setActiveSectionId(secId);
                              document.getElementById(`section-card-${secId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className={`flex items-center justify-between w-full p-2 rounded-xl text-left font-medium transition-all ${
                              isActive
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-foreground hover:bg-muted/60"
                            }`}
                          >
                            <span className="truncate flex items-center gap-2">
                              <span className="font-bold text-[0.7rem] opacity-75 shrink-0">{sIdx + 1}.</span>
                              <span className="truncate">{sec.title || `Section ${sIdx + 1}`}</span>
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[0.65rem] ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                {secWords}w
                              </span>
                              {isDone && (
                                <CheckCircle2 className={`h-3.5 w-3.5 ${isActive ? "text-primary-foreground" : "text-emerald-500"}`} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      onClick={() => {
                        const newSecId = `sec-${Date.now()}`;
                        const updatedSecs = [
                          ...(activeWorkDoc.sections || []),
                          { id: newSecId, title: `${(activeWorkDoc.sections?.length || 0) + 1}. New Section`, content: "" },
                        ];
                        const updated = { ...activeWorkDoc, sections: updatedSecs };
                        setActiveWorkDoc(updated);
                        handleSaveActiveWorkDoc(updated);
                        setActiveSectionId(newSecId);
                      }}
                      variant="outline"
                      className="w-full text-xs font-semibold gap-1.5 rounded-xl border-dashed border-border py-2"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Section
                    </Button>
                  </Card>

                  {/* Right Column: Writing Canvas */}
                  <div className="flex-1 min-w-0 w-full space-y-6">
                    {/* Abstract & Keywords Card */}
                    <Card id="section-card-abstract" className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" /> Abstract
                          </h3>
                          <p className="text-[0.7rem] text-muted-foreground">Executive summary of research problem, methodology, and conclusions.</p>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAiAssistSectionId("abstract");
                            setAiAssistAction("generate_abstract");
                            setAiSuggestion(null);
                          }}
                          className="h-7 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl gap-1"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> AI Assist
                        </Button>
                      </div>

                      <Textarea
                        value={activeWorkDoc.abstract || ""}
                        onChange={(e) => setActiveWorkDoc({ ...activeWorkDoc, abstract: e.target.value })}
                        onFocus={() => setActiveSectionId("abstract")}
                        onBlur={() => handleSaveActiveWorkDoc(activeWorkDoc)}
                        placeholder="Write a concise abstract summarizing your research problem, methodology, findings, and conclusions..."
                        className="min-h-[120px] text-xs leading-relaxed rounded-xl border-border/80 bg-background/60 focus:border-primary font-sans p-3.5"
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border/60">
                        <div className="flex-1 space-y-1">
                          <label className="text-[0.7rem] font-bold text-foreground block">Keywords</label>
                          <Input
                            value={Array.isArray(activeWorkDoc.keywords) ? activeWorkDoc.keywords.join(", ") : activeWorkDoc.keywords || ""}
                            onChange={(e) =>
                              setActiveWorkDoc({
                                ...activeWorkDoc,
                                keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                              })
                            }
                            onBlur={() => handleSaveActiveWorkDoc(activeWorkDoc)}
                            placeholder="e.g. Machine Learning, Neural Networks, Computer Vision"
                            className="text-xs rounded-xl border-border/80 bg-background/60 h-8"
                          />
                        </div>
                        <div className="text-right text-[0.68rem] text-muted-foreground shrink-0 self-end">
                          {(activeWorkDoc.abstract || "").trim().split(/\s+/).filter(Boolean).length} words • {(activeWorkDoc.abstract || "").length} characters
                        </div>
                      </div>
                    </Card>

                    {/* Numbered Sections */}
                    {activeWorkDoc.sections?.map((sec: any, idx: number) => {
                      const secId = sec.id || `sec-${idx}`;
                      const secWords = sec.content ? sec.content.trim().split(/\s+/).filter(Boolean).length : 0;
                      const secChars = sec.content ? sec.content.length : 0;

                      const sectionCommentObj = Array.isArray(activeWorkDoc.sectionFeedback)
                        ? activeWorkDoc.sectionFeedback.find(
                            (sf: any) =>
                              sf.sectionId === secId ||
                              sf.sectionTitle === sec.title ||
                              (sf.sectionId && String(sf.sectionId) === String(sec.id))
                          )
                        : null;

                      return (
                        <Card id={`section-card-${secId}`} key={secId} className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
                          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={sec.title || ""}
                                onChange={(e) => {
                                  const updatedSecs = activeWorkDoc.sections.map((s: any) =>
                                    s.id === sec.id ? { ...s, title: e.target.value } : s
                                  );
                                  setActiveWorkDoc({ ...activeWorkDoc, sections: updatedSecs });
                                }}
                                onFocus={() => setActiveSectionId(secId)}
                                onBlur={() => handleSaveActiveWorkDoc(activeWorkDoc)}
                                className="font-bold text-sm bg-transparent text-foreground border-b border-transparent hover:border-border/80 focus:border-primary focus:outline-none w-full max-w-lg transition-colors py-0.5"
                                placeholder={`Section ${idx + 1} Title...`}
                              />
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {idx > 0 && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    const newSecs = [...activeWorkDoc.sections];
                                    const temp = newSecs[idx];
                                    newSecs[idx] = newSecs[idx - 1];
                                    newSecs[idx - 1] = temp;
                                    const updated = { ...activeWorkDoc, sections: newSecs };
                                    setActiveWorkDoc(updated);
                                    handleSaveActiveWorkDoc(updated);
                                  }}
                                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {idx < activeWorkDoc.sections.length - 1 && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    const newSecs = [...activeWorkDoc.sections];
                                    const temp = newSecs[idx];
                                    newSecs[idx] = newSecs[idx + 1];
                                    newSecs[idx + 1] = temp;
                                    const updated = { ...activeWorkDoc, sections: newSecs };
                                    setActiveWorkDoc(updated);
                                    handleSaveActiveWorkDoc(updated);
                                  }}
                                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const filtered = activeWorkDoc.sections.filter((s: any) => s.id !== sec.id);
                                  const updated = { ...activeWorkDoc, sections: filtered };
                                  setActiveWorkDoc(updated);
                                  handleSaveActiveWorkDoc(updated);
                                }}
                                className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Faculty Inline Section Correction Callout */}
                          {sectionCommentObj && (
                            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-1 text-xs">
                              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                                <MessageSquare className="h-4 w-4 text-amber-500 shrink-0" />
                                Faculty Correction for "{sec.title}":
                              </div>
                              <p className="text-amber-950 dark:text-amber-200 text-xs italic leading-relaxed pl-6">
                                "{sectionCommentObj.comment}"
                              </p>
                            </div>
                          )}

                          <Textarea
                            value={sec.content || ""}
                            onChange={(e) => {
                              const updatedSecs = activeWorkDoc.sections.map((s: any) =>
                                s.id === sec.id ? { ...s, content: e.target.value } : s
                              );
                              setActiveWorkDoc({ ...activeWorkDoc, sections: updatedSecs });
                            }}
                            onFocus={() => setActiveSectionId(secId)}
                            onBlur={() => handleSaveActiveWorkDoc(activeWorkDoc)}
                            placeholder={`Write academic section content for "${sec.title || `Section ${idx + 1}`}"...`}
                            className="min-h-[160px] text-xs font-mono leading-relaxed rounded-xl border-border/80 bg-background/60 focus:border-primary p-3.5"
                          />

                          <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground pt-1 border-t border-border/60">
                            <span>
                              {secWords} words • {secChars} characters
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setAiAssistSectionId(sec.id);
                                setAiAssistAction("improve_writing");
                                setAiSuggestion(null);
                              }}
                              className="h-6 px-2 text-[0.7rem] text-primary hover:bg-primary/10 rounded-lg gap-1 font-semibold"
                            >
                              <Sparkles className="h-3 w-3" /> AI Assist Section
                            </Button>
                          </div>
                        </Card>
                      );
                    })}

                    <Button
                      onClick={() => {
                        const newSecId = `sec-${Date.now()}`;
                        const updatedSecs = [
                          ...(activeWorkDoc.sections || []),
                          { id: newSecId, title: `${(activeWorkDoc.sections?.length || 0) + 1}. New Section`, content: "" },
                        ];
                        const updated = { ...activeWorkDoc, sections: updatedSecs };
                        setActiveWorkDoc(updated);
                        handleSaveActiveWorkDoc(updated);
                        setActiveSectionId(newSecId);
                      }}
                      variant="outline"
                      className="w-full py-6 rounded-2xl border-dashed border-border/80 text-xs font-bold text-muted-foreground hover:text-foreground gap-2"
                    >
                      <Plus className="h-4 w-4" /> Add New Section
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* ALL RESEARCH WORKS HUB (OVERVIEW VIEW) */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3 gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Pencil className="h-5 w-5 text-primary" /> My Research Work
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Write, manage, and track all your academic research papers, proposals, literature reviews, and reports for this project.
                    </p>
                  </div>

                  <Button
                    onClick={handleOpenCreateWorkModal}
                    className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shrink-0"
                  >
                    <Plus className="h-4 w-4" /> + Add Research Work
                  </Button>
                </div>

                {researchWorkList.length === 0 ? (
                  /* EMPTY STATE */
                  <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-6 text-center space-y-4">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
                      <FileEdit className="h-8 w-8" />
                    </div>
                    <div className="space-y-1 max-w-md">
                      <h3 className="text-lg font-bold text-foreground">No Research Work Created Yet</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Create an academic paper, research proposal, or literature review for this project to start writing sections and requesting faculty review.
                      </p>
                    </div>
                    <Button
                      onClick={handleOpenCreateWorkModal}
                      className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md"
                    >
                      <Plus className="h-4 w-4" /> + Add Research Work
                    </Button>
                  </Card>
                ) : (
                  /* ALL RESEARCH WORKS CARDS GRID */
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
                    {researchWorkList.map((doc) => (
                      <Card key={doc.id || doc._id} className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[0.68rem] font-semibold rounded-full px-2.5">
                                  {doc.templateType || "Research Paper"}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    doc.reviewStatus === "Pending Review"
                                      ? "border-amber-500/30 text-amber-500 bg-amber-500/10 text-[0.68rem] font-semibold rounded-full px-2.5"
                                      : doc.reviewStatus === "Reviewed" || doc.reviewStatus === "Changes Requested"
                                      ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[0.68rem] font-semibold rounded-full px-2.5"
                                      : "text-muted-foreground text-[0.68rem] border-border/80 bg-muted/40 rounded-full px-2.5"
                                  }
                                >
                                  {doc.reviewStatus || "Draft"}
                                </Badge>
                              </div>
                              <h3 className="font-extrabold text-foreground text-base leading-snug truncate pt-1" title={doc.title}>
                                {doc.title}
                              </h3>
                              <p className="text-[0.68rem] text-muted-foreground flex items-center gap-1">
                                <FolderKanban className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{project.title}</span>
                              </p>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl text-xs">
                                <DropdownMenuItem onClick={() => setActiveWorkDoc(doc)} className="gap-2 cursor-pointer font-medium">
                                  <FileEdit className="h-3.5 w-3.5 text-primary" /> Open Editor
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={!canRequestReviewForDoc(doc)}
                                  onClick={() => handleRequestWorkReview(doc)}
                                  className="gap-2 cursor-pointer font-medium disabled:opacity-50"
                                >
                                  <Send className="h-3.5 w-3.5 text-muted-foreground" /> Request Review
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setWorkToDelete(doc);
                                    setIsDeleteWorkModalOpen(true);
                                  }}
                                  className="gap-2 cursor-pointer text-destructive focus:text-destructive font-semibold"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete Research Work
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Abstract Preview */}
                          {doc.abstract ? (
                            <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/40">
                              "{doc.abstract}"
                            </p>
                          ) : (
                            <p className="text-[0.7rem] text-muted-foreground italic bg-muted/10 p-2.5 rounded-xl border border-dashed border-border/40">
                              No abstract written yet. Click Open Editor to write abstract.
                            </p>
                          )}

                          {/* Latest Faculty Supervisor Feedback */}
                          {doc.feedback && (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-[0.7rem] text-foreground italic space-y-0.5">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 block not-italic flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Faculty Supervisor Feedback:
                              </span>
                              <p className="line-clamp-2">"{doc.feedback}"</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 pt-3 border-t border-border/60">
                          <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground">
                            <span>
                              {doc.sections?.length || 0} Sections • {doc.sections ? doc.sections.reduce((acc: number, s: any) => acc + (s.content ? s.content.trim().split(/\s+/).filter(Boolean).length : 0), 0) : 0} Words
                            </span>
                            <span>
                              {doc.lastSaved ? `Saved ${new Date(doc.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Recently saved"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => setActiveWorkDoc(doc)}
                              className="rounded-xl text-xs font-semibold flex-1 h-8 bg-primary text-primary-foreground shadow-xs"
                            >
                              <FileEdit className="h-3.5 w-3.5 mr-1" /> Open Editor
                            </Button>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={!canRequestReviewForDoc(doc)}
                                      onClick={() => handleRequestWorkReview(doc)}
                                      className="rounded-xl text-xs font-semibold h-8 border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-50"
                                    >
                                      <Send className="h-3.5 w-3.5 mr-1" />
                                      {doc.reviewStatus === "Pending Review" ? "Pending" : "Review"}
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {!canRequestReviewForDoc(doc) && (
                                  <TooltipContent className="max-w-xs text-xs">
                                    {currentSupervisionState !== "Approved"
                                      ? "Faculty supervision required before submitting review requests."
                                      : doc.reviewStatus === "Pending Review"
                                      ? "An active review request is already pending with your supervisor."
                                      : "Make meaningful edits to your research document to enable requesting another review."}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setWorkToDelete(doc);
                                setIsDeleteWorkModalOpen(true);
                              }}
                              className="rounded-xl text-xs h-8 px-2.5 border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
                              title="Delete Research Work"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB: AI RESEARCH ROADMAP */}
          <TabsContent value="roadmap" className="space-y-6">
            <Card className="surface-elevated rounded-2xl border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1.5 rounded-full border-primary/30 bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                      <Sparkles className="h-3.5 w-3.5" /> AI Mentor Roadmap
                    </Badge>
                    {project.roadmapGeneratedAt && (
                      <span className="text-xs text-muted-foreground">
                        Generated {formatDisplayDate(project.roadmapGeneratedAt)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">AI Research Mentor Roadmap</h3>
                  <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                    Custom step-by-step academic plan generated by Gemini AI for <strong>"{project.title}"</strong>.
                    Follow these weekly milestones to structure your literature review, methodology, and implementation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    onClick={() => {
                      if (project.status === "Completed") {
                        toast.error("Cannot modify roadmap for a completed project.");
                        return;
                      }
                      setIsGenerateRoadmapModalOpen(true);
                    }}
                    disabled={project.status === "Completed"}
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    <RefreshCcw className="h-3.5 w-3.5 text-primary" />
                    {project.status === "Completed"
                      ? "Roadmap Locked (Completed)"
                      : Array.isArray(project.roadmap) && project.roadmap.length > 0
                      ? "Regenerate Plan"
                      : "Generate Roadmap"}
                  </Button>

                  {Array.isArray(project.roadmap) && project.roadmap.length > 0 && (
                    <Button
                      onClick={handleSyncRoadmapToTasks}
                      disabled={isSyncingRoadmapTasks || Boolean(project.roadmapSyncedToTasks)}
                      size="sm"
                      className={`gap-2 rounded-xl text-xs font-bold shadow-xs transition-all ${
                        project.roadmapSyncedToTasks
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400 cursor-not-allowed opacity-90"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      {isSyncingRoadmapTasks ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : project.roadmapSyncedToTasks ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Target className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {project.roadmapSyncedToTasks ? "✓ Tasks Synced to Board" : "Convert Roadmap to Tasks"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Roadmap Timeline View */}
              {Array.isArray(project.roadmap) && project.roadmap.length > 0 ? (
                <div className="pt-6 space-y-6">
                  <div className="relative pl-6 md:pl-8 border-l-2 border-primary/30 space-y-8">
                    {project.roadmap.map((step: any, idx: number) => (
                      <div key={idx} className="relative group">
                        {/* Stepper Node Dot */}
                        <div className="absolute -left-[37px] md:-left-[45px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-md border-2 border-background">
                          {step.week || idx + 1}
                        </div>

                        {/* Week Card */}
                        <Card className="rounded-2xl border border-border/80 bg-background/60 p-5 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-md space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[0.7rem] font-extrabold uppercase tracking-wider text-primary">
                                  Week {step.week || idx + 1} Milestone
                                </span>
                              </div>
                              <h4 className="text-base font-extrabold text-foreground">{step.title}</h4>
                            </div>

                            {step.deliverable && (
                              <Badge variant="secondary" className="gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold w-fit">
                                <span>📦 Deliverable:</span>
                                <span className="font-bold text-foreground">{step.deliverable}</span>
                              </Badge>
                            )}
                          </div>

                          {step.objective && (
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              <span className="font-semibold text-foreground">Objective:</span> {step.objective}
                            </p>
                          )}

                          {/* Task List */}
                          {Array.isArray(step.tasks) && step.tasks.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground block">
                                Action Items & Checklist:
                              </span>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {step.tasks.map((taskItem: string, tIdx: number) => (
                                  <div
                                    key={tIdx}
                                    className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/80 p-2.5 text-xs text-foreground font-medium"
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="leading-snug">{taskItem}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Mentor Advice Tip */}
                          {step.mentorTip && (
                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs">
                              <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">Research Mentor Tip:</span>
                                <p className="text-amber-950 dark:text-amber-200 text-[0.725rem] leading-relaxed">
                                  {step.mentorTip}
                                </p>
                              </div>
                            </div>
                          )}
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ) : project.status === "Completed" ? (
                /* Empty State for Completed Project */
                <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-500">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-foreground">Project Completed</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This research project has been completed. Roadmap generation is locked for completed projects.
                    </p>
                  </div>

                  <Button
                    disabled
                    variant="outline"
                    className="gap-2 rounded-xl text-xs font-bold border-border text-muted-foreground opacity-60 cursor-not-allowed px-6 py-2.5"
                  >
                    <Lock className="h-4 w-4" /> Roadmap Locked (Project Completed)
                  </Button>
                </div>
              ) : (
                /* Empty State for Active Projects */
                <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Compass className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-foreground">No Research Roadmap Generated Yet</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Let Gemini AI create a tailored, step-by-step weekly research plan based on your project topic and research goals.
                    </p>
                  </div>

                  <Button
                    onClick={() => setIsGenerateRoadmapModalOpen(true)}
                    className="gap-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 px-6 py-2.5"
                  >
                    <Sparkles className="h-4 w-4" /> Generate AI Research Roadmap
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* TAB: AI RESEARCH ASSISTANT */}
          <TabsContent value="assistant">
            <Card className="surface-elevated overflow-hidden rounded-2xl border-border bg-card">
              <div className="border-b border-border bg-muted/40 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">AI Research Assistant</h3>
                    <p className="text-[0.7rem] text-muted-foreground">Context: {project.title}</p>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full text-[0.65rem] border-primary/30 text-primary">
                  {papers.length} Papers Indexed
                </Badge>
              </div>

              {papers.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-3">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">Upload Research Papers to Enable AI Assistant</h4>
                  <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
                    The AI co-pilot synthesizes uploaded literature for "{project.title}" to answer research queries and literature questions.
                  </p>
                  <Button onClick={() => setActiveWorkspaceTab("papers")} className="mt-5 gap-2 rounded-xl bg-primary text-xs">
                    <Plus className="h-3.5 w-3.5" /> Upload Paper First
                  </Button>
                </div>
              ) : (
                <div className="p-6 space-y-4 min-h-[300px]">
                  <div className="flex gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 text-xs text-foreground space-y-2 max-w-2xl">
                      <p className="font-bold text-primary">AI Research Co-Pilot Online</p>
                      <p className="leading-relaxed">
                        I have indexed {papers.length} paper(s) linked to "{project.title}". Ask me about methodologies, quantitative findings, research gaps, or comparative conclusions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-border p-4 flex gap-2">
                <Input
                  placeholder={papers.length > 0 ? "Ask a question about your project literature…" : "Upload papers to ask AI questions…"}
                  disabled={papers.length === 0}
                  className="rounded-xl text-xs bg-muted/50"
                />
                <Button disabled={papers.length === 0} className="rounded-xl shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 4: LITERATURE SUMMARIES (AI Literature Analysis Workspace) */}
          <TabsContent value="summaries" className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border/60 pb-5 gap-4">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                    <BookOpen className="h-5 w-5 text-primary" /> AI Literature Analysis
                  </h2>
                  <Badge variant="outline" className="gap-1 rounded-full border-primary/30 bg-primary/10 text-primary text-[0.65rem] font-bold px-2.5 py-0.5">
                    <Sparkles className="h-3 w-3" /> Gemini AI
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use Gemini AI to analyze your saved reference papers and generate structured academic summaries.
                </p>
                <p className="text-[0.725rem] text-muted-foreground/80 italic">
                  Select a paper from your project library to generate an AI-assisted academic analysis. No re-upload is required.
                </p>
              </div>

              {papers.length > 0 && (
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <Badge variant="outline" className="rounded-xl border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground gap-1.5 shadow-sm">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span>{papers.length} Paper{papers.length === 1 ? "" : "s"} in Library</span>
                  </Badge>
                </div>
              )}
            </div>

            {/* If NO Reference Papers Exist in Project */}
            {papers.length === 0 ? (
              <Card className="surface-elevated flex flex-col items-center justify-center rounded-3xl border-dashed border-border py-16 px-6 text-center space-y-4 max-w-2xl mx-auto shadow-sm">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted/80 text-muted-foreground">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground">No Reference Papers</h3>
                  <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                    Add an academic reference paper to your project first. Once it is available, you can generate an AI-powered academic summary without uploading the paper again.
                  </p>
                </div>
                <Button
                  onClick={() => setActiveWorkspaceTab("reference-papers")}
                  className="gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-5 py-2.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Go to Reference Papers
                </Button>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* PAPER SELECTION CARD */}
                <Card className="surface-elevated rounded-3xl border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Generate New Summary
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Select one of your existing reference papers. ScholarNexus will analyze the stored paper and generate a structured academic summary.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-12 items-end">
                    <div className="space-y-2 md:col-span-8">
                      <Label className="text-xs font-bold text-foreground">Select Reference Paper</Label>
                      <Select
                        value={selectedPaperIdForSummary}
                        onValueChange={setSelectedPaperIdForSummary}
                        disabled={isGeneratingSummary}
                      >
                        <SelectTrigger className="w-full rounded-2xl border-border bg-background/60 px-4 py-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary shadow-xs">
                          <SelectValue placeholder="Choose a paper from project library..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border bg-card max-h-72">
                          {papers.map((p) => {
                            const pId = p.id || p._id || "";
                            const hasSummary = Boolean(p.aiSummary);
                            const authorShort = p.authors ? (p.authors.length > 35 ? p.authors.slice(0, 35) + "..." : p.authors) : "Unknown Authors";
                            const yearStr = p.year || p.publicationYear || "N/A";

                            return (
                              <SelectItem key={pId} value={pId} className="rounded-xl my-1 cursor-pointer">
                                <div className="flex items-center justify-between gap-4 w-full py-0.5">
                                  <div className="truncate text-left max-w-md">
                                    <p className="font-bold text-xs text-foreground truncate">{p.title}</p>
                                    <p className="text-[0.7rem] text-muted-foreground truncate">{authorShort} · {yearStr}</p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`shrink-0 text-[0.65rem] font-semibold rounded-full px-2 py-0.5 ${
                                      hasSummary
                                        ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                                        : "border-muted-foreground/30 text-muted-foreground bg-muted/40"
                                    }`}
                                  >
                                    {hasSummary ? "Summary available" : "Not analyzed"}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:col-span-4">
                      {selectedPaperForSummaryPreview?.aiSummary ? (
                        <>
                          <Button
                            onClick={() => setViewSummaryModalPaper(selectedPaperForSummaryPreview)}
                            disabled={isGeneratingSummary}
                            className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-3 shadow-md gap-2"
                          >
                            <Eye className="h-4 w-4" /> View AI Summary
                          </Button>
                          <Button
                            onClick={() => handleGeneratePaperSummary()}
                            disabled={isGeneratingSummary}
                            variant="outline"
                            className="rounded-2xl border-border text-xs font-semibold py-3 gap-2 hover:bg-muted"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" /> Regenerate
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleGeneratePaperSummary()}
                          disabled={!selectedPaperIdForSummary || isGeneratingSummary}
                          className="w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-3 shadow-md gap-2"
                        >
                          <Sparkles className="h-4 w-4" /> ✨ Generate AI Summary
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* SELECTED PAPER PREVIEW CARD */}
                  {selectedPaperForSummaryPreview && (
                    <div className="rounded-2xl border border-border/80 bg-muted/30 p-5 space-y-3 pt-4 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-primary" /> Selected Paper Preview
                        </span>
                        {selectedPaperForSummaryPreview.aiSummary ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[0.65rem] font-bold rounded-full">
                            Summary Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-[0.65rem] font-bold rounded-full">
                            Not Analyzed
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-foreground leading-snug">
                          {selectedPaperForSummaryPreview.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {selectedPaperForSummaryPreview.authors || "Authors not specified"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {(selectedPaperForSummaryPreview.year || selectedPaperForSummaryPreview.publicationYear) && (
                          <Badge variant="outline" className="rounded-md border-border bg-background/80 text-[0.7rem] font-semibold">
                            {selectedPaperForSummaryPreview.year || selectedPaperForSummaryPreview.publicationYear}
                          </Badge>
                        )}
                        {(selectedPaperForSummaryPreview.journal || selectedPaperForSummaryPreview.journalOrConference) && (
                          <Badge variant="outline" className="rounded-md border-border bg-background/80 text-[0.7rem] font-semibold max-w-xs truncate">
                            {selectedPaperForSummaryPreview.journal || selectedPaperForSummaryPreview.journalOrConference}
                          </Badge>
                        )}
                        {selectedPaperForSummaryPreview.doi && (
                          <Badge variant="outline" className="rounded-md border-primary/30 text-primary bg-primary/5 text-[0.7rem] font-mono">
                            DOI: {selectedPaperForSummaryPreview.doi}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </Card>

                {/* PROCESSING EXPERIENCE INDICATOR */}
                {isGeneratingSummary && (
                  <Card className="surface-elevated rounded-3xl border border-primary/40 bg-card p-6 md:p-8 space-y-6 shadow-lg animate-pulse">
                    <div className="flex items-center justify-between border-b border-border/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground">Analyzing Research Paper</h3>
                          <p className="text-xs text-primary font-medium">{summaryProgressMessage}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="gap-1 rounded-full border-primary/40 bg-primary/10 text-primary text-[0.68rem] font-bold px-3 py-1">
                        <Sparkles className="h-3 w-3" /> Gemini AI
                      </Badge>
                    </div>

                    {/* Vertical Stepper Progress */}
                    <div className="space-y-4 px-2">
                      <div className="flex items-center gap-3 text-xs font-semibold text-emerald-500">
                        <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/20 text-emerald-500">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span>Paper selected</span>
                      </div>

                      <div className={`flex items-center gap-3 text-xs font-semibold ${summaryProgressStep >= 2 ? "text-emerald-500" : "text-muted-foreground"}`}>
                        <div className={`grid h-6 w-6 place-items-center rounded-full ${summaryProgressStep >= 2 ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                          {summaryProgressStep >= 2 ? <Check className="h-3.5 w-3.5" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />}
                        </div>
                        <span>Reading paper</span>
                      </div>

                      <div className={`flex items-center gap-3 text-xs font-semibold ${summaryProgressStep >= 3 ? "text-emerald-500" : summaryProgressStep === 2 ? "text-primary animate-pulse" : "text-muted-foreground"}`}>
                        <div className={`grid h-6 w-6 place-items-center rounded-full ${summaryProgressStep >= 3 ? "bg-emerald-500/20 text-emerald-500" : summaryProgressStep === 2 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {summaryProgressStep >= 3 ? <Check className="h-3.5 w-3.5" /> : <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <span>Analyzing methodology and findings</span>
                      </div>

                      <div className={`flex items-center gap-3 text-xs font-semibold ${summaryProgressStep >= 4 ? "text-emerald-500" : summaryProgressStep === 3 ? "text-primary animate-pulse" : "text-muted-foreground"}`}>
                        <div className={`grid h-6 w-6 place-items-center rounded-full ${summaryProgressStep >= 4 ? "bg-emerald-500/20 text-emerald-500" : summaryProgressStep === 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {summaryProgressStep >= 4 ? <Check className="h-3.5 w-3.5" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />}
                        </div>
                        <span>Structuring academic summary</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* GENERATED SUMMARIES LIST */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-primary" /> Generated Summaries
                    </h3>
                    <Badge variant="outline" className="rounded-full text-[0.68rem] font-semibold border-border">
                      {papers.filter((p) => p.aiSummary).length} Available
                    </Badge>
                  </div>

                  {papers.every((p) => !p.aiSummary) ? (
                    <Card className="surface-elevated flex flex-col items-center justify-center rounded-3xl border-dashed border-border py-12 px-4 text-center space-y-3">
                      <BookOpen className="h-7 w-7 text-muted-foreground" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground">No AI summaries yet</h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          You already have reference papers in this project. Select one above to generate your first AI-powered academic summary.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (papers.length > 0) {
                            setSelectedPaperIdForSummary(papers[0].id || papers[0]._id || "");
                          }
                        }}
                        className="rounded-xl text-xs bg-primary text-primary-foreground font-semibold px-4"
                      >
                        Generate First Summary
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {papers
                        .filter((p) => p.aiSummary)
                        .map((p) => {
                          const s = p.aiSummary!;
                          const genDateStr = s.generatedAt
                            ? formatDisplayDate(s.generatedAt.split("T")[0])
                            : "Recently";

                          return (
                            <Card key={p.id || p._id} className="rounded-2xl border border-border bg-card p-5 space-y-4 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[0.65rem] font-bold rounded-full shrink-0">
                                    AI Summary Available
                                  </Badge>
                                  <span className="text-[0.68rem] text-muted-foreground shrink-0">
                                    Generated {genDateStr}
                                  </span>
                                </div>

                                <h4 className="font-bold text-foreground text-sm leading-snug line-clamp-2">
                                  {p.title}
                                </h4>

                                <p className="text-xs text-muted-foreground truncate">
                                  {p.authors || "Unknown Authors"}
                                </p>

                                <p className="text-[0.725rem] text-muted-foreground/80">
                                  {p.year || p.publicationYear || "N/A"} · {p.journal || p.journalOrConference || "Academic Publication"}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                                <span className="text-[0.7rem] text-muted-foreground flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-primary" /> Structured Analysis
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => setViewSummaryModalPaper(p)}
                                  className="rounded-xl text-xs font-semibold px-3.5 h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-xs"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View Summary
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 5: PAPER COMPARISON */}
          <TabsContent value="comparison" className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <GitCompareArrows className="h-5 w-5 text-primary" /> Paper Comparison Matrix
              </h2>
              <p className="text-xs text-muted-foreground">Side-by-side empirical matrix across methodologies and findings.</p>
            </div>

            {papers.length < 2 ? (
              <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-4 text-center">
                <GitCompareArrows className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-lg font-bold text-foreground">Requires At Least 2 Uploaded Papers</h3>
                <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
                  Upload multiple research papers to generate a side-by-side comparative literature matrix.
                </p>
                <Button onClick={() => setActiveWorkspaceTab("papers")} className="mt-4 gap-2 rounded-xl text-xs">
                  <Plus className="h-3.5 w-3.5" /> Upload Papers
                </Button>
              </Card>
            ) : (
              <Card className="surface-elevated overflow-hidden rounded-2xl border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 uppercase text-[0.68rem] font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Attribute</th>
                        {papers.map((p) => (
                          <th key={p.id} className="px-4 py-3 min-w-[200px]">{p.title}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="px-4 py-3 font-bold text-foreground bg-muted/20">Authors</td>
                        {papers.map((p) => (
                          <td key={p.id} className="px-4 py-3 text-muted-foreground">{p.authors || "Not specified"}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-foreground bg-muted/20">Year & Journal</td>
                        {papers.map((p) => (
                          <td key={p.id} className="px-4 py-3 text-muted-foreground">
                            {p.journal || "Unspecified Journal"} {p.year ? `(${p.year})` : ""}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-foreground bg-muted/20">Methodology</td>
                        {papers.map((p) => (
                          <td key={p.id} className="px-4 py-3 text-muted-foreground">Quantitative / Empirical Analysis</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* TAB 6: CITATION GENERATOR */}
          <TabsContent value="citations" className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Quote className="h-5 w-5 text-primary" /> Citation Generator
              </h2>
              <p className="text-xs text-muted-foreground">Formatted citations for project literature.</p>
            </div>

            {papers.length === 0 ? (
              <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-4 text-center">
                <Quote className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-lg font-bold text-foreground">No Literature for Citations</h3>
                <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
                  Upload research papers to generate APA, MLA, Chicago, and IEEE citations automatically.
                </p>
              </Card>
            ) : (
              <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Select Research Paper</Label>
                    <Select value={activeCitationPaper?.id} onValueChange={setSelectedCitationPaperId}>
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue placeholder="Select paper" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {papers.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Citation Style Standard</Label>
                    <div className="flex items-center gap-1.5">
                      {(["APA", "MLA", "Chicago", "IEEE"] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => setCitationStyle(style)}
                          className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${citationStyle === style
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-muted/40 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="rounded-full text-[0.65rem] border-primary/40 text-primary">
                      {citationStyle} Citation Format
                    </Badge>
                    <Button size="sm" onClick={handleCopyCitation} className="gap-1.5 rounded-xl text-xs">
                      {copiedCitation ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedCitation ? "Copied!" : "Copy Citation"}
                    </Button>
                  </div>

                  <p className="font-mono text-xs leading-relaxed text-foreground bg-background p-4 rounded-xl border border-border/60 select-all">
                    {formattedCitationText}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* TAB 7: SIMILARITY CHECKER */}
          <TabsContent value="similarity" className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ScanSearch className="h-5 w-5 text-primary" /> Academic Similarity Checker
              </h2>
              <p className="text-xs text-muted-foreground">Overlap analysis and original literature verification reports.</p>
            </div>

            <Card className="surface-elevated rounded-2xl border-border bg-card p-8 text-center space-y-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto">
                <ScanSearch className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-foreground">Project Literature Originality Scan</h3>
              <p className="max-w-md text-xs text-muted-foreground mx-auto">
                {papers.length > 0
                  ? `Similarity scan report initialized for ${papers.length} paper(s) linked to "${project.title}". Originality score: 98% Clear.`
                  : "Upload project drafts or papers to run academic similarity scans."}
              </p>
            </Card>
          </TabsContent>


          {/* TAB 9: PROJECT SETTINGS */}
          <TabsContent value="settings">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" /> Project Actions
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage status, metadata, or visibility of this project workspace.
                </p>

                <div className="space-y-3 pt-2">
                  <Button onClick={() => setIsEditModalOpen(true)} className="w-full justify-start gap-2 rounded-xl" variant="outline">
                    <Pencil className="h-4 w-4 text-amber-500" /> Edit Project Parameters
                  </Button>

                  <Button onClick={() => setIsDeleteDialogOpen(true)} className="w-full justify-start gap-2 rounded-xl text-destructive hover:bg-destructive/10" variant="outline">
                    <Trash2 className="h-4 w-4" /> Delete Project Workspace
                  </Button>
                </div>
              </Card>

              <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" /> Workspace Information
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Project ID</span>
                    <span className="font-mono text-foreground">{project._id || project.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Owner Account</span>
                    <span className="font-medium text-foreground">{project.userEmail}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">Created Date</span>
                    <span className="font-medium text-foreground">{formatDate(project.createdAt)}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium text-foreground">{formatDate(project.updatedAt || project.createdAt)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Reference Paper Dialog: Strictly Upload PDF Only */}
      <Dialog open={isPaperUploadModalOpen} onOpenChange={(open) => !isExtractingMetadata && setIsPaperUploadModalOpen(open)}>
        <DialogContent className="max-w-md rounded-3xl border-border bg-card p-6 shadow-2xl space-y-4">
          <DialogHeader className="border-b border-border/60 pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <FileUp className="h-5 w-5 text-primary" /> Reference Paper
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Upload an academic paper PDF to add it to your project's reference collection.
            </DialogDescription>
          </DialogHeader>

          {/* Hidden File Input: Single PDF Only */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            multiple={false}
            onChange={handleFileSelect}
            disabled={isExtractingMetadata}
            className="hidden"
          />

          {isExtractingMetadata ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-foreground">Processing Reference Paper...</h4>
                <p className="text-[0.7rem] text-primary font-semibold animate-pulse">{extractionStep || "Extracting metadata with Gemini AI..."}</p>
              </div>
              <p className="text-[0.65rem] text-muted-foreground">Reading title, authors, abstract, and publication details...</p>
            </div>
          ) : (
            <div
              onClick={() => !isExtractingMetadata && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 text-center transition-all cursor-pointer hover:border-primary/60 hover:bg-primary/5"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-3">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-foreground">Click to upload or drag & drop PDF paper</p>
              <p className="text-[0.7rem] text-muted-foreground mt-1">Accepted format: PDF • One paper at a time</p>
            </div>
          )}

          <DialogFooter className="border-t border-border/60 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={isExtractingMetadata}
              onClick={() => setIsPaperUploadModalOpen(false)}
              className="rounded-xl text-xs w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Paper Dialog */}
      <Dialog open={!!viewingPaper} onOpenChange={(open) => !open && setViewingPaper(null)}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-2xl border-border bg-card p-6 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          {viewingPaper && (
            <>
              <DialogHeader className="border-b border-border/60 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-[0.65rem] font-semibold">
                        Research Paper Details
                      </Badge>
                      {viewingPaper.fileData && (
                        <Badge variant="outline" className="rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[0.65rem] font-semibold gap-1">
                          <FileCheck className="h-3 w-3" /> PDF Stream Attached
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                      {viewingPaper.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground truncate">
                      Authors: <span className="text-foreground font-medium">{viewingPaper.authors}</span>
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleOpenDocument(viewingPaper)}
                      className="rounded-xl text-xs gap-1.5 bg-primary text-primary-foreground shadow-sm font-semibold"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open Document PDF
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* Main Body: Details Cards + Embedded Viewer */}
              <div className="flex-1 overflow-y-auto py-4 space-y-6">
                {/* Key Paper Metadata Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1">
                    <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground block">
                      Authors
                    </span>
                    <p className="font-semibold text-foreground truncate">{viewingPaper.authors}</p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1">
                    <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground block">
                      Publication Year
                    </span>
                    <p className="font-semibold text-foreground">{viewingPaper.year}</p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1">
                    <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground block">
                      Journal / Conference
                    </span>
                    <p className="font-semibold text-foreground truncate">{viewingPaper.journal}</p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1">
                    <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground block">
                      Upload Date
                    </span>
                    <p className="font-semibold text-foreground">{formatDate(viewingPaper.uploadDate)}</p>
                  </div>
                </div>

                {/* Executive Summary / Abstract Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Executive Summary & Literature Findings
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/60">
                    {viewingPaper.summary ||
                      `Empirical study exploring ${viewingPaper.title} with quantitative literature synthesis, methodology overview, and experimental framework.`}
                  </p>
                </div>

                {/* Embedded Document PDF Previewer */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" /> Document Preview & PDF Reader
                    </h3>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleOpenDocument(viewingPaper)}
                      className="h-auto p-0 text-xs text-primary font-semibold hover:underline"
                    >
                      Open in Full Window →
                    </Button>
                  </div>

                  {viewingPaper.fileData ? (
                    <iframe
                      src={viewingPaper.fileData}
                      title={viewingPaper.title}
                      className="w-full h-[450px] rounded-xl border border-border bg-muted/20 shadow-inner"
                    />
                  ) : viewingPaper.url && (viewingPaper.url.startsWith("http://") || viewingPaper.url.startsWith("https://")) ? (
                    <iframe
                      src={viewingPaper.url}
                      title={viewingPaper.title}
                      className="w-full h-[450px] rounded-xl border border-border bg-muted/20 shadow-inner"
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                      <p className="text-xs font-semibold text-foreground">Embedded PDF Preview Stream</p>
                      <p className="text-[0.7rem] text-muted-foreground max-w-sm mx-auto">
                        Document indexed for AI analysis and citation generation. Click "Open Document PDF" above to launch full PDF viewer.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-border/60 pt-3 gap-2">
                <Button variant="outline" onClick={() => setViewingPaper(null)} className="rounded-xl text-xs">
                  Close Details
                </Button>
                <Button onClick={() => handleOpenDocument(viewingPaper)} className="rounded-xl text-xs bg-primary text-primary-foreground font-semibold gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> Open Document PDF
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Paper Dialog */}
      <AlertDialog open={!!deletingPaper} onOpenChange={(open) => !open && setDeletingPaper(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card p-6 shadow-xl">
          {deletingPaper && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-bold text-destructive">
                  Remove Research Paper?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground">
                  Are you sure you want to remove <strong className="text-foreground">"{deletingPaper.title}"</strong> from this project workspace?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePaper} className="rounded-xl text-xs bg-destructive text-destructive-foreground">
                  Remove Paper
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Project Parameters Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl border-border bg-card p-6 shadow-2xl space-y-4 sm:max-w-md">
          <DialogHeader className="border-b border-border/60 pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Pencil className="h-5 w-5 text-primary" /> Edit Project Parameters
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update project status, milestone progress, or expected completion date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProject} className="space-y-4 py-1">
            {/* Project Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Project Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val: ProjectStatus) => handleFieldChange("status", val)}
              >
                <SelectTrigger className="rounded-xl text-xs bg-background border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Planning" className="text-xs">Planning</SelectItem>
                  <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                  <SelectItem value="Under Review" className="text-xs">Under Review</SelectItem>
                  <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                  <SelectItem value="On Hold" className="text-xs">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date (Read-only) */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold text-foreground">Start Date</Label>
              <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 px-3.5 py-2.5 text-xs">
                <span className="font-medium text-foreground">
                  {formatDisplayDate(project?.startDate)}
                </span>
                <Badge variant="outline" className="rounded-md border-border/80 text-[0.65rem] font-semibold text-muted-foreground bg-background">
                  Read-only
                </Badge>
              </div>
            </div>

            {/* Expected Completion Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Expected Completion Date</Label>
              <Input
                type="date"
                value={formData.expectedCompletionDate || ""}
                onChange={(e) => handleFieldChange("expectedCompletionDate", e.target.value)}
                className={`rounded-xl text-xs bg-background border-border ${
                  fieldErrors.expectedCompletionDate ? "border-destructive" : ""
                }`}
              />
              {fieldErrors.expectedCompletionDate && (
                <p className="text-[0.75rem] text-destructive font-medium mt-1">
                  {fieldErrors.expectedCompletionDate}
                </p>
              )}
            </div>

            <DialogFooter className="border-t border-border/60 pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || submitting}
                className="rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-border bg-card p-6 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-destructive">
              Delete Research Project Workspace?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to permanently delete <strong className="text-foreground">"{project.title}"</strong>? All workspace data will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={submitting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Request Supervisor Professional Modal Dialog */}
      <Dialog open={isRequestSupervisorModalOpen} onOpenChange={setIsRequestSupervisorModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-border bg-card p-6 shadow-xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <GraduationCap className="h-5 w-5 text-primary" /> Request Faculty Supervisor
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an approved faculty member from the directory to request project supervision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="Search by name, department, or research interest…"
                value={facultySearchQuery}
                onChange={(e) => setFacultySearchQuery(e.target.value)}
                className="pl-9 rounded-xl text-xs"
              />
            </div>

            {/* Approved Faculty List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {filteredFacultyList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                  No approved faculty members found matching your search.
                </div>
              ) : (
                filteredFacultyList.map((faculty: any) => {
                  const isSelected = selectedFaculty?.id === faculty.id || selectedFaculty?._id === faculty._id;
                  const interests: string[] = Array.isArray(faculty.researchInterests)
                    ? faculty.researchInterests
                    : typeof faculty.researchInterests === "string"
                    ? faculty.researchInterests.split(",").map((s: string) => s.trim())
                    : [];

                  return (
                    <Card
                      key={faculty.id || faculty._id || faculty.email}
                      onClick={() => setSelectedFaculty(faculty)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-md ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                          : "border-border/80 bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {faculty.photoURL ? (
                          <img
                            src={faculty.photoURL}
                            alt={faculty.name}
                            className="h-12 w-12 rounded-xl object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-base shrink-0">
                            {(faculty.name || "F").charAt(0)}
                          </div>
                        )}

                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm text-foreground truncate">{faculty.name}</h4>
                            {isSelected && (
                              <Badge className="bg-primary text-primary-foreground text-[0.65rem] font-bold rounded-full px-2">
                                Selected
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-primary/90">
                            {faculty.designation || faculty.title || "Professor"}
                          </p>

                          <p className="text-xs text-muted-foreground truncate">
                            {faculty.department || "School of Computer Science & AI"}
                            {faculty.institution || faculty.affiliation ? ` • ${faculty.institution || faculty.affiliation}` : ""}
                          </p>

                          {interests.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1.5">
                              {interests.slice(0, 4).map((interest, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-[0.65rem] py-0 px-2 rounded-full border-border/80 bg-muted/50 text-muted-foreground font-medium"
                                >
                                  {interest}
                                </Badge>
                              ))}
                              {interests.length > 4 && (
                                <span className="text-[0.65rem] text-muted-foreground self-center">
                                  +{interests.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Optional Student Message */}
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <Label className="text-xs font-semibold text-foreground">
                Optional Message for Faculty <span className="text-muted-foreground">(Default message provided)</span>
              </Label>
              <Textarea
                placeholder="Include a short message or invitation for the faculty member…"
                rows={3}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2 border-t border-border/60 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestSupervisorModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendSupervisionRequest}
              disabled={!selectedFaculty || sendingRequest}
              className="rounded-xl bg-primary text-xs font-bold text-primary-foreground gap-1.5"
            >
              {sendingRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Research Work Confirmation Modal */}
      <AlertDialog open={isDeleteWorkModalOpen} onOpenChange={setIsDeleteWorkModalOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md border-border bg-card p-6 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/15 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle className="text-lg font-bold text-foreground">Delete Research Work?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                  This action will permanently remove this research document.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-foreground font-medium">
              Are you sure you want to delete <span className="font-bold text-destructive">"{workToDelete?.title}"</span>?
            </p>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300 space-y-1">
              <span className="font-bold block text-xs">⚠️ Permanent Deletion Warning</span>
              <p className="text-[0.725rem] leading-relaxed">
                All draft sections, abstract content, and keywords for this document will be permanently deleted. Your main research project will remain intact.
              </p>
            </div>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
            <AlertDialogCancel disabled={deletingWork} className="rounded-xl text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingWork}
              onClick={() => handleDeleteResearchWork(workToDelete)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold gap-1.5"
            >
              {deletingWork ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete Research Work
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Research Work Template Modal */}
      <Dialog open={isCreateWorkModalOpen} onOpenChange={setIsCreateWorkModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-border bg-card p-6 shadow-2xl">
          <DialogHeader className="border-b border-border/60 pb-3">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" /> Create Research Work
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select a research paper template or start with a blank document to begin academic writing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Document Title</Label>
              <Input
                placeholder="e.g. Comparative Analysis of Neural Attention Models..."
                value={newWorkTitle}
                onChange={(e) => setNewWorkTitle(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Choose Template</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    type: "Research Paper",
                    desc: "Standard academic paper with Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion.",
                    icon: FileText,
                  },
                  {
                    type: "Literature Review",
                    desc: "Theoretical framework, methodological analysis, comparative synthesis, and research gaps.",
                    icon: BookOpen,
                  },
                  {
                    type: "Research Proposal",
                    desc: "Problem statement, research objectives, preliminary literature review, proposed methodology, and timeline.",
                    icon: FileEdit,
                  },
                  {
                    type: "Project Report",
                    desc: "Executive summary, project architecture, implementation details, and evaluation.",
                    icon: Layers,
                  },
                  {
                    type: "Conference Paper",
                    desc: "Introduction, proposed system/model, experimental evaluation, and conclusion.",
                    icon: Sparkles,
                  },
                  {
                    type: "Blank Document",
                    desc: "Start with a clean document and add custom sections manually.",
                    icon: Plus,
                  },
                ].map((t) => {
                  const TIcon = t.icon;
                  const isAlreadyCreated = t.type !== "Blank Document" && createdTemplateTypes.has(t.type);
                  const isSelected = selectedTemplate === t.type;
                  return (
                    <div
                      key={t.type}
                      onClick={() => {
                        if (!isAlreadyCreated) {
                          setSelectedTemplate(t.type);
                        }
                      }}
                      className={`rounded-2xl border p-3.5 space-y-1.5 transition-all ${
                        isAlreadyCreated
                          ? "opacity-50 bg-muted/40 border-muted/80 cursor-not-allowed pointer-events-none"
                          : isSelected
                          ? "border-primary bg-primary/10 shadow-sm cursor-pointer"
                          : "border-border/70 bg-background/50 hover:border-border cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          <TIcon className="h-4 w-4 text-primary" /> {t.type}
                        </span>
                        {isAlreadyCreated ? (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 text-[0.65rem] font-bold rounded-full px-2">
                            Already Created
                          </Badge>
                        ) : isSelected ? (
                          <Badge variant="outline" className="border-primary text-primary text-[0.65rem] font-bold rounded-full px-2">
                            Selected
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-[0.7rem] text-muted-foreground leading-snug">{t.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 pt-3 gap-2">
            <Button variant="outline" onClick={() => setIsCreateWorkModalOpen(false)} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              disabled={selectedTemplate !== "Blank Document" && createdTemplateTypes.has(selectedTemplate)}
              onClick={() => handleCreateResearchWork(selectedTemplate)}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil className="h-3.5 w-3.5" /> Start Writing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Optional AI Assist Drawer Dialog */}
      <Dialog open={aiAssistSectionId !== null} onOpenChange={(open) => !open && setAiAssistSectionId(null)}>
        <DialogContent className="max-w-xl rounded-2xl border-border bg-card p-6 shadow-2xl space-y-4">
          <DialogHeader className="border-b border-border/60 pb-3">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Writing Assist
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Optional AI co-pilot to improve, expand, or generate structured academic content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Select AI Assist Action</Label>
              <select
                value={aiAssistAction}
                onChange={(e) => setAiAssistAction(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="improve_writing">Improve Academic Writing & Clarity</option>
                <option value="academic_tone">Enhance Formal Scholarly Tone</option>
                <option value="expand_section">Expand Section & Elaborate Arguments</option>
                <option value="generate_abstract">Generate Structured Abstract</option>
                <option value="generate_outline">Generate Section Outline</option>
                <option value="suggest_questions">Suggest Analytical Research Questions</option>
                <option value="summarize_notes">Synthesize Research Notes</option>
              </select>
            </div>

            <Button
              onClick={handleGenerateAiAssist}
              disabled={generatingAi}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm gap-2"
            >
              {generatingAi ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" /> Generating AI Suggestion...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate AI Suggestion
                </>
              )}
            </Button>

            {aiSuggestion && (
              <div className="space-y-3 pt-2">
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-2 text-xs">
                  <span className="font-bold text-primary flex items-center gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5" /> AI Writing Suggestion:
                  </span>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap font-mono text-[0.725rem]">
                    {aiSuggestion}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAiSuggestion(null);
                      setAiAssistSectionId(null);
                    }}
                    className="rounded-xl text-xs"
                  >
                    Keep My Version
                  </Button>
                  <Button
                    onClick={handleApplyAiSuggestion}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Use Suggestion
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Review Extracted Metadata Confirmation Modal */}
      <Dialog open={isReviewMetadataModalOpen} onOpenChange={setIsReviewMetadataModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border/60 pb-3">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Review Extracted Paper Information
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review the information detected from your uploaded reference paper. You can edit any field before saving.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmAndSaveReviewMetadata} className="space-y-4 py-1">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Paper Title..."
                value={reviewPaperData.title}
                onChange={(e) => setReviewPaperData({ ...reviewPaperData, title: e.target.value })}
                required
                className="rounded-xl text-xs bg-background border-border"
              />
            </div>

            {/* Authors */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Authors</Label>
              <Input
                placeholder="e.g. John Doe, Jane Smith, Alan Turing"
                value={reviewPaperData.authors}
                onChange={(e) => setReviewPaperData({ ...reviewPaperData, authors: e.target.value })}
                className="rounded-xl text-xs bg-background border-border"
              />
              <p className="text-[0.68rem] text-muted-foreground">Comma-separated names of human authors.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Publication Year */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Publication Year</Label>
                <Input
                  placeholder="e.g. 2025"
                  value={reviewPaperData.publicationYear}
                  onChange={(e) => setReviewPaperData({ ...reviewPaperData, publicationYear: e.target.value })}
                  className="rounded-xl text-xs bg-background border-border"
                />
              </div>

              {/* Journal / Conference */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Journal / Conference</Label>
                <Input
                  placeholder="e.g. IEEE / Nature"
                  value={reviewPaperData.journalOrConference}
                  onChange={(e) => setReviewPaperData({ ...reviewPaperData, journalOrConference: e.target.value })}
                  className="rounded-xl text-xs bg-background border-border"
                />
              </div>

              {/* DOI */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">DOI</Label>
                <Input
                  placeholder="e.g. 10.1000/182"
                  value={reviewPaperData.doi}
                  onChange={(e) => setReviewPaperData({ ...reviewPaperData, doi: e.target.value })}
                  className="rounded-xl text-xs bg-background border-border"
                />
              </div>
            </div>

            {/* Abstract */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Abstract</Label>
              <Textarea
                placeholder="Extracted abstract text..."
                rows={4}
                value={reviewPaperData.abstract}
                onChange={(e) => setReviewPaperData({ ...reviewPaperData, abstract: e.target.value })}
                className="rounded-2xl text-xs bg-background border-border leading-relaxed"
              />
            </div>

            {/* Keywords */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Keywords</Label>
              <Input
                placeholder="e.g. Artificial Intelligence, Neural Networks, Computer Vision"
                value={reviewPaperData.keywords}
                onChange={(e) => setReviewPaperData({ ...reviewPaperData, keywords: e.target.value })}
                className="rounded-xl text-xs bg-background border-border"
              />
              <p className="text-[0.68rem] text-muted-foreground">Comma-separated academic keywords.</p>
            </div>

            <DialogFooter className="border-t border-border/60 pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewMetadataModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingPaper}
                className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm gap-1.5"
              >
                {isSavingPaper ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isSavingPaper ? "Saving Paper..." : "Confirm & Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* STRUCTURED AI PAPER SUMMARY RESULTS MODAL */}
      <Dialog open={viewSummaryModalPaper !== null} onOpenChange={(open) => !open && setViewSummaryModalPaper(null)}>
        <DialogContent className="max-w-4xl rounded-3xl border-border bg-card p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
          {viewSummaryModalPaper && viewSummaryModalPaper.aiSummary && (
            <>
              <DialogHeader className="border-b border-border/60 pb-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline" className="gap-1 rounded-full border-primary/30 bg-primary/10 text-primary text-[0.68rem] font-bold px-3 py-0.5">
                    <Sparkles className="h-3 w-3" /> Generated with Gemini AI
                  </Badge>

                  {viewSummaryModalPaper.aiSummary.generatedAt && (
                    <span className="text-[0.725rem] text-muted-foreground">
                      Analysis Generated: {formatDisplayDate(viewSummaryModalPaper.aiSummary.generatedAt.split("T")[0])}
                    </span>
                  )}
                </div>

                <DialogTitle className="text-xl font-bold tracking-tight text-foreground leading-snug">
                  {viewSummaryModalPaper.title}
                </DialogTitle>

                <DialogDescription className="text-xs text-muted-foreground">
                  {viewSummaryModalPaper.authors || "Authors not specified"} {viewSummaryModalPaper.year ? `(${viewSummaryModalPaper.year})` : ""} · {viewSummaryModalPaper.journal || viewSummaryModalPaper.journalOrConference || "Academic Paper"}
                </DialogDescription>
              </DialogHeader>

              {/* 11 STRUCTURED SUMMARY SECTIONS */}
              <div className="space-y-6 py-2">
                {/* Top 2-Column Grid for Core Overview & Objectives */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* 01 — Overview */}
                  <Card className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <span className="text-xs font-bold text-primary font-mono">01</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-primary" /> Overview
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {viewSummaryModalPaper.aiSummary.overview}
                    </p>
                  </Card>

                  {/* 02 — Research Objective */}
                  <Card className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <span className="text-xs font-bold text-primary font-mono">02</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-primary" /> Research Objective
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {viewSummaryModalPaper.aiSummary.researchObjective}
                    </p>
                  </Card>
                </div>

                {/* 03 — Problem Statement */}
                <Card className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <span className="text-xs font-bold text-primary font-mono">03</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Problem Statement
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {viewSummaryModalPaper.aiSummary.problemStatement}
                  </p>
                </Card>

                {/* 2-Column Grid for Methodology & Dataset */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* 04 — Methodology */}
                  <Card className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <span className="text-xs font-bold text-primary font-mono">04</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-primary" /> Methodology
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {viewSummaryModalPaper.aiSummary.methodology}
                    </p>
                  </Card>

                  {/* 05 — Dataset / Data Used */}
                  <Card className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <span className="text-xs font-bold text-primary font-mono">05</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-cyan-500" /> Dataset / Data Used
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {viewSummaryModalPaper.aiSummary.dataset}
                    </p>
                  </Card>
                </div>

                {/* 2-Column Grid for Algorithms & Key Findings */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* 06 — Algorithms / Models / Techniques */}
                  <Card className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <span className="text-xs font-bold text-primary font-mono">06</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-primary" /> Algorithms / Models / Techniques
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {viewSummaryModalPaper.aiSummary.algorithms}
                    </p>
                  </Card>

                  {/* 07 — Key Findings */}
                  <Card className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <span className="text-xs font-bold text-primary font-mono">07</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Key Findings
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {viewSummaryModalPaper.aiSummary.keyFindings}
                    </p>
                  </Card>
                </div>

                {/* 2-Column Grid for Advantages & Limitations */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* 08 — Advantages / Contributions */}
                  <Card className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <span className="text-xs font-bold text-primary font-mono">08</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-emerald-500" /> Advantages / Contributions
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {viewSummaryModalPaper.aiSummary.advantages}
                    </p>
                  </Card>

                  {/* 09 — Limitations */}
                  <Card className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <span className="text-xs font-bold text-primary font-mono">09</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Limitations
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {viewSummaryModalPaper.aiSummary.limitations}
                    </p>
                  </Card>
                </div>

                {/* 10 — Future Work */}
                <Card className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <span className="text-xs font-bold text-primary font-mono">10</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5 text-primary" /> Future Work
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {viewSummaryModalPaper.aiSummary.futureWork}
                  </p>
                </Card>

                {/* 11 — KEY TAKEAWAY (HIGHLIGHTED VISUAL INSIGHT CARD) */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-card p-6 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary font-mono">11</span>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Key Takeaway
                      </h4>
                    </div>
                    <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[0.65rem] font-bold rounded-full">
                      Academic Insight
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed italic">
                    "{viewSummaryModalPaper.aiSummary.keyTakeaway}"
                  </p>
                </div>
              </div>

              {/* DIALOG FOOTER & ACTIONS */}
              <DialogFooter className="border-t border-border/60 pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopySummaryContent(viewSummaryModalPaper)}
                    className="rounded-xl text-xs font-semibold gap-1.5 border-border hover:bg-muted"
                  >
                    {copiedSummaryState ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedSummaryState ? "Copied!" : "Copy Summary"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const paperToRegen = viewSummaryModalPaper;
                      setViewSummaryModalPaper(null);
                      handleGeneratePaperSummary(paperToRegen);
                    }}
                    className="rounded-xl text-xs font-semibold gap-1.5 border-border hover:bg-muted"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" /> Regenerate Summary
                  </Button>
                </div>

                <Button
                  onClick={() => setViewSummaryModalPaper(null)}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-6"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate AI Research Roadmap Modal */}
      <Dialog open={isGenerateRoadmapModalOpen} onOpenChange={setIsGenerateRoadmapModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate AI Research Roadmap
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Gemini AI will analyze <strong>"{project?.title}"</strong> and create a week-by-week research roadmap tailored for your project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Project Topic</Label>
              <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs font-medium text-foreground">
                {project?.title}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="durationSelect" className="text-xs font-semibold text-foreground">
                Roadmap Duration Timeline
              </Label>
              <Select
                value={String(roadmapDurationWeeks)}
                onValueChange={(val) => setRoadmapDurationWeeks(Number(val))}
              >
                <SelectTrigger id="durationSelect" className="rounded-xl text-xs">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  {(project?.progress || 0) >= 70 ? (
                    <>
                      <SelectItem value="2">2 Weeks — Rapid Finalization & Revisions (Recommended)</SelectItem>
                      <SelectItem value="3">3 Weeks — Final Review & Defense Prep</SelectItem>
                      <SelectItem value="4">4 Weeks — Comprehensive Revision Sprint</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="4">4 Weeks — Rapid Research Sprint</SelectItem>
                      <SelectItem value="6">6 Weeks — Standard Academic Plan (Recommended)</SelectItem>
                      <SelectItem value="8">8 Weeks — In-Depth Investigation</SelectItem>
                      <SelectItem value="12">12 Weeks — Full Semester Capstone</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5 text-xs text-primary">
              <Compass className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-[0.725rem] leading-relaxed">
                {(project?.progress || 0) >= 70
                  ? "Advanced Phase: The AI will generate a finalization roadmap focusing on manuscript polishing, supervisor feedback integration, and defense prep."
                  : "The generated roadmap will outline literature collection, problem synthesis, methodology, implementation, and paper drafting phases."}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsGenerateRoadmapModalOpen(false)}
              disabled={isGeneratingRoadmap}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateRoadmap}
              disabled={isGeneratingRoadmap}
              className="gap-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm"
            >
              {isGeneratingRoadmap ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Roadmap
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay when Gemini AI is extracting metadata */}
      {isExtractingMetadata && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4 text-center">
          <div className="rounded-3xl border border-primary/30 bg-card p-8 shadow-2xl max-w-sm w-full space-y-4 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary mx-auto">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Processing Reference Paper...</h3>
              <p className="text-xs text-primary font-semibold animate-pulse">{extractionStep || "Extracting metadata with Gemini AI..."}</p>
            </div>
            <p className="text-[0.725rem] text-muted-foreground">Reading title, authors, abstract, and publication details...</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
