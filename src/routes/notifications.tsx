import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  FolderKanban,
  MessageSquare,
  Sparkles,
  Megaphone,
  Trash2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — ScholarNexus AI" },
      { name: "description", content: "All your research updates, mentor feedback, and milestone alerts." },
    ],
  }),
  component: NotificationsPage,
});

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  category: "Feedback" | "Milestone" | "System" | "Paper";
  read: boolean;
  timestamp: string;
  projectLink?: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Faculty Feedback Posted",
    content: "Dr. Aris Thorne submitted review comments on your proposal methodology.",
    category: "Feedback",
    read: false,
    timestamp: "10 mins ago",
    projectLink: "/projects",
  },
  {
    id: "notif-2",
    title: "Milestone Target Approaching",
    content: "Target date for 'Literature Synthesis Completion' is due in 3 days.",
    category: "Milestone",
    read: false,
    timestamp: "1 hour ago",
    projectLink: "/tasks",
  },
  {
    id: "notif-3",
    title: "Paper Similarity Matrix Ready",
    content: "Cross-paper similarity matrix finished processing 4 uploaded research papers.",
    category: "Paper",
    read: true,
    timestamp: "Yesterday",
    projectLink: "/projects",
  },
  {
    id: "notif-4",
    title: "Platform System Maintenance",
    content: "ScholarNexus AI core indexer will undergo scheduled updates on Sunday.",
    category: "System",
    read: true,
    timestamp: "2 days ago",
  },
];

function NotificationsPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") return getUserSession();
    return null;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setUser(session);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read.");
  };

  const handleClearNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    toast.success("Notification removed.");
  };

  const handleToggleRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "feedback") return n.category === "Feedback";
    if (activeTab === "system") return n.category === "System";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (typeof window !== "undefined" && !user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1000px] flex-col gap-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
              Research Alerts Hub
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
              <Bell className="h-7 w-7 text-primary" /> Notifications & Alerts
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Stay informed about project milestones, faculty feedback, paper analyses, and platform announcements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllRead}
                className="rounded-xl text-xs font-semibold gap-1.5 border-border"
              >
                <CheckCheck className="h-3.5 w-3.5 text-primary" /> Mark All as Read
              </Button>
            )}
          </div>
        </div>

        {/* Tabs & Feed */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 max-w-lg bg-card border border-border p-1 rounded-xl h-auto">
            <TabsTrigger value="all" className="rounded-lg text-xs font-bold py-2">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="rounded-lg text-xs font-bold py-2">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-lg text-xs font-bold py-2">
              Feedback
            </TabsTrigger>
            <TabsTrigger value="system" className="rounded-lg text-xs font-bold py-2">
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card className="surface-elevated rounded-2xl border-dashed border-border py-16 text-center space-y-3">
                <Bell className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <h3 className="text-lg font-bold text-foreground">No Notifications</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  You are all caught up! New alerts will appear here as activity occurs.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => (
                  <Card
                    key={notif.id}
                    className={`surface-elevated rounded-2xl border bg-card p-4 transition-all hover:border-primary/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                      !notif.read ? "border-primary/40 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 grid h-8 w-8 place-items-center rounded-xl font-bold text-xs ${
                          notif.category === "Feedback"
                            ? "bg-violet-500/10 text-violet-400"
                            : notif.category === "Milestone"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {notif.category === "Feedback" ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : notif.category === "Milestone" ? (
                          <FolderKanban className="h-4 w-4" />
                        ) : (
                          <Megaphone className="h-4 w-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-foreground">{notif.title}</h3>
                          {!notif.read && (
                            <Badge className="bg-primary text-primary-foreground text-[0.6rem] font-bold px-1.5 py-0">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{notif.content}</p>
                        <span className="text-[0.65rem] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {notif.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                      {notif.projectLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => (window.location.href = notif.projectLink!)}
                          className="h-8 rounded-xl text-xs font-semibold gap-1 text-primary hover:bg-primary/10"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleRead(notif.id)}
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                        title={notif.read ? "Mark as unread" : "Mark as read"}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleClearNotification(notif.id)}
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
