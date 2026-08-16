import { useEffect, useState } from "react";
import { Bell, Sparkles, Megaphone, ArrowRight, Pin, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUserSession, setUserSession, getUserDisplayName, getUserInitials, clearUserSession } from "@/lib/session";
import { toast } from "sonner";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Research Projects",
  "/papers": "Research Papers",
  "/assistant": "AI Research Assistant",
  "/comparison": "Paper Comparison",
  "/citations": "Citation Generator",
  "/similarity": "Similarity Checker",
  "/collaboration": "Faculty Collaboration",
  "/faculty": "Faculty Workspace",
  "/admin": "Admin Console",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/profile": "User Profile",
  "/tasks": "Task Management",
  "/calendar": "Calendar",
  "/notes": "Research Notes",
  "/bookmarks": "Bookmarks",
  "/activity": "Recent Activity",
  "/downloads": "Downloads",
  "/help": "Help Center",
  "/about": "About",
  "/contact": "Contact",
  "/documentation": "Documentation",
  "/faq": "FAQ",
  "/privacy": "Privacy Policy",
  "/terms": "Terms & Conditions",
};

interface Announcement {
  id?: string;
  _id?: string;
  title: string;
  content: string;
  targetAudience: string;
  priority: string;
  pinned: boolean;
  published: boolean;
  authorName: string;
  createdAt: string;
}

export function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titles[pathname] ?? "Dashboard";
  const [user, setUser] = useState(() => getUserSession());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      const activeSession = getUserSession();
      setUser(activeSession);
    };

    window.addEventListener("scholarnexus-session-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    handleUpdate();

    const activeSession = getUserSession();
    if (activeSession?.email) {
      fetch(`/api/profile?email=${encodeURIComponent(activeSession.email)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((profileData) => {
          if (profileData && typeof profileData === "object" && !profileData.error) {
            const updatedUser = { ...activeSession, ...profileData };
            setUser(updatedUser);
            setUserSession(updatedUser);
          }
        })
        .catch(() => {});
    }

    // Fetch Platform Announcements for Bell Popover
    fetch("/api/announcements")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAnnouncements(data.filter((a) => a.published && (a.targetAudience === "All" || a.targetAudience === "Students")));
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("scholarnexus-session-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const userPhoto = user?.profileImage ?? user?.photoURL;
  const userName = getUserDisplayName(user);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 md:px-6">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <div className="hidden min-w-0 flex-col md:flex">
        <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </span>
        <h1 className="truncate text-sm font-semibold text-foreground">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Badge
          variant="outline"
          className="hidden gap-1.5 rounded-full border-accent/40 bg-accent/10 px-2.5 py-1 text-[0.7rem] font-medium text-foreground lg:inline-flex"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <Sparkles className="h-3 w-3" />
          AI online
        </Badge>

        <ThemeToggle />

        {/* Bell Button with Platform Announcements Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Platform Announcements"
              className="relative rounded-full"
            >
              <Bell className="h-[1.15rem] w-[1.15rem]" />
              {announcements.length > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 sm:w-96 rounded-2xl border-border bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Megaphone className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Platform Announcements</h3>
              </div>
              {announcements.length > 0 && (
                <Badge variant="outline" className="rounded-full text-[0.65rem] border-primary/30 text-primary">
                  {announcements.length} Live
                </Badge>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <Bell className="h-7 w-7 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-foreground">No New Announcements</p>
                <p className="text-[0.7rem] text-muted-foreground">You're all caught up with platform updates.</p>
              </div>
            ) : (
              <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                {announcements.map((ann) => (
                  <div
                    key={ann.id || ann._id || ann.title}
                    className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-1 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-foreground truncate">{ann.title}</span>
                      {ann.pinned && (
                        <Badge variant="outline" className="gap-1 text-[0.6rem] border-amber-500/40 text-amber-500 bg-amber-500/10">
                          <Pin className="h-2.5 w-2.5" /> Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-[0.725rem] text-muted-foreground leading-relaxed line-clamp-3">
                      {ann.content}
                    </p>
                    <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground/80 pt-1">
                      <span>By {ann.authorName || "Academic Admin"}</span>
                      <span>{formatDate(ann.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border/60 pt-2.5 mt-3 text-center">
              <Link
                to="/notifications"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                View Notifications & Activity <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* Top Right Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3.5 select-none transition hover:border-primary/50 hover:bg-accent/50 focus:outline-none cursor-pointer"
            >
              <Avatar className="h-7 w-7 border border-border">
                {userPhoto ? (
                  <AvatarImage src={userPhoto} alt={userName} className="object-cover" />
                ) : null}
                <AvatarFallback suppressHydrationWarning className="bg-primary text-[0.7rem] font-semibold text-primary-foreground">
                  {getUserInitials(user)}
                </AvatarFallback>
              </Avatar>
              <span suppressHydrationWarning className="hidden text-xs font-semibold text-foreground sm:inline-block max-w-[140px] truncate">
                {userName}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-border bg-card">
            <DropdownMenuLabel className="font-normal p-2 pb-1">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold leading-none text-foreground">{userName}</p>
                <p className="text-[0.68rem] leading-none text-muted-foreground truncate">{user?.email}</p>
                <div className="pt-1">
                  <Badge variant="outline" className="text-[0.6rem] font-semibold capitalize rounded-full px-2 py-0 border-primary/30 text-primary bg-primary/10">
                    {user?.role || "Member"}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              asChild
              className="rounded-xl text-xs font-semibold cursor-pointer gap-2 py-2"
            >
              <Link
                to={user?.role === "admin" ? "/admin" : user?.role === "faculty" ? "/faculty/profile" : "/profile"}
                hash={user?.role === "admin" ? "settings" : undefined}
              >
                <User className="h-3.5 w-3.5 text-primary" /> My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className="rounded-xl text-xs font-semibold cursor-pointer gap-2 py-2"
            >
              <Link to="/settings">
                <Settings className="h-3.5 w-3.5" /> Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                clearUserSession();
                toast.success("Signed out successfully.");
                window.location.href = "/login";
              }}
              className="rounded-xl text-xs font-semibold cursor-pointer gap-2 py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
