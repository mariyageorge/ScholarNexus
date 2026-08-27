import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Globe,
  Search,
  BookOpen,
  Plus,
  Check,
  ExternalLink,
  Loader2,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/papers")({
  head: () => ({
    meta: [
      { title: "Global Academic Paper Search — ScholarNexus AI" },
      { name: "description", content: "Search millions of open-access papers and preprints on arXiv and CrossRef." },
    ],
  }),
  component: GlobalPaperSearchPage,
});

function GlobalPaperSearchPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingPaperId, setImportingPaperId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = getUserSession();
      if (session) {
        setUser(session);
        fetchUserProjects(session.email);
      }
    }
  }, []);

  const fetchUserProjects = async (email: string) => {
    try {
      const res = await fetch(`/api/projects?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0) {
            setSelectedProjectId(data[0].id || data[0]._id);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching user projects:", err);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a search topic or keywords.");
      return;
    }

    setSearching(true);
    try {
      const pQuery = selectedProjectId ? `&projectId=${encodeURIComponent(selectedProjectId)}` : "";
      const res = await fetch(`/api/papers/search?query=${encodeURIComponent(query.trim())}${pQuery}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setResults(data.results);
          if (data.results.length === 0) {
            toast.info("No papers found. Try alternative keywords.");
          }
        }
      } else {
        toast.error("Failed to execute literature search.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to search proxy engine.");
    } finally {
      setSearching(false);
    }
  };

  const handleImportPaper = async (paperResult: any) => {
    if (!selectedProjectId) {
      toast.error("Please select a target research project workspace first.");
      return;
    }

    setImportingPaperId(paperResult.id);
    try {
      const newPaper = {
        id: `paper-${Date.now()}`,
        projectId: selectedProjectId,
        title: paperResult.title,
        authors: paperResult.authors,
        year: paperResult.year || paperResult.publicationYear || String(new Date().getFullYear()),
        publicationYear: paperResult.publicationYear || paperResult.year || String(new Date().getFullYear()),
        journal: paperResult.journal || paperResult.journalOrConference || "Academic Literature",
        journalOrConference: paperResult.journalOrConference || paperResult.journal || "Academic Literature",
        doi: paperResult.doi || "",
        abstract: paperResult.abstract || "",
        summary: paperResult.abstract || `Research paper "${paperResult.title}" imported from ${paperResult.source}.`,
        keywords: paperResult.keywords || ["Research"],
        uploadDate: new Date().toISOString().split("T")[0],
        url: paperResult.pdfUrl || paperResult.url || "",
      };

      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPaper, userEmail: user?.email }),
      });

      if (res.ok) {
        const selectedProjDoc = projects.find((p) => (p.id || p._id) === selectedProjectId);
        toast.success(`Paper imported to project "${selectedProjDoc?.title || "Workspace"}"!`);
        setResults((prev) =>
          prev.map((item) => (item.id === paperResult.id ? { ...item, isAlreadyImported: true } : item))
        );
      } else {
        toast.error("Failed to import paper to project database.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error importing paper to project.");
    } finally {
      setImportingPaperId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-xs font-semibold gap-1">
                <Globe className="h-3.5 w-3.5" /> Open Access Scientific Search (arXiv + CrossRef)
              </Badge>
              <Badge variant="outline" className="text-muted-foreground text-[0.68rem]">
                100% Free Literature
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Global Academic Literature Discovery
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Search millions of open-access preprints and peer-reviewed journals, then import directly to your project workspace.
            </p>
          </div>

          {/* Target Project Selector Dropdown */}
          {projects.length > 0 && (
            <div className="space-y-1 self-start md:self-auto min-w-[240px]">
              <label className="text-[0.7rem] font-bold text-foreground flex items-center gap-1">
                <FolderKanban className="h-3.5 w-3.5 text-primary" /> Target Project Workspace:
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-9 rounded-xl border border-border/80 bg-card text-xs font-medium text-foreground px-3 focus:outline-none focus:border-primary"
              >
                {projects.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <Card className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by topic, paper title, author, or research domain (e.g., Quantum Computing, Neural Networks)..."
                className="pl-10 h-11 rounded-xl text-xs bg-background border-border/80 focus:border-primary"
              />
            </div>
            <Button
              type="submit"
              disabled={searching || !query.trim()}
              className="h-11 px-6 rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-2 shadow-sm shrink-0"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {searching ? "Searching..." : "Search Papers"}
            </Button>
          </form>
        </Card>

        {/* Results Area */}
        <div className="space-y-4">
          {searching ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center surface-elevated rounded-2xl border border-dashed border-border/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-semibold text-foreground">Fetching papers from arXiv and CrossRef repositories...</p>
              <p className="text-[0.7rem] text-muted-foreground">Searching open access preprints and peer-reviewed literature</p>
            </div>
          ) : results.length === 0 ? (
            <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-6 text-center space-y-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-bold text-foreground">Search Global Open Access Literature</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter research keywords above to find preprints from arXiv and peer-reviewed papers from CrossRef.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>Found {results.length} global paper results</span>
                <span>Select target project and click import to save</span>
              </div>

              <div className="grid gap-4">
                {results.map((paperResult: any) => (
                  <Card
                    key={paperResult.id}
                    className="rounded-2xl border border-border/80 bg-card p-5 space-y-3 transition-all hover:border-primary/40 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={
                              paperResult.source === "arXiv"
                                ? "border-amber-500/30 text-amber-500 bg-amber-500/10 text-[0.65rem] font-bold"
                                : "border-indigo-500/30 text-indigo-500 bg-indigo-500/10 text-[0.65rem] font-bold"
                            }
                          >
                            {paperResult.source}
                          </Badge>
                          <span className="text-[0.725rem] font-semibold text-muted-foreground">
                            {paperResult.journal || paperResult.journalOrConference || "Literature"} ({paperResult.year || "N/A"})
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-foreground leading-snug">{paperResult.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          <strong>Authors:</strong> {paperResult.authors || "Academic Author(s)"}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {paperResult.isAlreadyImported ? (
                          <Button disabled size="sm" variant="outline" className="rounded-xl text-xs font-semibold gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                            <Check className="h-3.5 w-3.5" /> Imported
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={importingPaperId === paperResult.id || !selectedProjectId}
                            onClick={() => handleImportPaper(paperResult)}
                            className="rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-1.5 shadow-xs"
                          >
                            {importingPaperId === paperResult.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            {importingPaperId === paperResult.id ? "Importing..." : "Import to Project"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Abstract Text */}
                    {paperResult.abstract && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 bg-muted/30 p-3 rounded-xl border border-border/40 italic">
                        "{paperResult.abstract}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[0.725rem] text-muted-foreground">
                      <span>DOI: {paperResult.doi || "N/A"}</span>
                      {paperResult.url && (
                        <a
                          href={paperResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-semibold flex items-center gap-1 hover:underline"
                        >
                          View Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
