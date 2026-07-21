import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Activity,
  ArrowUpRight,
  BookMarked,
  Bot,
  FileText,
  FolderKanban,
  GitCompareArrows,
  Inbox,
  LineChart,
  MessageSquare,
  Network,
  Plus,
  Quote,
  ScanSearch,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getHomePathForRole, getUserSession } from "@/lib/session";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ScholarNexus AI" },
      {
        name: "description",
        content:
          "Your intelligent research command center: projects, papers, AI insights, and collaboration in one place.",
      },
    ],
  }),
  component: DashboardPage,
});

const stats = [
  { label: "Active Projects", icon: FolderKanban, hint: "In progress" },
  { label: "Research Papers", icon: FileText, hint: "In library" },
  { label: "AI Queries", icon: Sparkles, hint: "This month" },
  { label: "Collaborators", icon: Users, hint: "Faculty & peers" },
];

const quickTools = [
  {
    title: "Compare Papers",
    desc: "Side-by-side AI analysis",
    icon: GitCompareArrows,
    href: "/comparison",
  },
  { title: "Generate Citation", desc: "APA, MLA, Chicago, IEEE", icon: Quote, href: "/citations" },
  {
    title: "Check Similarity",
    desc: "Plagiarism & overlap",
    icon: ScanSearch,
    href: "/similarity",
  },
  { title: "Ask AI Assistant", desc: "Contextual research help", icon: Bot, href: "/assistant" },
];

