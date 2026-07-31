import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  FolderKanban,
  CheckSquare,
  Bell,
  Loader2,
  Tag,
  Eye,
  Trash2,
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
import { toast } from "sonner";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Research Calendar — ScholarNexus AI" },
      { name: "description", content: "Academic deadlines, project milestones, and task due dates." },
    ],
  }),
  component: CalendarPage,
});

interface CalendarEvent {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: "Reminder" | "Deadline" | "Meeting" | "Milestone";
  source: "project" | "task" | "custom";
  projectId?: string;
}

function CalendarPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") return getUserSession();
    return null;
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Date Navigation State (Current View Month)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form State for Custom Reminder
  const [reminderForm, setReminderForm] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    type: "Reminder" as CalendarEvent["type"],
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
    fetchEvents(session.email);
  }, []);

  const fetchEvents = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/events?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      toast.error("Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reminderForm.title.trim() || !reminderForm.date) {
      toast.error("Title and date are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          title: reminderForm.title.trim(),
          description: reminderForm.description.trim(),
          date: reminderForm.date,
          time: reminderForm.time,
          type: reminderForm.type,
        }),
      });

      if (res.ok) {
        toast.success("Reminder added to calendar!");
        setIsAddOpen(false);
        setReminderForm({
          title: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          time: "10:00",
          type: "Reminder",
        });
        fetchEvents(user.email);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add reminder.");
      }
    } catch {
      toast.error("Error adding reminder.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReminder = async (eventId: string) => {
    if (!user) return;
    try {
      const res = await fetch(
        `/api/calendar/events?id=${encodeURIComponent(eventId)}&email=${encodeURIComponent(user.email)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Reminder deleted.");
        setSelectedEvent(null);
        fetchEvents(user.email);
      }
    } catch {
      toast.error("Failed to delete reminder.");
    }
  };

  // Month Grid Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = lastDayOfMonth.getDate();

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Previous month padding days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = prevDate.toISOString().split("T")[0];
      days.push({ dateStr, dayNumber: prevMonthLastDay - i, isCurrentMonth: false, isToday: false });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().split("T")[0];
      days.push({ dateStr, dayNumber: i, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [year, month]);

  // Map events to date strings
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  const getEventBadge = (type: string, source: string) => {
    if (source === "project") {
      return <Badge className="bg-blue-500/15 text-blue-400 border-none font-semibold text-[0.6rem] truncate max-w-full">Project</Badge>;
    }
    if (source === "task") {
      return <Badge className="bg-purple-500/15 text-purple-400 border-none font-semibold text-[0.6rem] truncate max-w-full">Task Due</Badge>;
    }
    return <Badge className="bg-emerald-500/15 text-emerald-400 border-none font-semibold text-[0.6rem] truncate max-w-full">Reminder</Badge>;
  };

  if (typeof window !== "undefined" && !user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1350px] flex-col gap-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
              Research Timeline
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Academic Research Calendar
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Integrated view of project start dates, target deadlines, task due dates, and personal reminders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-xl text-xs"
            >
              Month View
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-xl text-xs"
            >
              Upcoming List
            </Button>
            <Button onClick={() => setIsAddOpen(true)} className="gap-2 rounded-xl bg-primary text-xs font-semibold shadow-md">
              <Plus className="h-4 w-4" /> Add Reminder
            </Button>
          </div>
        </div>

        {/* Month Navigation Toolbar */}
        <Card className="surface-elevated rounded-2xl border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">
                {monthName} {year}
              </h2>
              <Button variant="outline" size="sm" onClick={handleToday} className="h-8 rounded-xl text-xs font-semibold">
                Today
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* CALENDAR BODY */}
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Loading academic calendar…</p>
          </div>
        ) : viewMode === "grid" ? (
          /* MONTH GRID */
          <Card className="surface-elevated rounded-2xl border-border bg-card overflow-hidden">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 border-b border-border text-center text-xs font-bold text-muted-foreground py-3 bg-muted/30">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* 35 Cell Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60">
              {calendarDays.map((cell) => {
                const dayEvents = eventsByDate[cell.dateStr] || [];
                return (
                  <div
                    key={cell.dateStr}
                    className={`min-h-[110px] p-2 transition-colors flex flex-col justify-between ${
                      !cell.isCurrentMonth ? "bg-muted/10 opacity-40" : "bg-card hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                          cell.isToday
                            ? "bg-primary text-primary-foreground font-bold shadow-sm"
                            : "text-foreground"
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[0.6rem] font-bold text-muted-foreground">
                          {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Event Badges */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id || ev._id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`cursor-pointer rounded-md p-1 text-[0.65rem] font-semibold leading-tight truncate transition-opacity hover:opacity-80 flex items-center justify-between gap-1 ${
                            ev.source === "project"
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                              : ev.source === "task"
                              ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          <span className="truncate">{ev.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[0.6rem] text-muted-foreground font-semibold pl-1">
                          +{dayEvents.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          /* UPCOMING EVENTS LIST VIEW */
          <Card className="surface-elevated rounded-2xl border-border bg-card p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-bold">Upcoming Milestones & Reminders</CardTitle>
            </CardHeader>
            <div className="divide-y divide-border/60">
              {events.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No upcoming events found.</p>
              ) : (
                events.map((ev) => (
                  <div
                    key={ev.id || ev._id}
                    className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/20 transition-colors rounded-xl px-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        {ev.source === "project" ? (
                          <FolderKanban className="h-4 w-4" />
                        ) : ev.source === "task" ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{ev.title}</span>
                          {getEventBadge(ev.type, ev.source)}
                        </div>
                        {ev.description && (
                          <p className="text-[0.725rem] text-muted-foreground line-clamp-1">{ev.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground justify-between sm:justify-end">
                      <div className="flex items-center gap-1 text-[0.7rem]">
                        <Clock className="h-3.5 w-3.5 text-primary" /> {ev.date} {ev.time ? `at ${ev.time}` : ""}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvent(ev)}
                        className="rounded-lg text-xs h-7 gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* ADD REMINDER DIALOG */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="rounded-2xl sm:max-w-lg border-border bg-card p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Add Calendar Reminder</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set a personal reminder or milestone on your academic calendar.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddReminder} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reminder Title <span className="text-destructive">*</span></Label>
                <Input
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                  placeholder="e.g. Submit Conference Draft / Advisor Sync"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea
                  rows={3}
                  value={reminderForm.description}
                  onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                  placeholder="Details, submission link, or meeting agenda…"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Date</Label>
                  <Input
                    type="date"
                    value={reminderForm.date}
                    onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Time</Label>
                  <Input
                    type="time"
                    value={reminderForm.time}
                    onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Event Type</Label>
                  <Select
                    value={reminderForm.type}
                    onValueChange={(val: any) => setReminderForm({ ...reminderForm, type: val })}
                  >
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Reminder" className="text-xs">Reminder</SelectItem>
                      <SelectItem value="Deadline" className="text-xs">Deadline</SelectItem>
                      <SelectItem value="Meeting" className="text-xs">Meeting</SelectItem>
                      <SelectItem value="Milestone" className="text-xs">Milestone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl text-xs font-semibold bg-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Reminder"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* EVENT DETAILS DIALOG */}
        <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          {selectedEvent && (
            <DialogContent className="rounded-2xl sm:max-w-md border-border bg-card p-6 space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="rounded-full text-[0.65rem] border-primary/30 text-primary">
                    {selectedEvent.type}
                  </Badge>
                  {getEventBadge(selectedEvent.type, selectedEvent.source)}
                </div>
                <DialogTitle className="text-lg font-bold text-foreground pt-1">
                  {selectedEvent.title}
                </DialogTitle>
              </DialogHeader>

              {selectedEvent.description && (
                <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/60">
                  {selectedEvent.description}
                </p>
              )}

              <div className="space-y-2 text-xs text-foreground pt-1">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Date:</span> {selectedEvent.date}
                </div>
                {selectedEvent.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Time:</span> {selectedEvent.time}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 flex items-center justify-between">
                {selectedEvent.source === "custom" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteReminder(selectedEvent.id || selectedEvent._id || "")}
                    className="rounded-xl text-xs gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Reminder
                  </Button>
                ) : (
                  <span className="text-[0.65rem] text-muted-foreground">Auto-synced from workspace</span>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)} className="rounded-xl text-xs">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
