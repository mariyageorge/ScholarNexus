import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  Archive,
  FolderKanban,
  Pencil,
  Trash2,
  Tag,
  Loader2,
  BookOpen,
  Filter,
  Check,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Research Notes — ScholarNexus AI" },
      { name: "description", content: "Capture annotations, literature synthesis, and project ideas." },
    ],
  }),
  component: NotesPage,
});

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

function NotesPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") return getUserSession();
    return null;
  });

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showArchived, setShowArchived] = useState(false);
  const [projectFilter, setProjectFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    title: "",
    content: "",
    category: "General" as NoteItem["category"],
    pinned: false,
    tagsInput: "",
    projectId: "none",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setUser(session);
    fetchData(session.email);
  }, []);

  const fetchData = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }

      const projRes = await fetch(`/api/projects?email=${encodeURIComponent(email)}`);
      if (projRes.ok) {
        const projData = await projRes.json();
        if (Array.isArray(projData)) {
          setProjects(projData.map((p: any) => ({ id: p.id || p._id, title: p.title })));
        }
      }
    } catch {
      toast.error("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingNote(null);
    setFormState({
      title: "",
      content: "",
      category: "General",
      pinned: false,
      tagsInput: "",
      projectId: "none",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: NoteItem) => {
    setEditingNote(note);
    setFormState({
      title: note.title,
      content: note.content || "",
      category: note.category || "General",
      pinned: note.pinned,
      tagsInput: note.tags ? note.tags.join(", ") : "",
      projectId: note.projectId || "none",
    });
    setIsModalOpen(true);
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formState.title.trim()) {
      toast.error("Note title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedProj = projects.find((p) => p.id === formState.projectId);
      const tagsArray = formState.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        id: editingNote ? editingNote.id || editingNote._id : undefined,
        userEmail: user.email,
        title: formState.title.trim(),
        content: formState.content.trim(),
        category: formState.category,
        pinned: formState.pinned,
        tags: tagsArray,
        projectId: formState.projectId === "none" ? "" : formState.projectId,
        projectTitle: selectedProj ? selectedProj.title : "",
      };

      const url = "/api/notes";
      const method = editingNote ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingNote ? "Note updated!" : "Note authored successfully!");
        setIsModalOpen(false);
        fetchData(user.email);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save note.");
      }
    } catch {
      toast.error("Error saving note.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (note: NoteItem) => {
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
        fetchData(user.email);
      }
    } catch {
      toast.error("Failed to pin note.");
    }
  };

  const handleToggleArchive = async (note: NoteItem) => {
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
        fetchData(user.email);
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
        fetchData(user.email);
      }
    } catch {
      toast.error("Failed to delete note.");
    }
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesArchived = showArchived ? n.archived : !n.archived;
      const matchesCategory = selectedCategory === "All" || n.category === selectedCategory;
      const matchesProject = projectFilter === "All" || n.projectId === projectFilter;
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesArchived && matchesCategory && matchesProject && matchesSearch;
    });
  }, [notes, showArchived, selectedCategory, projectFilter, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: 0, General: 0, "Literature Synthesis": 0, Methodology: 0, Ideas: 0, Meeting: 0 };
    notes.forEach((n) => {
      if (!n.archived) {
        counts.All += 1;
        if (counts[n.category] !== undefined) counts[n.category] += 1;
      }
    });
    return counts;
  }, [notes]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getCategoryBadge = (category: NoteItem["category"]) => {
    switch (category) {
      case "Literature Synthesis":
        return <Badge variant="outline" className="rounded-full text-[0.65rem] border-purple-500/40 text-purple-400 font-semibold bg-purple-500/10">Literature Synthesis</Badge>;
      case "Methodology":
        return <Badge variant="outline" className="rounded-full text-[0.65rem] border-blue-500/40 text-blue-400 font-semibold bg-blue-500/10">Methodology</Badge>;
      case "Ideas":
        return <Badge variant="outline" className="rounded-full text-[0.65rem] border-amber-500/40 text-amber-400 font-semibold bg-amber-500/10">Ideas</Badge>;
      case "Meeting":
        return <Badge variant="outline" className="rounded-full text-[0.65rem] border-emerald-500/40 text-emerald-400 font-semibold bg-emerald-500/10">Meeting</Badge>;
      default:
        return <Badge variant="outline" className="rounded-full text-[0.65rem] border-slate-500/40 text-slate-400 font-semibold bg-slate-500/10">General</Badge>;
    }
  };

  if (typeof window !== "undefined" && !user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1350px] flex-col gap-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
              Research Knowledge Base
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Research Notes & Annotations
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Capture hypotheses, literature syntheses, meeting annotations, and project ideas.
            </p>
          </div>

          <Button onClick={handleOpenCreate} className="gap-2 rounded-xl bg-primary text-xs font-semibold shadow-md">
            <Plus className="h-4 w-4" /> Author New Note
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <Card className="surface-elevated rounded-2xl border-border bg-card p-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes by title, content, or tags…"
                className="pl-9 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={showArchived ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="h-9 rounded-xl text-xs gap-1.5"
              >
                <Archive className="h-3.5 w-3.5" />
                {showArchived ? "Viewing Archive" : "Archived Notes"}
              </Button>

              {projects.length > 0 && (
                <Select value={projectFilter} onValueChange={setProjectFilter}>
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

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(["All", "Literature Synthesis", "Methodology", "Ideas", "Meeting", "General"] as const).map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl text-xs h-8 px-3 ${
                  selectedCategory === cat ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                {cat} {categoryCounts[cat] !== undefined && <span className="ml-1 opacity-70">({categoryCounts[cat]})</span>}
              </Button>
            ))}
          </div>
        </Card>

        {/* NOTES GRID */}
        {loading ? (
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
                {showArchived
                  ? "There are no archived notes."
                  : "No notes match your filter or search criteria. Create a note to start annotating."}
              </p>
            </div>
            <Button onClick={handleOpenCreate} className="gap-2 rounded-xl bg-primary text-xs font-semibold">
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
                    {getCategoryBadge(note.category)}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(note)}
                        className={`p-1 rounded-lg transition-colors ${
                          note.pinned ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={note.pinned ? "Unpin Note" : "Pin Note"}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(note)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Edit Note"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleArchive(note)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                        title={note.archived ? "Restore Note" : "Archive Note"}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingNoteId(note.id || note._id || null)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive"
                        title="Delete Note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                      {note.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-4">
                      {note.content}
                    </p>
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

        {/* CREATE / EDIT NOTE DIALOG */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="e.g. Synthesis of Empirical Findings in Paper X"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select
                    value={formState.category}
                    onValueChange={(val: any) => setFormState({ ...formState, category: val })}
                  >
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
                  <Select
                    value={formState.projectId}
                    onValueChange={(val) => setFormState({ ...formState, projectId: val })}
                  >
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
                  rows={6}
                  value={formState.content}
                  onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                  placeholder="Write detailed notes, citations, or annotations here…"
                  className="rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tags (comma separated)</Label>
                <Input
                  value={formState.tagsInput}
                  onChange={(e) => setFormState({ ...formState, tagsInput: e.target.value })}
                  placeholder="e.g. transformers, attention, empirical, draft"
                  className="rounded-xl text-xs"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl text-xs font-semibold bg-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingNote ? "Save Note" : "Author Note"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DELETE CONFIRMATION DIALOG */}
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