function DashboardPage() {
  const user = getUserSession();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (user.role !== "student") {
      window.location.href = getHomePathForRole(user.role);
    }
  }, [user]);

  if (!user || user.role !== "student") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="absolute inset-0 grid-neural opacity-40 dark:opacity-25" aria-hidden />
          <div
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Badge className="gap-1.5 rounded-full border-none bg-accent/15 px-3 py-1 text-xs font-medium text-foreground hover:bg-accent/20">
                <Sparkles className="h-3 w-3" /> Powered by ScholarNexus AI
              </Badge>
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Welcome to your research workspace
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
                Organize projects, synthesize papers, generate citations, and collaborate with
                faculty — all guided by intelligent assistance built for academic rigor.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button className="gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4" /> Start a project
                </Button>
                <Button variant="outline" className="gap-2 rounded-full">
                  <Bot className="h-4 w-4" /> Ask AI Assistant
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[380px]">
              <div className="rounded-xl border border-border bg-background/60 p-4 backdrop-blur">
                <Network className="mb-2 h-5 w-5 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Knowledge Graph</p>
                <p className="text-sm font-semibold text-foreground">Not yet generated</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4 backdrop-blur">
                <Target className="mb-2 h-5 w-5 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Weekly focus</p>
                <p className="text-sm font-semibold text-foreground">Set your goal</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <Card
              key={s.label}
              className="surface-elevated border-border transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">—</p>
                  <p className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                    <TrendingUp className="h-3 w-3" /> {s.hint}
                  </p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Main content grid */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-6">
            {/* Projects overview */}
            <Card className="surface-elevated border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">Research Projects</CardTitle>
                  <p className="text-xs text-muted-foreground">Overview of your active work</p>
                </div>
                <Button size="sm" variant="ghost" className="gap-1 text-xs text-primary">
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active">
                  <TabsList className="rounded-full bg-muted p-1">
                    <TabsTrigger value="active" className="rounded-full text-xs">
                      Active
                    </TabsTrigger>
                    <TabsTrigger value="review" className="rounded-full text-xs">
                      In Review
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="rounded-full text-xs">
                      Archived
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="active" className="mt-4">
                    <EmptyState
                      icon={<FolderKanban className="h-5 w-5" />}
                      title="No active projects yet"
                      description="Create your first research project to organize papers, notes, and collaborators in one intelligent workspace."
                      action={{ label: "New research project" }}
                    />
                  </TabsContent>
                  <TabsContent value="review" className="mt-4">
                    <EmptyState
                      icon={<FolderKanban className="h-5 w-5" />}
                      title="Nothing in review"
                      description="Projects awaiting faculty feedback or peer review will appear here."
                      compact
                    />
                  </TabsContent>
                  <TabsContent value="archived" className="mt-4">
                    <EmptyState
                      icon={<FolderKanban className="h-5 w-5" />}
                      title="No archived projects"
                      description="Completed and archived research will be preserved here for reference."
                      compact
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Quick AI tools */}
            <Card className="surface-elevated border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">AI Tools</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Accelerate research with intelligent utilities
                </p>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {quickTools.map((t) => (
                  <button
                    key={t.title}
                    className="group flex items-start gap-3 rounded-xl border border-border bg-background/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/5 hover:shadow-sm"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/15 text-primary transition-colors group-hover:bg-accent/25">
                      <t.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{t.title}</p>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Recent papers + progress */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="surface-elevated border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Recent Papers</CardTitle>
                    <p className="text-xs text-muted-foreground">Recently added or opened</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3"
                    >
                      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                  <p className="pt-2 text-center text-xs text-muted-foreground">
                    Your library is empty. Import papers to get started.
                  </p>
                </CardContent>
              </Card>

              <Card className="surface-elevated border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Research Progress</CardTitle>
                  <p className="text-xs text-muted-foreground">Milestones across your projects</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {["Literature Review", "Methodology", "Data Collection", "Analysis"].map(
                    (phase) => (
                      <div key={phase} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{phase}</span>
                          <span className="text-muted-foreground">Not started</span>
                        </div>
                        <Progress value={0} className="h-1.5" />
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Citation + Similarity placeholders */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="surface-elevated border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Quote className="h-4 w-4 text-primary" /> Citation Generator
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Format references in seconds</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="Paste DOI, URL, or paper title…" className="rounded-lg" />
                    <Button size="sm" className="shrink-0 rounded-lg">
                      Generate
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["APA", "MLA", "Chicago", "IEEE", "Harvard"].map((s) => (
                      <Badge key={s} variant="outline" className="rounded-full text-[0.7rem]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Formatted citation will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="surface-elevated border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <ScanSearch className="h-4 w-4 text-primary" /> Similarity Checker
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Detect overlaps across sources</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-8 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-primary">
                      <ScanSearch className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Upload a document</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Drop a PDF or DOCX to scan for similarity
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full">
                      Choose file
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Faculty feedback + recent activity */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="surface-elevated border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <MessageSquare className="h-4 w-4 text-primary" /> Faculty Feedback
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Comments from mentors and reviewers
                  </p>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={<Inbox className="h-5 w-5" />}
                    title="No feedback yet"
                    description="Share a project with faculty to receive comments and guidance."
                    compact
                  />
                </CardContent>
              </Card>

              <Card className="surface-elevated border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Activity className="h-4 w-4 text-primary" /> Recent Activity
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">A timeline of your work</p>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-4 pl-6">
                    <span className="absolute left-2 top-1 bottom-1 w-px bg-border" aria-hidden />
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-muted ring-4 ring-card" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="mt-2 h-2.5 w-1/3" />
                      </div>
                    ))}
                    <p className="pt-1 text-xs text-muted-foreground">
                      Your recent actions will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right AI insights panel */}
          <aside className="flex flex-col gap-6">
            <Card className="surface-elevated overflow-hidden border-border">
              <div className="relative gradient-brand p-5 text-primary-foreground">
                <div className="absolute inset-0 grid-neural opacity-30" aria-hidden />
                <div className="relative flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Research Assistant</p>
                    <p className="text-[0.7rem] opacity-80">Always-on academic co-pilot</p>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-3 p-5">
                <p className="text-xs text-muted-foreground">
                  Ask questions, summarize papers, or brainstorm hypotheses. Your chat is private to
                  your workspace.
                </p>
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Start a conversation to see AI responses here
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Ask about your research…" className="rounded-full" />
                  <Button size="icon" className="shrink-0 rounded-full">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="surface-elevated border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <LineChart className="h-4 w-4 text-primary" /> AI Insights
                </CardTitle>
                <p className="text-xs text-muted-foreground">Patterns across your research</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Network, label: "Emerging topics", note: "Awaiting library data" },
                  { icon: BookMarked, label: "Reading gaps", note: "No papers analyzed yet" },
                  { icon: TrendingUp, label: "Citation trends", note: "Add sources to unlock" },
                ].map((i) => (
                  <div
                    key={i.label}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-primary">
                      <i.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{i.label}</p>
                      <p className="text-[0.7rem] text-muted-foreground">{i.note}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="surface-elevated border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Users className="h-4 w-4 text-primary" /> Collaborators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={<Users className="h-5 w-5" />}
                  title="Invite your team"
                  description="Add faculty mentors and peers to co-author projects."
                  action={{ label: "Invite people" }}
                  compact
                />
                <Separator className="my-4" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Notifications</span>
                  <Badge variant="outline" className="rounded-full text-[0.65rem]">
                    0 new
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
