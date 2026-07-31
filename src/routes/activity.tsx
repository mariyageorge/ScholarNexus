import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  History,
  CheckCircle2,
  FolderKanban,
  FileText,
  StickyNote,
  UserCircle,
  ShieldAlert,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Recent Activity — ScholarNexus AI" },
      { name: "description", content: "Complete audit log and research activity stream." },
    ],
  }),
  component: ActivityPage,
});

interface ActivityItem {
  id: string;
  _id?: string;
  userEmail: string;
  userName: string;
  action: string;
  title: string;
  description: string;
  category: "Project" | "Paper" | "Task" | "Note" | "Profile" | "System";
  timestamp: string;
}

function ActivityPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") return getUserSession();
    return null;
  });

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setUser(session);
    fetchActivities(session.email);
  }, []);

  const fetchActivities = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activity?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch {
      toast.error("Failed to load activity stream.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Task":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "Project":
        return <FolderKanban className="h-4 w-4 text-blue-500" />;
      case "Paper":
        return <FileText className="h-4 w-4 text-violet-500" />;
      case "Note":
        return <StickyNote className="h-4 w-4 text-amber-500" />;
      case "Profile":
        return <UserCircle className="h-4 w-4 text-teal-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (typeof window !== "undefined" && !user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1000px] flex-col gap-6 pb-12">
        {/* Header */}
        <div className="space-y-1">
          <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
            Audit Stream
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <History className="h-7 w-7 text-primary" /> Recent Activity Stream
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Automatic chronological log of your completed tasks, authored notes, project creations, and paper uploads.
          </p>
        </div>

        {/* Activity Feed */}
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Loading recent activity…</p>
          </div>
        ) : activities.length === 0 ? (
          <Card className="surface-elevated rounded-2xl border-dashed border-border py-16 text-center space-y-3">
            <History className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-lg font-bold text-foreground">No Activity Recorded</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Your actions will automatically populate here as you create projects, complete tasks, and author notes.
            </p>
          </Card>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
            {activities.map((act) => (
              <div key={act.id || act._id} className="relative group">
                <div className="absolute -left-6 top-1 grid h-6 w-6 place-items-center rounded-full bg-card border border-border shadow-sm group-hover:border-primary transition-colors">
                  {getCategoryIcon(act.category)}
                </div>

                <Card className="surface-elevated rounded-2xl border-border bg-card p-4 hover:border-primary/40 transition-all space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h3 className="text-xs font-bold text-foreground">{act.title}</h3>
                    <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-primary" /> {formatTimestamp(act.timestamp)}
                    </span>
                  </div>
                  {act.description && (
                    <p className="text-[0.725rem] text-muted-foreground leading-relaxed">{act.description}</p>
                  )}
                  <div className="pt-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-[0.6rem] border-primary/20 text-primary">
                      {act.category}
                    </Badge>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
