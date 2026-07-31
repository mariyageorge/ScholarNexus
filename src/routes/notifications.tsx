import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
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
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Calendar,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications & Important Dates — ScholarNexus AI" },
      { name: "description", content: "Real-time automated task due date alerts, project milestones, and faculty feedback." },
    ],
  }),
  component: NotificationsPage,
});

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  category: "Task" | "Milestone" | "Feedback" | "System";
  read: boolean;
  timestamp: string;
  projectLink?: string;
  isOverdue?: boolean;
  isDueToday?: boolean;
  priority?: string;
}

interface TaskData {
  id: string;
  _id?: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  projectTitle?: string;
  projectId?: string;
}

interface ProjectData {
  id: string;
  _id?: string;
  title: string;
  targetDate?: string;
  status?: string;
  facultyAdvisor?: string;
}

function NotificationsPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") return getUserSession();
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setUser(session);
    loadUserPreferencesAndData(session.email);
  }, []);

  const loadUserPreferencesAndData = async (email: string) => {
    setLoading(true);

    // Load persisted read/cleared IDs from localStorage
    try {
      const savedRead = localStorage.getItem(`scholarnexus_read_notifs_${email}`);
      if (savedRead) setReadIds(JSON.parse(savedRead));

      const savedCleared = localStorage.getItem(`scholarnexus_cleared_notifs_${email}`);
      if (savedCleared) setClearedIds(JSON.parse(savedCleared));
    } catch (e) {
      console.error("Failed to load local notification preferences", e);
    }

    try {
      const [tasksRes, projRes] = await Promise.all([
        fetch(`/api/tasks?email=${encodeURIComponent(email)}`),
        fetch(`/api/projects?email=${encodeURIComponent(email)}`),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (Array.isArray(tasksData)) setTasks(tasksData);
      }

      if (projRes.ok) {
        const projData = await projRes.json();
        if (Array.isArray(projData)) setProjects(projData);
      }
    } catch (err) {
      toast.error("Failed to fetch notification sources.");
    } finally {
      setLoading(false);
    }
  };

  const saveReadIds = (newRead: string[]) => {
    setReadIds(newRead);
    if (user?.email) {
      localStorage.setItem(`scholarnexus_read_notifs_${user.email}`, JSON.stringify(newRead));
    }
  };

  const saveClearedIds = (newCleared: string[]) => {
    setClearedIds(newCleared);
    if (user?.email) {
      localStorage.setItem(`scholarnexus_cleared_notifs_${user.email}`, JSON.stringify(newCleared));
    }
  };

  // Logical Date Calculation Helper with full validations
  const getDaysDifference = (targetDateStr: string) => {
    if (!targetDateStr) return null;
    const today = new Date(todayStr).getTime();
    const target = new Date(targetDateStr).getTime();
    if (isNaN(target)) return null;
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  };

  // Generate Dynamic Notifications logically based on tasks and projects dates
  const generatedNotifications = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Task Due Date Notifications & Alerts
    tasks.forEach((task) => {
      const taskId = task.id || task._id || task.title;
      const days = getDaysDifference(task.dueDate);

      if (task.status === "Completed") {
        const notifId = `notif-task-completed-${taskId}`;
        list.push({
          id: notifId,
          title: `Task Completed: ${task.title}`,
          content: `Task "${task.title}" has been marked as completed successfully.`,
          category: "Task",
          read: readIds.includes(notifId),
          timestamp: "Completed",
          projectLink: "/tasks",
          priority: task.priority,
        });
      } else {
        if (days === 0) {
          const notifId = `notif-task-due-today-${taskId}`;
          list.push({
            id: notifId,
            title: `Task Due Today: ${task.title}`,
            content: `Action required! Task "${task.title}" is due today (${task.dueDate}). Priority: ${task.priority}.`,
            category: "Task",
            read: readIds.includes(notifId),
            timestamp: "Due Today",
            projectLink: "/tasks",
            isDueToday: true,
            priority: task.priority,
          });
        } else if (days !== null && days < 0) {
          const overdueDays = Math.abs(days);
          const notifId = `notif-task-overdue-${taskId}`;
          list.push({
            id: notifId,
            title: `Overdue Task Alert: ${task.title}`,
            content: `Attention! Task "${task.title}" was due ${overdueDays} day(s) ago (${task.dueDate}) and is still pending.`,
            category: "Task",
            read: readIds.includes(notifId),
            timestamp: `${overdueDays}d Overdue`,
            projectLink: "/tasks",
            isOverdue: true,
            priority: task.priority,
          });
        } else if (days !== null && days > 0 && days <= 3) {
          const notifId = `notif-task-upcoming-${taskId}`;
          list.push({
            id: notifId,
            title: `Upcoming Task Deadline: ${task.title}`,
            content: `Reminder: Task "${task.title}" is due in ${days} day(s) on ${task.dueDate}.`,
            category: "Task",
            read: readIds.includes(notifId),
            timestamp: `In ${days} day(s)`,
            projectLink: "/tasks",
            priority: task.priority,
          });
        } else if (task.dueDate) {
          const notifId = `notif-task-scheduled-${taskId}`;
          list.push({
            id: notifId,
            title: `Scheduled Task: ${task.title}`,
            content: `Task "${task.title}" is scheduled for ${task.dueDate}.${task.projectTitle ? ` (Project: ${task.projectTitle})` : ""}`,
            category: "Task",
            read: readIds.includes(notifId),
            timestamp: `Due ${task.dueDate}`,
            projectLink: "/tasks",
            priority: task.priority,
          });
        }
      }
    });

    // 2. Project Target Date & Faculty Milestone Notifications
    projects.forEach((proj) => {
      const projId = proj.id || proj._id || proj.title;

      if (proj.targetDate) {
        const projDays = getDaysDifference(proj.targetDate);

        if (projDays === 0) {
          const notifId = `notif-proj-due-today-${projId}`;
          list.push({
            id: notifId,
            title: `Project Target Date Today: ${proj.title}`,
            content: `Project "${proj.title}" milestone target date is today (${proj.targetDate}).`,
            category: "Milestone",
            read: readIds.includes(notifId),
            timestamp: "Due Today",
            projectLink: `/projects/${projId}`,
            isDueToday: true,
          });
        } else if (projDays !== null && projDays < 0 && proj.status !== "Completed") {
          const overdueDays = Math.abs(projDays);
          const notifId = `notif-proj-overdue-${projId}`;
          list.push({
            id: notifId,
            title: `Project Target Date Passed: ${proj.title}`,
            content: `Project "${proj.title}" targeted end date (${proj.targetDate}) passed ${overdueDays} day(s) ago.`,
            category: "Milestone",
            read: readIds.includes(notifId),
            timestamp: `${overdueDays}d Overdue`,
            projectLink: `/projects/${projId}`,
            isOverdue: true,
          });
        } else if (projDays !== null && projDays > 0 && projDays <= 7) {
          const notifId = `notif-proj-upcoming-${projId}`;
          list.push({
            id: notifId,
            title: `Upcoming Project Target: ${proj.title}`,
            content: `Project "${proj.title}" target date is approaching in ${projDays} day(s) (${proj.targetDate}).`,
            category: "Milestone",
            read: readIds.includes(notifId),
            timestamp: `In ${projDays} day(s)`,
            projectLink: `/projects/${projId}`,
          });
        }
      }

      if (proj.facultyAdvisor) {
        const notifId = `notif-proj-faculty-${projId}`;
        list.push({
          id: notifId,
          title: `Faculty Advisor Linked: ${proj.title}`,
          content: `Prof./Dr. ${proj.facultyAdvisor} is assigned as primary faculty mentor for "${proj.title}".`,
          category: "Feedback",
          read: readIds.includes(notifId),
          timestamp: "Assigned",
          projectLink: `/projects/${projId}`,
        });
      }
    });

    // Filter out cleared notifications
    return list.filter((item) => !clearedIds.includes(item.id));
  }, [tasks, projects, readIds, clearedIds, todayStr]);

  const handleMarkAllRead = () => {
    const allIds = generatedNotifications.map((n) => n.id);
    const updatedRead = Array.from(new Set([...readIds, ...allIds]));
    saveReadIds(updatedRead);
    toast.success("All notifications marked as read.");
  };

  const handleClearAll = () => {
    const allIds = generatedNotifications.map((n) => n.id);
    const updatedCleared = Array.from(new Set([...clearedIds, ...allIds]));
    saveClearedIds(updatedCleared);
    toast.success("Notification list cleared.");
  };

  const handleClearNotification = (id: string) => {
    const updatedCleared = [...clearedIds, id];
    saveClearedIds(updatedCleared);
    toast.success("Notification removed.");
  };

  const handleToggleRead = (id: string) => {
    let updatedRead: string[];
    if (readIds.includes(id)) {
      updatedRead = readIds.filter((item) => item !== id);
    } else {
      updatedRead = [...readIds, id];
    }
    saveReadIds(updatedRead);
  };

  const filteredNotifications = useMemo(() => {
    return generatedNotifications.filter((n) => {
      if (activeTab === "unread") return !n.read;
      if (activeTab === "tasks") return n.category === "Task";
      if (activeTab === "milestones") return n.category === "Milestone";
      if (activeTab === "feedback") return n.category === "Feedback";
      return true;
    });
  }, [generatedNotifications, activeTab]);

  const unreadCount = useMemo(() => {
    return generatedNotifications.filter((n) => !n.read).length;
  }, [generatedNotifications]);

  if (typeof window !== "undefined" && !user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
              Automated Schedule & Important Dates
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
              <Bell className="h-7 w-7 text-primary" /> Notifications & Alerts
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Live automated alerts calculated from your task due dates, project target deadlines, and faculty guide assignments.
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

            {generatedNotifications.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleClearAll}
                className="rounded-xl text-xs font-semibold gap-1.5 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear Feed
              </Button>
            )}
          </div>
        </div>

        {/* Tabs & Feed */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full bg-card border border-border p-1.5 rounded-2xl shadow-sm h-auto">
            <TabsTrigger value="all" className="rounded-xl py-2.5 text-xs font-bold gap-1.5">
              All ({generatedNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="rounded-xl py-2.5 text-xs font-bold gap-1.5">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-xl py-2.5 text-xs font-bold gap-1.5">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="milestones" className="rounded-xl py-2.5 text-xs font-bold gap-1.5">
              Milestones
            </TabsTrigger>
            <TabsTrigger value="feedback" className="rounded-xl py-2.5 text-xs font-bold gap-1.5">
              Faculty
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-xs text-muted-foreground">Calculating important dates & notifications…</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="surface-elevated rounded-2xl border-dashed border-border py-16 text-center space-y-3">
                <Bell className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <h3 className="text-lg font-bold text-foreground">No Active Notifications</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {activeTab === "unread"
                    ? "You have read all notifications! Great job staying on top of your schedule."
                    : "No notifications found for this category. Add tasks or project milestones to receive automated date alerts."}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif) => (
                  <Card
                    key={notif.id}
                    className={`surface-elevated rounded-2xl border bg-card p-4 transition-all hover:border-primary/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                      !notif.read
                        ? notif.isOverdue
                          ? "border-destructive/40 bg-destructive/5"
                          : notif.isDueToday
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-primary/40 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold text-xs ${
                          notif.isOverdue
                            ? "bg-destructive/15 text-destructive"
                            : notif.isDueToday
                            ? "bg-amber-500/15 text-amber-400"
                            : notif.category === "Task"
                            ? "bg-primary/10 text-primary"
                            : notif.category === "Milestone"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-purple-500/10 text-purple-400"
                        }`}
                      >
                        {notif.isOverdue ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : notif.isDueToday ? (
                          <Calendar className="h-4 w-4" />
                        ) : notif.category === "Task" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : notif.category === "Milestone" ? (
                          <FolderKanban className="h-4 w-4" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xs font-bold text-foreground leading-snug">{notif.title}</h3>
                          {!notif.read && (
                            <Badge className="bg-primary text-primary-foreground text-[0.6rem] font-bold px-1.5 py-0">
                              New
                            </Badge>
                          )}
                          {notif.isOverdue && (
                            <Badge className="bg-destructive text-destructive-foreground text-[0.6rem] font-bold px-1.5 py-0">
                              Overdue
                            </Badge>
                          )}
                          {notif.isDueToday && (
                            <Badge className="bg-amber-500 text-black text-[0.6rem] font-bold px-1.5 py-0">
                              Due Today
                            </Badge>
                          )}
                          {notif.priority && (
                            <Badge variant="outline" className="text-[0.6rem] border-border text-muted-foreground">
                              {notif.priority}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">{notif.content}</p>

                        <span className="text-[0.65rem] text-muted-foreground flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3 text-primary" /> {notif.timestamp}
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
                          View Link <ExternalLink className="h-3 w-3" />
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
