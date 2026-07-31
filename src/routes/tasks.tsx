import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  CheckSquare,
  StickyNote,
  Plus,
  Search,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  FolderKanban,
  Kanban,
  List,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  Pin,
  Archive,
  Tag,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks & Notes — ScholarNexus AI" },
      { name: "description", content: "Organize research to-dos, deadlines, and project notes in one place." },
    ],
  }),
  component: TasksAndNotesPage,
});

interface TaskItem {
  id: string;
  _id?: string;
  userEmail: string;
  title: string;
  description?: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "To Do" | "In Progress" | "Completed";
  dueDate: string;
  projectId?: string;
  projectTitle?: string;
  createdAt: string;
}

interface NoteItem {
  id: string;
  _id?: string;
  userEmail: string;
  title: string;
  content: string;
  category: "General" | "Literature Synthesis" | "Methodology" | "Ideas" | "Meeting";
  pinned: boolean;
  archived: boolean;
  tags?: string[];
  projectId?: string;
  projectTitle?: string;
  updatedAt: string;
}

interface ProjectOption {
  id: string;
  title: string;
}

function TasksAndNotesPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") return getUserSession();
    return null;
  });

  const [activeSection, setActiveSection] = useState<"tasks" | "notes">("tasks");

  // TASKS STATE
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [taskProjectFilter, setTaskProjectFilter] = useState("All");

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "Medium" as TaskItem["priority"],
    status: "To Do" as TaskItem["status"],
    dueDate: todayStr,
    projectId: "none",
  });
  const [submittingTask, setSubmittingTask] = useState(false);

  // NOTES STATE
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [selectedNoteCategory, setSelectedNoteCategory] = useState("All");
  const [showArchivedNotes, setShowArchivedNotes] = useState(false);
  const [noteProjectFilter, setNoteProjectFilter] = useState("All");

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    category: "General" as NoteItem["category"],
    pinned: false,
    tagsInput: "",
    projectId: "none",
  });
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setUser(session);

    // Check URL parameters for tab
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "notes") {
      setActiveSection("notes");
    }

    fetchAllData(session.email);
  }, []);

  const fetchAllData = async (email: string) => {
    setTasksLoading(true);
    setNotesLoading(true);
    try {
      const [tasksRes, notesRes, projRes] = await Promise.all([
        fetch(`/api/tasks?email=${encodeURIComponent(email)}`),
        fetch(`/api/notes?email=${encodeURIComponent(email)}`),
        fetch(`/api/projects?email=${encodeURIComponent(email)}`),
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (notesRes.ok) setNotes(await notesRes.json());
      if (projRes.ok) {
        const projData = await projRes.json();
        if (Array.isArray(projData)) {
          setProjects(projData.map((p: any) => ({ id: p.id || p._id, title: p.title })));
        }
      }
    } catch {
      toast.error("Failed to load workspace data.");
    } finally {
      setTasksLoading(false);
      setNotesLoading(false);
    }
  };

  /* ── TASK HANDLERS ── */
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: "",
      description: "",
      priority: "Medium",
      status: "To Do",
      dueDate: todayStr,
      projectId: "none",
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || todayStr,
      projectId: task.projectId || "none",
    });
    setIsTaskModalOpen(true);
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !taskForm.title.trim()) {
      toast.error("Task title is required.");
      return;
    }

    // DATE VALIDATION: Ensure due date is NOT in the past
    if (taskForm.dueDate < todayStr) {
      toast.error("Task due date cannot be in the past. Please select today or a future date.");
      return;
    }

    setSubmittingTask(true);
    try {
      const selectedProj = projects.find((p) => p.id === taskForm.projectId);
      const payload = {
        id: editingTask ? editingTask.id || editingTask._id : undefined,
        userEmail: user.email,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        status: taskForm.status,
        dueDate: taskForm.dueDate,
        projectId: taskForm.projectId === "none" ? "" : taskForm.projectId,
        projectTitle: selectedProj ? selectedProj.title : "",
      };

      const res = await fetch("/api/tasks", {
        method: editingTask ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingTask ? "Task updated!" : "Task created successfully!");
        setIsTaskModalOpen(false);
        fetchAllData(user.email);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save task.");
      }
    } catch {
      toast.error("Error saving task.");
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleTaskStatusChange = async (task: TaskItem, newStatus: TaskItem["status"]) => {
    if (!user) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id || task._id,
          userEmail: user.email,
          status: newStatus,
        }),
      });
      if (res.ok) {
        toast.success(`Task moved to ${newStatus}`);
        fetchAllData(user.email);
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDeleteTask = async () => {
    if (!user || !deletingTaskId) return;
    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(deletingTaskId)}&email=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Task deleted.");
        setDeletingTaskId(null);
        fetchAllData(user.email);
      }
    } catch {
      toast.error("Failed to delete task.");
    }
  };

  /* ── NOTE HANDLERS ── */
  const handleOpenCreateNote = () => {
    setEditingNote(null);
    setNoteForm({
      title: "",
      content: "",
      category: "General",
      pinned: false,
      tagsInput: "",
      projectId: "none",
    });
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNote = (note: NoteItem) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content || "",
      category: note.category || "General",
      pinned: note.pinned,
      tagsInput: note.tags ? note.tags.join(", ") : "",
      projectId: note.projectId || "none",
    });
    setIsNoteModalOpen(true);
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !noteForm.title.trim()) {
      toast.error("Note title is required.");
      return;
    }

    setSubmittingNote(true);
    try {
      const selectedProj = projects.find((p) => p.id === noteForm.projectId);
      const tagsArray = noteForm.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        id: editingNote ? editingNote.id || editingNote._id : undefined,
        userEmail: user.email,
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        category: noteForm.category,
        pinned: noteForm.pinned,
        tags: tagsArray,
        projectId: noteForm.projectId === "none" ? "" : noteForm.projectId,
        projectTitle: selectedProj ? selectedProj.title : "",
      };

      const res = await fetch("/api/notes", {
        method: editingNote ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingNote ? "Note updated!" : "Note authored successfully!");
        setIsNoteModalOpen(false);
        fetchAllData(user.email);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save note.");
      }
    } catch {
      toast.error("Error saving note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleTogglePinNote = async (note: NoteItem) => {
    if (!user) return;
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: note.id || note._id,
          userEmail: user.email,
          pinned: !note.pinned,
        }),
      });
      if (res.ok) {
        toast.success(note.pinned ? "Note unpinned" : "Note pinned to top");
        fetchAllData(user.email);
      }
    } catch {
      toast.error("Failed to pin note.");
    }
  };

  const handleToggleArchiveNote = async (note: NoteItem) => {
    if (!user) return;
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: note.id || note._id,
          userEmail: user.email,
          archived: !note.archived,
        }),
      });
      if (res.ok) {
        toast.success(note.archived ? "Note restored" : "Note archived");
        fetchAllData(user.email);
      }
    } catch {
      toast.error("Failed to archive note.");
    }
  };

  const handleDeleteNote = async () => {
    if (!user || !deletingNoteId) return;
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(deletingNoteId)}&email=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Note deleted.");
        setDeletingNoteId(null);
        fetchAllData(user.email);
      }
    } catch {
      toast.error("Failed to delete note.");
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(taskSearchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;
      const matchesProject = taskProjectFilter === "All" || t.projectId === taskProjectFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  }, [tasks, taskSearchQuery, statusFilter, priorityFilter, taskProjectFilter]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesArchived = showArchivedNotes ? n.archived : !n.archived;
      const matchesCategory = selectedNoteCategory === "All" || n.category === selectedNoteCategory;
      const matchesProject = noteProjectFilter === "All" || n.projectId === noteProjectFilter;
      const matchesSearch =
        n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(noteSearchQuery.toLowerCase())));
      return matchesArchived && matchesCategory && matchesProject && matchesSearch;
    });
  }, [notes, showArchivedNotes, selectedNoteCategory, noteProjectFilter, noteSearchQuery]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === "To Do").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const urgent = tasks.filter((t) => t.priority === "Urgent" && t.status !== "Completed").length;
    return { total, todo, inProgress, completed, urgent };
  }, [tasks]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <Badge className="bg-destructive/15 text-destructive border-none font-semibold text-[0.65rem] gap-1"><AlertTriangle className="h-3 w-3" /> Urgent</Badge>;
      case "High":
        return <Badge className="bg-amber-500/15 text-amber-400 border-none font-semibold text-[0.65rem]">High</Badge>;
      case "Medium":
        return <Badge className="bg-blue-500/15 text-blue-400 border-none font-semibold text-[0.65rem]">Medium</Badge>;
      default:
        return <Badge className="bg-slate-500/15 text-slate-400 border-none font-semibold text-[0.65rem]">Low</Badge>;
    }
  };

  const getStatusBadge = (status: TaskItem["status"]) => {
    switch (status) {
      case "Completed":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-[0.65rem] gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Completed
          </Badge>
        );
      case "In Progress":
        return (
          <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold text-[0.65rem] gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" /> In Progress
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/15 text-slate-400 border border-slate-500/30 font-semibold text-[0.65rem]">
            To Do
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
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
      <div className="mx-auto flex max-w-[1350px] flex-col gap-6 pb-12">
        {/* Header & Section Switcher */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
              Research Operations Hub
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Tasks & Research Notes
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Manage your action items, deadlines, annotations, and hypotheses in one unified workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeSection === "tasks" ? (
              <Button onClick={handleOpenCreateTask} className="gap-2 rounded-xl bg-primary text-xs font-semibold shadow-md">
                <Plus className="h-4 w-4" /> Add Task
              </Button>
            ) : (
              <Button onClick={handleOpenCreateNote} className="gap-2 rounded-xl bg-primary text-xs font-semibold shadow-md">
                <Plus className="h-4 w-4" /> Author Note
              </Button>
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <Tabs value={activeSection} onValueChange={(val: any) => setActiveSection(val)} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full bg-card border border-border p-1.5 rounded-2xl shadow-sm h-auto">
            <TabsTrigger value="tasks" className="rounded-xl py-2.5 text-xs font-bold gap-2">
              <CheckSquare className="h-4 w-4" /> Tasks & To-Dos ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="rounded-xl py-2.5 text-xs font-bold gap-2">
              <StickyNote className="h-4 w-4" /> Research Notes ({notes.length})
            </TabsTrigger>
          </TabsList>

          {/* SECTION 1: TASKS & TO-DOS */}
          <TabsContent value="tasks" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card className="surface-elevated rounded-2xl border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Total Tasks</span>
                  <CheckSquare className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{taskStats.total}</p>
              </Card>

              <Card className="surface-elevated rounded-2xl border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">To Do</span>
                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{taskStats.todo}</p>
              </Card>

              <Card className="surface-elevated rounded-2xl border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">In Progress</span>
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{taskStats.inProgress}</p>
              </Card>

              <Card className="surface-elevated rounded-2xl border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Completed</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{taskStats.completed}</p>
              </Card>

              <Card className="surface-elevated rounded-2xl border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Urgent Active</span>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-2xl font-bold text-destructive mt-2">{taskStats.urgent}</p>
              </Card>
            </div>

            {/* Filter Bar */}
            <Card className="surface-elevated rounded-2xl border-border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    placeholder="Search tasks by title or description…"
                    className="pl-9 rounded-xl text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
                    <Button
                      variant={viewMode === "kanban" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("kanban")}
                      className="h-7 rounded-lg text-xs gap-1"
                    >
                      <Kanban className="h-3.5 w-3.5" /> Board
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="h-7 rounded-lg text-xs gap-1"
                    >
                      <List className="h-3.5 w-3.5" /> List
                    </Button>
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px] rounded-xl text-xs h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="All" className="text-xs">All Statuses</SelectItem>
                      <SelectItem value="To Do" className="text-xs">To Do</SelectItem>
                      <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                      <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[120px] rounded-xl text-xs h-9">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="All" className="text-xs">All Priorities</SelectItem>
                      <SelectItem value="Urgent" className="text-xs">Urgent</SelectItem>
                      <SelectItem value="High" className="text-xs">High</SelectItem>
                      <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                      <SelectItem value="Low" className="text-xs">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  {projects.length > 0 && (
                    <Select value={taskProjectFilter} onValueChange={setTaskProjectFilter}>
                      <SelectTrigger className="w-[150px] rounded-xl text-xs h-9">
                        <SelectValue placeholder="Project Link" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="All" className="text-xs">All Projects</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs truncate max-w-[180px]">
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </Card>

            {/* Task Display */}
            {tasksLoading ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-xs text-muted-foreground">Loading tasks…</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card className="surface-elevated rounded-2xl border-dashed border-border py-16 text-center space-y-4">
                <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">No Tasks Found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    No tasks match your criteria. Add a task to start tracking action items.
                  </p>
                </div>
                <Button onClick={handleOpenCreateTask} className="gap-2 rounded-xl bg-primary text-xs font-semibold">
                  <Plus className="h-4 w-4" /> Create First Task
                </Button>
              </Card>
            ) : viewMode === "list" ? (
              <Card className="surface-elevated rounded-2xl border-border bg-card overflow-hidden">
                <div className="p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Unified Action Items Stream</span>
                  </div>
                  <Badge variant="outline" className="rounded-full text-[0.65rem] border-primary/30 text-primary font-semibold">
                    {filteredTasks.length} {filteredTasks.length === 1 ? "Task" : "Tasks"}
                  </Badge>
                </div>

                <div className="divide-y divide-border/60">
                  {filteredTasks.map((task) => {
                    const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== "Completed";
                    return (
                      <div
                        key={task.id || task._id}
                        className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            onClick={() =>
                              handleTaskStatusChange(
                                task,
                                task.status === "Completed"
                                  ? "To Do"
                                  : task.status === "To Do"
                                  ? "In Progress"
                                  : "Completed"
                              )
                            }
                            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-lg border transition-all ${
                              task.status === "Completed"
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                : task.status === "In Progress"
                                ? "bg-blue-500/10 border-blue-500 text-blue-400"
                                : "border-border hover:border-primary"
                            }`}
                            title={`Current: ${task.status}. Click to cycle status.`}
                          >
                            {task.status === "Completed" && <CheckCircle2 className="h-4 w-4" />}
                            {task.status === "In Progress" && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                          </button>

                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-xs font-bold text-foreground ${
                                  task.status === "Completed" ? "line-through text-muted-foreground" : ""
                                }`}
                              >
                                {task.title}
                              </span>
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                              {isOverdue && (
                                <Badge className="bg-destructive/15 text-destructive border-none font-semibold text-[0.65rem] gap-1">
                                  <AlertCircle className="h-3 w-3" /> Overdue ({task.dueDate})
                                </Badge>
                              )}
                            </div>

                            {task.description && (
                              <p className="text-[0.725rem] text-muted-foreground leading-relaxed line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {task.projectTitle && (
                              <span className="inline-flex items-center gap-1 text-[0.65rem] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                <FolderKanban className="h-3 w-3" /> {task.projectTitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground justify-between sm:justify-end shrink-0">
                          <div className="flex items-center gap-1.5 text-[0.7rem] bg-muted/40 px-2.5 py-1 rounded-xl border border-border/60">
                            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                            <span>{task.dueDate}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Select
                              value={task.status}
                              onValueChange={(newStatus: any) => handleTaskStatusChange(task, newStatus)}
                            >
                              <SelectTrigger className="h-7 w-[105px] rounded-lg text-[0.7rem] border-border bg-background">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="To Do" className="text-xs">To Do</SelectItem>
                                <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                                <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditTask(task)} className="h-7 w-7 rounded-lg">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingTaskId(task.id || task._id || null)}
                              className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {(["To Do", "In Progress", "Completed"] as const).map((columnStatus) => {
                  const columnTasks = filteredTasks.filter((t) => t.status === columnStatus);
                  return (
                    <div key={columnStatus} className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${
                              columnStatus === "To Do"
                                ? "bg-slate-400"
                                : columnStatus === "In Progress"
                                ? "bg-blue-500 animate-pulse"
                                : "bg-emerald-500"
                            }`}
                          />
                          <h3 className="text-xs font-bold text-foreground">{columnStatus}</h3>
                        </div>
                        <Badge variant="outline" className="rounded-full text-[0.65rem] border-border">
                          {columnTasks.length}
                        </Badge>
                      </div>

                      <div className="space-y-3 min-h-[300px]">
                        {columnTasks.map((task) => (
                          <Card
                            key={task.id || task._id}
                            className="surface-elevated rounded-2xl border-border bg-card p-4 hover:border-primary/50 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                                {task.title}
                              </h4>
                              {getPriorityBadge(task.priority)}
                            </div>

                            {task.description && (
                              <p className="text-[0.725rem] text-muted-foreground leading-relaxed line-clamp-3">
                                {task.description}
                              </p>
                            )}

                            {task.projectTitle && (
                              <div className="flex items-center gap-1.5 text-[0.68rem] text-primary font-medium">
                                <FolderKanban className="h-3 w-3" />
                                <span className="truncate">{task.projectTitle}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[0.68rem] text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3 text-primary" />
                                <span>{task.dueDate}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditTask(task)}
                                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="Edit Task"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingTaskId(task.id || task._id || null)}
                                  className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  title="Delete Task"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* SECTION 2: RESEARCH NOTES */}
          <TabsContent value="notes" className="space-y-6">
            <Card className="surface-elevated rounded-2xl border-border bg-card p-4 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={noteSearchQuery}
                    onChange={(e) => setNoteSearchQuery(e.target.value)}
                    placeholder="Search notes by title, content, or tags…"
                    className="pl-9 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={showArchivedNotes ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowArchivedNotes(!showArchivedNotes)}
                    className="h-9 rounded-xl text-xs gap-1.5"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    {showArchivedNotes ? "Viewing Archive" : "Archived Notes"}
                  </Button>

                  {projects.length > 0 && (
                    <Select value={noteProjectFilter} onValueChange={setNoteProjectFilter}>
                      <SelectTrigger className="w-[160px] rounded-xl text-xs h-9">
                        <SelectValue placeholder="Project Link" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="All" className="text-xs">All Projects</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs truncate max-w-[180px]">
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(["All", "Literature Synthesis", "Methodology", "Ideas", "Meeting", "General"] as const).map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedNoteCategory === cat ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedNoteCategory(cat)}
                    className={`rounded-xl text-xs h-8 px-3 ${
                      selectedNoteCategory === cat ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </Card>

            {notesLoading ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-xs text-muted-foreground">Loading research notes…</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <Card className="surface-elevated rounded-2xl border-dashed border-border py-16 text-center space-y-4">
                <StickyNote className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">No Notes Found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {showArchivedNotes ? "No archived notes found." : "No notes match your criteria."}
                  </p>
                </div>
                <Button onClick={handleOpenCreateNote} className="gap-2 rounded-xl bg-primary text-xs font-semibold">
                  <Plus className="h-4 w-4" /> Author Note
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note) => (
                  <Card
                    key={note.id || note._id}
                    className={`surface-elevated flex flex-col justify-between rounded-2xl border bg-card p-5 transition-all hover:border-primary/50 ${
                      note.pinned ? "border-amber-500/50 bg-amber-500/5" : "border-border"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="rounded-full text-[0.65rem] border-primary/30 text-primary font-semibold">
                          {note.category}
                        </Badge>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTogglePinNote(note)}
                            className={`p-1 rounded-lg transition-colors ${
                              note.pinned ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:text-foreground"
                            }`}
                            title={note.pinned ? "Unpin Note" : "Pin Note"}
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleOpenEditNote(note)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleToggleArchiveNote(note)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeletingNoteId(note.id || note._id || null)} className="p-1 rounded-lg text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{note.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-4">{note.content}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/60 mt-4 space-y-2">
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[0.65rem] text-muted-foreground font-medium">
                              <Tag className="h-2.5 w-2.5" /> {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground">
                        {note.projectTitle ? (
                          <span className="inline-flex items-center gap-1 text-primary font-medium truncate max-w-[160px]">
                            <FolderKanban className="h-3 w-3 shrink-0" /> {note.projectTitle}
                          </span>
                        ) : (
                          <span>General Note</span>
                        )}
                        <span>Updated {formatDate(note.updatedAt)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* CREATE / EDIT TASK DIALOG */}
        <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
          <DialogContent className="rounded-2xl sm:max-w-lg border-border bg-card p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editingTask ? "Edit Research Task" : "Create New Task"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set priority, due date, and optional project linkage for this task.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitTask} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Task Title <span className="text-destructive">*</span></Label>
                <Input
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Conduct literature search on Transformer architectures"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Key sub-steps, methodologies, or notes…"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Priority Level</Label>
                  <Select value={taskForm.priority} onValueChange={(val: any) => setTaskForm({ ...taskForm, priority: val })}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Low" className="text-xs">Low</SelectItem>
                      <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                      <SelectItem value="High" className="text-xs">High</SelectItem>
                      <SelectItem value="Urgent" className="text-xs">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Status</Label>
                  <Select value={taskForm.status} onValueChange={(val: any) => setTaskForm({ ...taskForm, status: val })}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="To Do" className="text-xs">To Do</SelectItem>
                      <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                      <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Due Date (Must be today or future)</Label>
                  <Input
                    type="date"
                    min={todayStr}
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                  {taskForm.dueDate < todayStr && (
                    <p className="text-[0.7rem] text-destructive flex items-center gap-1 font-medium mt-0.5">
                      <AlertCircle className="h-3 w-3" /> Due date cannot be in the past.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Link to Research Project</Label>
                  <Select value={taskForm.projectId} onValueChange={(val) => setTaskForm({ ...taskForm, projectId: val })}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Optional project link" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none" className="text-xs">No Project (General)</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs truncate max-w-[200px]">
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingTask} className="rounded-xl text-xs font-semibold bg-primary">
                  {submittingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTask ? "Save Changes" : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* CREATE / EDIT NOTE DIALOG */}
        <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
          <DialogContent className="rounded-2xl sm:max-w-lg border-border bg-card p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editingNote ? "Edit Note" : "Author New Research Note"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Document research ideas, meeting summaries, or literature synthesis.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitNote} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Note Title <span className="text-destructive">*</span></Label>
                <Input
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="e.g. Synthesis of Empirical Findings in Paper X"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select value={noteForm.category} onValueChange={(val: any) => setNoteForm({ ...noteForm, category: val })}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="General" className="text-xs">General</SelectItem>
                      <SelectItem value="Literature Synthesis" className="text-xs">Literature Synthesis</SelectItem>
                      <SelectItem value="Methodology" className="text-xs">Methodology</SelectItem>
                      <SelectItem value="Ideas" className="text-xs">Ideas & Hypotheses</SelectItem>
                      <SelectItem value="Meeting" className="text-xs">Meeting Notes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Link to Research Project</Label>
                  <Select value={noteForm.projectId} onValueChange={(val) => setNoteForm({ ...noteForm, projectId: val })}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Optional project link" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none" className="text-xs">No Project (General)</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs truncate max-w-[200px]">
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Note Content</Label>
                <Textarea
                  rows={5}
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="Write detailed notes, citations, or annotations here…"
                  className="rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tags (comma separated)</Label>
                <Input
                  value={noteForm.tagsInput}
                  onChange={(e) => setNoteForm({ ...noteForm, tagsInput: e.target.value })}
                  placeholder="e.g. transformers, attention, empirical, draft"
                  className="rounded-xl text-xs"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsNoteModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingNote} className="rounded-xl text-xs font-semibold bg-primary">
                  {submittingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : editingNote ? "Save Note" : "Author Note"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DELETE CONFIRMATIONS */}
        <AlertDialog open={Boolean(deletingTaskId)} onOpenChange={(open) => !open && setDeletingTaskId(null)}>
          <AlertDialogContent className="rounded-2xl border-border bg-card p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold text-foreground">Delete Research Task?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                This action cannot be undone. The task will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-4">
              <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTask} className="rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold">
                Delete Task
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={Boolean(deletingNoteId)} onOpenChange={(open) => !open && setDeletingNoteId(null)}>
          <AlertDialogContent className="rounded-2xl border-border bg-card p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold text-foreground">Delete Research Note?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                This action cannot be undone. The note will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-4">
              <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteNote} className="rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold">
                Delete Note
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
