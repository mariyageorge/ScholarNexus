import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolderKanban, Plus, Search, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/faculty/projects")({
  head: () => ({
    meta: [
      { title: "Research Projects — ScholarNexus AI Faculty" },
      { name: "description", content: "Supervised research projects and milestone tracker." },
    ],
  }),
  component: FacultyProjectsPage,
});

function FacultyProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/projects")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(
            data.map((p: any) => ({
              id: p.id || p._id,
              title: p.title || p.name || "Research Project",
              domain: p.domain || p.category || "Artificial Intelligence",
              leadStudent: p.userEmail || p.leadStudent || "Alex Chen",
              status: p.status || "Active",
              progress: p.progress ?? 60,
              milestone: p.milestone || "Phase Verification & Benchmarking",
            }))
          );
        }
      })
      .catch((err) => console.error("Error loading faculty projects:", err));
  }, []);

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.leadStudent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <Badge variant="outline" className="rounded-full border-indigo-500/30 text-indigo-500 bg-indigo-500/10 text-xs font-semibold">
              Research Management
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
              Supervised Research Projects
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Monitor active lab initiatives, student milestones, and project deliverables
            </p>
          </div>

          <Button className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20">
            <Plus className="h-4 w-4" /> Initialize New Lab Project
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects or scholars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl text-xs"
          />
        </div>

        {/* Projects Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((proj) => (
            <Card key={proj.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4 hover:border-indigo-500/30 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[0.65rem] border-indigo-500/30 text-indigo-500 bg-indigo-500/10">
                    {proj.domain}
                  </Badge>
                  <Badge variant="secondary" className="text-[0.65rem]">
                    {proj.status}
                  </Badge>
                </div>
                <h3 className="font-bold text-foreground text-sm leading-snug">{proj.title}</h3>
                <p className="text-xs text-muted-foreground">Lead Scholar: <span className="font-semibold text-foreground">{proj.leadStudent}</span></p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="rounded-2xl border border-border bg-background p-3 space-y-1 text-xs">
                  <span className="text-[0.65rem] text-muted-foreground block font-medium">Active Milestone</span>
                  <p className="font-semibold text-foreground truncate">{proj.milestone}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground">{proj.progress}%</span>
                  </div>
                  <Progress value={proj.progress} className="h-2 rounded-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
