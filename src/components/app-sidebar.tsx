import type { ComponentType } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Sparkles,
  Quote,
  ScanSearch,
  Users,
  Bell,
  Settings,
  UserCircle,
  LogOut,
  GraduationCap,
  Calendar,
  Bookmark,
  History,
  ShieldCheck,
  Shield,
  CheckSquare,
  StickyNote,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type SidebarMenuItemType = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  hash?: string;
};

const workspace = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Research Projects", url: "/projects", icon: FolderKanban },
  { title: "Research Papers", url: "/papers", icon: FileText },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Calendar", url: "/calendar", icon: Calendar },
] as const;

const aiTools = [
  { title: "AI Research Assistant", url: "/assistant", icon: Sparkles },
  { title: "Paper Comparison", url: "/comparison", icon: Quote },
  { title: "Citation Generator", url: "/citations", icon: Quote },
  { title: "Similarity Checker", url: "/similarity", icon: ScanSearch },
] as const;

const library = [
  { title: "Notes", url: "/notes", icon: StickyNote },
  { title: "Bookmarks", url: "/bookmarks", icon: Bookmark },
  { title: "Activity", url: "/activity", icon: History },
] as const;

const community = [
  { title: "Faculty Collaboration", url: "/collaboration", icon: Users },
  { title: "Faculty Workspace", url: "/faculty", icon: ShieldCheck },
  { title: "Admin Console", url: "/admin", icon: Shield },
  { title: "Notifications", url: "/notifications", icon: Bell },
] as const;

const account = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "User Profile", url: "/profile", icon: UserCircle },
] as const;

const facultyMenu: SidebarMenuItemType[] = [
  { title: "Dashboard", url: "/faculty", icon: LayoutDashboard },
  { title: "Assigned Students", url: "/faculty", hash: "#assigned-students", icon: Users },
  { title: "Research Projects", url: "/faculty", hash: "#research-projects", icon: FolderKanban },
  { title: "Uploaded Papers", url: "/faculty", hash: "#submitted-papers", icon: FileText },
  { title: "Reviews", url: "/faculty", hash: "#reviews", icon: Quote },
  { title: "Feedback", url: "/faculty", hash: "#feedback", icon: Sparkles },
  { title: "Reports", url: "/faculty", hash: "#reports", icon: Bookmark },
  { title: "Notifications", url: "/faculty", hash: "#notifications", icon: Bell },
];

const facultyAccount: SidebarMenuItemType[] = [
  { title: "Profile", url: "/profile", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logout", url: "/login", icon: LogOut },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });

  const isCurrentFacultyRoute = pathname === "/faculty";

  const isActive = (item: SidebarMenuItemType) => {
    if (item.url === pathname && !item.hash) return true;
    if (isCurrentFacultyRoute && item.url === "/faculty" && item.hash && hash === item.hash)
      return true;
    return false;
  };

  const renderGroup = (label: string, items: SidebarMenuItemType[]) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link
                    to={`${item.url}${item.hash ?? ""}`}
                    className={`group/link flex items-center gap-3 rounded-lg transition-all ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active
                          ? "text-primary"
                          : "text-sidebar-foreground/60 group-hover/link:text-primary"
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                    {active && !collapsed && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  const menu = isCurrentFacultyRoute
    ? facultyMenu
    : workspace;
  const accountMenu = isCurrentFacultyRoute ? facultyAccount : account;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex items-center gap-3 px-1 py-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-brand shadow-sm">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-sidebar" />
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-sidebar-foreground">
                ScholarNexus
              </span>
              <span className="truncate text-[0.7rem] font-medium text-muted-foreground">
                AI Research Suite
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1">
        {renderGroup("Workspace", menu)}
        {!isCurrentFacultyRoute && renderGroup("AI Tools", aiTools)}
        {!isCurrentFacultyRoute && renderGroup("Library", library)}
        {!isCurrentFacultyRoute && renderGroup("Community", community)}
        {renderGroup("Account", accountMenu)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Log out"
              className="text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive"
            >
              <Link to="/login">
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Logout</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
