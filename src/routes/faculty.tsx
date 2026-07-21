import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Bell, Bookmark, FolderKanban, MessageSquare, Quote, ShieldCheck, Sparkles, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHomePathForRole, getUserSession } from "@/lib/session";

export const Route = createFileRoute("/faculty")({
  head: () => ({ meta: [{ title: "Faculty — ScholarNexus AI" }] }),
  component: FacultyPage,
});

function FacultyPage() {
  const user = getUserSession();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (user.role !== "faculty") {
      window.location.href = getHomePathForRole(user.role);
    }
  }, [user]);

  if (!user || user.role !== "faculty") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Faculty Workspace</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Access the faculty dashboard and stay organized with your student work, reviews, and course materials.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input placeholder="Search students, projects, papers…" className="max-w-sm" />
              <Button className="gap-2 rounded-full">
                <Bell className="h-4 w-4" />
                Notifications
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-3xl border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned students</p>
                <p className="mt-3 text-base font-semibold text-foreground">Ready to review</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-3xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active projects</p>
                <p className="mt-3 text-base font-semibold text-foreground">Monitoring in progress</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-3xl bg-primary/10 text-primary">
                <FolderKanban className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending reviews</p>
                <p className="mt-3 text-base font-semibold text-foreground">Awaiting action</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-3xl bg-primary/10 text-primary">
                <Quote className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Feedback status</p>
                <p className="mt-3 text-base font-semibold text-foreground">Ready to send</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-3xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <Card className="rounded-3xl border-border bg-card p-6">
            <CardHeader>
              <CardTitle className="text-lg">Assigned Students</CardTitle>
              <p className="text-sm text-muted-foreground">
                View assigned students, progress, and submission status in one place.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                No student assignments are available yet. Connect with your students and begin tracking research work from the faculty dashboard.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-6">
            <CardTitle className="text-lg">Research Progress</CardTitle>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                This section surfaces project milestones and key course progress. Metrics will populate once research activity begins.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
            <CardTitle className="text-base">Research management</CardTitle>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organize active research groups and keep collaboration aligned with your course goals.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
            <CardTitle className="text-base">Paper review</CardTitle>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review student submissions and publish timely feedback through the faculty workflow.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
            <CardTitle className="text-base">AI insights</CardTitle>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use AI-generated summaries and review support after papers and proposals are submitted.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
            <CardHeader>
              <CardTitle>AI Research Review</CardTitle>
              <p className="text-sm text-muted-foreground">Insights and review guidance appear here once student submissions are available.</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                The AI review panel helps you identify strengths, suggest improvements, and summarize student work.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
            <CardTitle>Feedback editor</CardTitle>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Compose feedback for students in one place.</p>
              <textarea
                className="w-full rounded-3xl border border-border bg-background p-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                rows={8}
                placeholder="Type feedback for the student..."
              />
              <Button className="w-full rounded-full">Save feedback</Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
            <CardTitle className="text-base">Review insights</CardTitle>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reporting will appear here as you complete faculty reviews and student work progresses.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
            <CardTitle className="text-base">Student engagement</CardTitle>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track student participation and use the dashboard to keep research on schedule.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card p-6 shadow-sm">
            <CardTitle className="text-base">Progress summary</CardTitle>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Progress metrics and summaries will update once work is underway.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <p className="text-sm text-muted-foreground">Stay informed about activity and review requests in your faculty workspace.</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              No notifications yet. New alerts will appear here as students submit work or request review.
            </p>
          </CardContent>
        </section>
      </div>
    </DashboardLayout>
  );
}
