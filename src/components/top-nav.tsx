import { useEffect, useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUserSession, getUserInitials } from "@/lib/session";

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

export function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titles[pathname] ?? "Dashboard";
  const [user, setUser] = useState(() => getUserSession());

  useEffect(() => {
    const handleUpdate = () => {
      setUser(getUserSession());
    };

    window.addEventListener("scholarnexus-session-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Initial check
    handleUpdate();

    return () => {
      window.removeEventListener("scholarnexus-session-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const userPhoto = user?.profileImage ?? user?.photoURL;
  const userName = user?.displayName ?? user?.name ?? "Researcher";

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

        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative rounded-full"
        >
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        </Button>

        <Link
          to="/profile"
          className="ml-1 flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-3 transition-colors hover:bg-accent/40"
          title="View Profile"
        >
          <Avatar className="h-7 w-7 border border-border">
            {userPhoto ? (
              <AvatarImage src={userPhoto} alt={userName} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary text-[0.7rem] font-semibold text-primary-foreground">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-xs font-semibold text-foreground">
              {userName}
            </span>
            <span className="text-[0.65rem] text-muted-foreground">
              {user?.email ?? "Guest session"}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
