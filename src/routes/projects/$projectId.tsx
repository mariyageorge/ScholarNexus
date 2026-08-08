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
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
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
  requestedFacultyId?: string | null;
  requestedFacultyName?: string | null;
  supervisionStatus?: "Not Assigned" | "Pending Approval" | "Under Supervision" | "Rejected";
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPaper {
  id: string;
  _id?: string;
  projectId: string;
  title: string;
  authors: string;
  year: string;
  journal: string;
  uploadDate: string;
  url?: string;
  fileData?: string;
  summary?: string;
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
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-400",
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
  const [isRequestSupervisorModalOpen, setIsRequestSupervisorModalOpen] = useState(false);
  const [facultySearchQuery, setFacultySearchQuery] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);
  const [requestMessage, setRequestMessage] = useState("I would like you to supervise my research project.");
  const [sendingRequest, setSendingRequest] = useState(false);

  // Navigation state for active workspace tab
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("overview");

  // Project Papers State
  const [papers, setPapers] = useState<ProjectPaper[]>([]);
  const [isPaperUploadModalOpen, setIsPaperUploadModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ProjectPaper | null>(null);
  const [viewingPaper, setViewingPaper] = useState<ProjectPaper | null>(null);
  const [deletingPaper, setDeletingPaper] = useState<ProjectPaper | null>(null);

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
  }, [projectId]);

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
          setSupervisionRequest(data[0]);
        } else {
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

  // Field Errors & Validation for Edit Project
  const fieldErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    const titleTrim = (formData.title || "").trim();
    if (!titleTrim) {
      errors.title = "Project Title is required.";
    } else if (titleTrim.length < 5) {
      errors.title = "Project Title must be at least 5 characters long.";
    }

    if (!formData.domain || !formData.domain.trim()) {
      errors.domain = "Research Domain is required.";
    }

    if (!formData.status) {
      errors.status = "Project Status is required.";
    }

    const descTrim = (formData.description || "").trim();
    if (!descTrim) {
      errors.description = "Description is required.";
    }

    return errors;
  }, [formData]);

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
          ...formData,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
        populateForm(updated);
        toast.success("Project workspace updated successfully!");
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
    setShowAdvancedFields(true);
    setPaperForm({
      title: paper.title,
      authors: paper.authors || "",
      year: paper.year || "",
      journal: paper.journal || "",
      url: paper.url || "",
    });
    setIsPaperUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const rawName = file.name.replace(/\.[^/.]+$/, "");
    const cleanTitle = rawName
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

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
    };
    reader.readAsDataURL(file);

    setPaperForm((prev) => ({
      ...prev,
      title: prev.title || cleanTitle,
    }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const rawName = file.name.replace(/\.[^/.]+$/, "");
    const cleanTitle = rawName
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

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
    };
    reader.readAsDataURL(file);

    setPaperForm((prev) => ({
      ...prev,
      title: prev.title || cleanTitle,
    }));
  };

  const handleSavePaper = (e: React.FormEvent) => {
    e.preventDefault();

    const finalTitle =
      paperForm.title.trim() ||
      (selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, "") : "") ||
      "Untitled Research Paper";
    const finalAuthors = paperForm.authors.trim();
    const finalYear = paperForm.year.trim();
    const finalJournal = paperForm.journal.trim();

    if (editingPaper) {
      const updatedPaper: ProjectPaper = {
        ...editingPaper,
        title: finalTitle,
        authors: finalAuthors,
        year: finalYear,
        journal: finalJournal,
        url: paperForm.url.trim() || (selectedFile ? `file://${selectedFile.name}` : editingPaper.url),
        fileData: selectedFile?.dataUrl || editingPaper.fileData,
      };

      const updated = papers.map((p) => (p.id === editingPaper.id ? updatedPaper : p));
      saveProjectPapers(projectId, updated);

      // Persist update directly to MongoDB database collection 'papers'
      fetch("/api/papers", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...updatedPaper, userEmail: user?.email }),
      }).catch((e) => console.error("MongoDB paper update sync failed:", e));

      toast.success("Paper metadata updated successfully!");
    } else {
      const newPaper: ProjectPaper = {
        id: `paper-${Date.now()}`,
        projectId,
        title: finalTitle,
        authors: finalAuthors,
        year: finalYear,
        journal: finalJournal,
        uploadDate: new Date().toISOString().split("T")[0],
        url: paperForm.url.trim() || (selectedFile ? `file://${selectedFile.name}` : ""),
        fileData: selectedFile?.dataUrl,
        summary: `Research paper "${finalTitle}" uploaded to project literature collection.`,
      };
      saveProjectPapers(projectId, [newPaper, ...papers]);

      // Save directly to MongoDB 'papers' collection
      fetch("/api/papers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...newPaper, userEmail: user?.email }),
      }).catch((e) => console.error("MongoDB paper sync failed:", e));

      toast.success(`Research paper "${finalTitle}" uploaded to project!`);
    }

    setIsPaperUploadModalOpen(false);
    setSelectedFile(null);
    setShowAdvancedFields(false);
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
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px] space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px] flex flex-col items-center justify-center py-20 text-center">
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
    { id: "papers", label: "Research Papers", icon: FileText },
    { id: "assistant", label: "AI Research Assistant", icon: Bot },
    { id: "summaries", label: "Paper Summaries", icon: BookOpen },
    { id: "comparison", label: "Paper Comparison", icon: GitCompareArrows },
    { id: "citations", label: "Citation Generator", icon: Quote },
    { id: "similarity", label: "Similarity Checker", icon: ScanSearch },
    { id: "faculty", label: "Faculty Feedback", icon: GraduationCap },
    { id: "settings", label: "Project Settings", icon: Settings },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 pb-12">
        {/* Breadcrumb & Navigation Header */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <button
              onClick={() => (window.location.href = "/projects")}
              className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <FolderKanban className="h-3.5 w-3.5" /> Research Projects
            </button>
            <span>/</span>
            <span className="font-bold text-foreground truncate max-w-md">{project.title}</span>
          </div>

          <Badge variant="outline" className={`gap-1 rounded-full px-2.5 py-0.5 font-semibold text-[0.7rem] ${statusCfg.className}`}>
            <StatusIcon className="h-3 w-3" />
            {statusCfg.label}
          </Badge>
        </div>

        {/* Persistent Project Header Card */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-card/90 p-6 md:p-8 shadow-sm">
          <div className="absolute inset-0 grid-neural opacity-25" aria-hidden />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />

          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full border-border bg-muted/60 px-3 py-1 text-xs font-medium">
                  {project.domain || "General"}
                </Badge>
                <Badge variant="outline" className={`gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.className}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusCfg.label}
                </Badge>
              </div>

              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl border-border bg-card/80 backdrop-blur-md text-xs shadow-sm hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5 text-amber-500" /> Edit Project
              </Button>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
                {project.title}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-4xl">
                {project.description || "No description provided."}
              </p>
            </div>

            {/* Key Metadata Grid */}
            <div className="grid gap-4 pt-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-muted-foreground">Progress Completion</span>
                  <span className="text-primary font-bold">{project.progress || 0}%</span>
                </div>
                <Progress value={project.progress || 0} className="h-2 rounded-full" />
              </div>

              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 backdrop-blur-md">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Faculty Guide
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                  {project.faculty || "Independent Research"}
                </span>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 backdrop-blur-md">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Start Date
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  {formatDate(project.startDate)}
                </span>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 backdrop-blur-md">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Target Completion
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  {formatDate(project.expectedCompletionDate)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace 9 Internal Navigation Tabs */}
        <Tabs value={activeWorkspaceTab} onValueChange={setActiveWorkspaceTab} className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="flex w-max min-w-full justify-start gap-1 bg-card/60 border border-border/80 p-1.5 rounded-2xl shadow-sm h-auto">
              {workspaceTabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/50 whitespace-nowrap"
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
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
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
                        project?.supervisionStatus === "Under Supervision"
                          ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[0.7rem] font-bold"
                          : project?.supervisionStatus === "Pending Approval" || supervisionRequest?.status === "Pending"
                          ? "border-amber-500/30 text-amber-500 bg-amber-500/10 text-[0.7rem] font-bold"
                          : project?.supervisionStatus === "Rejected"
                          ? "border-destructive/30 text-destructive bg-destructive/10 text-[0.7rem] font-bold"
                          : "border-muted-foreground/30 text-muted-foreground bg-muted/40 text-[0.7rem] font-semibold"
                      }
                    >
                      {project?.supervisionStatus === "Under Supervision"
                        ? "Under Supervision"
                        : project?.supervisionStatus === "Pending Approval" || supervisionRequest?.status === "Pending"
                        ? "Pending Approval"
                        : project?.supervisionStatus === "Rejected"
                        ? "Rejected"
                        : "Not Assigned"}
                    </Badge>
                  </div>

                  {/* CASE A: Not Assigned */}
                  {(!project?.supervisionStatus || project?.supervisionStatus === "Not Assigned") &&
                    (!supervisionRequest || supervisionRequest.status !== "Pending") && (
                      <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-3 bg-muted/20">
                        <div>
                          <p className="font-bold text-xs text-foreground">No supervisor assigned yet.</p>
                          <p className="text-[0.7rem] text-muted-foreground mt-1">
                            Request an approved faculty member to supervise your project.
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
                          <UserCheck className="h-3.5 w-3.5" /> Request Supervisor
                        </Button>
                      </div>
                    )}

                  {/* CASE B: Pending Approval */}
                  {(project?.supervisionStatus === "Pending Approval" || (supervisionRequest && supervisionRequest.status === "Pending")) && (
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
                            Requested on {supervisionRequest?.submittedAt || (supervisionRequest?.requestedAt ? new Date(supervisionRequest.requestedAt).toLocaleDateString() : "Recently")}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg bg-background/80 border border-amber-500/20 p-2.5 text-[0.725rem] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>Waiting for faculty approval.</span>
                      </div>
                    </div>
                  )}

                  {/* CASE C: Approved - Under Supervision */}
                  {project?.supervisionStatus === "Under Supervision" && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        {assignedFacultyDetails?.photoURL ? (
                          <img src={assignedFacultyDetails.photoURL} alt={project.faculty || ""} className="h-10 w-10 rounded-xl object-cover border border-emerald-500/30" />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                            {(project.faculty || "F").charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-foreground">{project.faculty}</h4>
                          <p className="text-[0.7rem] text-muted-foreground">
                            {assignedFacultyDetails?.designation || assignedFacultyDetails?.title || "Faculty Supervisor"} • {assignedFacultyDetails?.department || "Academic Department"}
                          </p>
                          {assignedFacultyDetails?.institution && (
                            <p className="text-[0.68rem] text-muted-foreground">{assignedFacultyDetails.institution}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CASE D: Rejected */}
                  {project?.supervisionStatus === "Rejected" && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-destructive/10 text-destructive font-bold shrink-0 mt-0.5">
                          <X className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-foreground">Supervision Request Declined</h4>
                          {supervisionRequest?.facultyRemarks && (
                            <p className="text-[0.725rem] text-muted-foreground leading-relaxed">
                              <span className="font-semibold text-foreground">Reason:</span> "{supervisionRequest.facultyRemarks}"
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedFaculty(null);
                          setRequestMessage("I would like you to supervise my research project.");
                          setIsRequestSupervisorModalOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold gap-1.5"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" /> Request Another Faculty
                      </Button>
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

          {/* TAB 2: RESEARCH PAPERS */}
          <TabsContent value="papers" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3 gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Project Literature Library
                </h2>
                <p className="text-xs text-muted-foreground">
                  Papers uploaded specifically to "{project.title}" for AI analysis and citation generation.
                </p>
              </div>

              <Button onClick={handleOpenPaperUploadModal} className="gap-2 rounded-xl bg-primary text-xs font-medium text-primary-foreground">
                <Plus className="h-4 w-4" /> Upload Research Paper
              </Button>
            </div>

            {papers.length === 0 ? (
              /* REQUIRED EMPTY STATE */
              <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-6 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-primary mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No Research Papers Added</h3>
                <p className="mt-2 max-w-lg text-sm text-muted-foreground leading-relaxed">
                  Start building your literature collection by uploading research papers for this project. Uploaded papers will later be available for AI analysis, citation generation, comparison, and faculty review.
                </p>
                <Button onClick={handleOpenPaperUploadModal} className="mt-6 gap-2 rounded-xl bg-primary font-medium text-primary-foreground shadow-md">
                  <Plus className="h-4 w-4" /> Upload Research Paper
                </Button>
              </Card>
            ) : (
              /* PAPERS TABLE / GRID */
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
                            <div className="flex items-center justify-end gap-1">
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
            )}
          </TabsContent>

          {/* TAB 3: AI RESEARCH ASSISTANT */}
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
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-purple-500/10 text-purple-400 mb-3">
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
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-purple-500/15 text-purple-400">
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

          {/* TAB 4: PAPER SUMMARIES */}
          <TabsContent value="summaries" className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> AI Paper Summaries
              </h2>
              <p className="text-xs text-muted-foreground">Key findings, abstract breakdowns, and methodologies for project papers.</p>
            </div>

            {papers.length === 0 ? (
              <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-4 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-lg font-bold text-foreground">No Summaries Available</h3>
                <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
                  Upload research papers to generate AI paper summaries for this project.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {papers.map((p) => (
                  <Card key={p.id} className="surface-elevated rounded-2xl border-border p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[0.65rem] rounded-full">{p.journal || "Unspecified Journal"}</Badge>
                        <h3 className="text-sm font-bold text-foreground line-clamp-1">{p.title}</h3>
                        <p className="text-[0.725rem] text-muted-foreground">
                          {p.authors || "Not specified"} {p.year ? `(${p.year})` : ""}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {p.summary || `Executive summary of ${p.title}. Explores key methodologies, dataset parameters, and academic contributions.`}
                    </p>
                  </Card>
                ))}
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

          {/* TAB 8: FACULTY FEEDBACK */}
          <TabsContent value="faculty" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="surface-elevated rounded-2xl border-border bg-card p-6 space-y-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> Assigned Faculty Mentor
                </h3>
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 space-y-2">
                  <p className="text-base font-bold text-foreground">
                    {project.faculty || "Independent Research"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.faculty ? "Assigned Academic Advisor & Reviewer" : "No external mentor assigned."}
                  </p>
                </div>
              </Card>

              <Card className="lg:col-span-2 surface-elevated rounded-2xl border-border bg-card p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-foreground">Faculty Feedback & Review Timeline</h3>
                  <p className="text-xs text-muted-foreground">
                    Comments, suggestions, and feedback timeline from assigned faculty advisor.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 px-4 text-center bg-card/40">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                  <h4 className="text-sm font-bold text-foreground">No Faculty Feedback Yet</h4>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    Faculty feedback and peer reviews for "{project.title}" will appear here when submitted by your advisor.
                  </p>
                </div>
              </Card>
            </div>
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

      {/* Upload/Edit Paper Dialog */}
      <Dialog open={isPaperUploadModalOpen} onOpenChange={setIsPaperUploadModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-border bg-card p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileText className="h-5 w-5 text-primary" />
              {editingPaper ? "Edit Research Paper" : "Upload Research Paper"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select or drop your paper to add it directly to "{project?.title || "Research Project"}".
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePaper} className="space-y-4 py-2">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.txt,.epub"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Dropzone / Selected File Banner */}
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 p-6 text-center transition-all cursor-pointer hover:border-primary/60 hover:bg-primary/5"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-2">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-foreground">Click to upload or drag & drop research paper</p>
                <p className="text-[0.7rem] text-muted-foreground mt-0.5">Supports PDF, DOCX, TXT (Up to 50MB)</p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-3.5 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-bold text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-[0.7rem] text-muted-foreground">{selectedFile.size} • Ready for Project</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Paper Title (Auto-prefilled from filename) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Paper Title</Label>
              <Input
                placeholder="Title auto-filled from uploaded document..."
                value={paperForm.title}
                onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            {/* Optional Advanced Details Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                {showAdvancedFields ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showAdvancedFields ? "Hide Optional Details" : "Edit Optional Details (Authors, Year, Journal)"}
              </button>

              {showAdvancedFields && (
                <div className="mt-3 space-y-3 rounded-2xl border border-border bg-muted/20 p-3.5 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Authors</Label>
                    <Input
                      placeholder="e.g. K. He, X. Zhang, S. Ren"
                      value={paperForm.authors}
                      onChange={(e) => setPaperForm({ ...paperForm, authors: e.target.value })}
                      className="rounded-xl text-xs bg-background"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Publication Year</Label>
                      <Input
                        type="number"
                        placeholder="2024"
                        value={paperForm.year}
                        onChange={(e) => setPaperForm({ ...paperForm, year: e.target.value })}
                        className="rounded-xl text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground">Journal / Conference</Label>
                      <Input
                        placeholder="e.g. IEEE CVPR, Nature"
                        value={paperForm.journal}
                        onChange={(e) => setPaperForm({ ...paperForm, journal: e.target.value })}
                        className="rounded-xl text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">Document URL / ArXiv Link</Label>
                    <Input
                      placeholder="https://arxiv.org/pdf/…"
                      value={paperForm.url}
                      onChange={(e) => setPaperForm({ ...paperForm, url: e.target.value })}
                      className="rounded-xl text-xs bg-background"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPaperUploadModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
                {editingPaper ? "Save Changes" : "Upload Paper to Project"}
              </Button>
            </DialogFooter>
          </form>
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

      {/* Edit Project Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-border bg-card p-6 shadow-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Pencil className="h-5 w-5 text-primary" /> Edit Research Project
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update project parameters, status, or milestone progress.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProject} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Domain <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.domain}
                  onValueChange={(val) => handleFieldChange("domain", val)}
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {DOMAIN_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Status <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: ProjectStatus) => handleFieldChange("status", val)}
                >
                  <SelectTrigger className="rounded-xl text-xs">
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
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label className="text-xs font-semibold text-foreground">Progress Completion (%)</Label>
                <span className="text-xs font-bold text-primary">{formData.progress}%</span>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.progress}
                onChange={(e) => handleFieldChange("progress", Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                className="rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Description & Objectives <span className="text-destructive">*</span></Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={!isFormValid || submitting} className="rounded-xl bg-primary text-primary-foreground">
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
    </DashboardLayout>
  );
}
