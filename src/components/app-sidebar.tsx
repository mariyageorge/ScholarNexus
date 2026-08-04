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
  UserCheck,
  Megaphone,
  BarChart3,
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
import { getUserSession } from "@/lib/session";

type SidebarMenuItemType = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  hash?: string;
};

const workspace: SidebarMenuItemType[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Research Projects", url: "/projects", icon: FolderKanban },
  { title: "Tasks & Notes", url: "/tasks", icon: CheckSquare },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Activity", url: "/activity", icon: History },
  { title: "My Faculty", url: "/faculty", icon: GraduationCap },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Profile", url: "/profile", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

const facultyMenu: SidebarMenuItemType[] = [
  { title: "Dashboard", url: "/faculty-dashboard", icon: LayoutDashboard },
  { title: "My Students", url: "/faculty/students", icon: Users },
  { title: "Supervision Requests", url: "/faculty/supervision-requests", icon: UserCheck },
  { title: "Research Projects", url: "/faculty/projects", icon: FolderKanban },
  { title: "Reviews & Feedback", url: "/faculty/reviews", icon: Quote },
  { title: "Resources", url: "/faculty/resources", icon: Bookmark },
  { title: "Research Profile", url: "/faculty/profile", icon: UserCircle },
  { title: "AI Assistant", url: "/faculty/assistant", icon: Sparkles },
  { title: "Settings", url: "/faculty/settings", icon: Settings },
];

const facultyAccount: SidebarMenuItemType[] = [
  { title: "Profile", url: "/profile", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Logout", url: "/login", icon: LogOut },
];

const adminMenu: SidebarMenuItemType[] = [
  { title: "Dashboard", url: "/admin", hash: "#dashboard", icon: LayoutDashboard },
  { title: "User Management", url: "/admin", hash: "#users", icon: Users },
  { title: "Faculty Approvals", url: "/admin", hash: "#approvals", icon: UserCheck },
  { title: "Research Projects", url: "/admin", hash: "#projects", icon: FolderKanban },
  { title: "Research Papers", url: "/admin", hash: "#papers", icon: FileText },
  { title: "Announcements", url: "/admin", hash: "#announcements", icon: Megaphone },
  { title: "Reports & Analytics", url: "/admin", hash: "#reports", icon: BarChart3 },
  { title: "Activity Logs", url: "/admin", hash: "#activity", icon: History },
  { title: "Settings", url: "/admin", hash: "#settings", icon: Settings },
];

const adminAccount: SidebarMenuItemType[] = [
  { title: "Admin Settings", url: "/admin", hash: "#settings", icon: Settings },
  { title: "Student View", url: "/dashboard", icon: LayoutDashboard },
  { title: "Logout", url: "/login", icon: LogOut },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });

  const user = typeof window !== "undefined" ? getUserSession() : null;
  const isCurrentAdminRoute = pathname === "/admin" || pathname.startsWith("/admin");
  const isFacultyUser = user?.role === "faculty";

  const isActive = (item: SidebarMenuItemType) => {
    if (isCurrentAdminRoute && item.url === "/admin") {
      if (!hash || hash === "" || hash === "#dashboard") {
        return item.hash === "#dashboard" || !item.hash;
      }
      return item.hash === hash;
    }
    if (item.url === pathname && !item.hash) return true;
    return false;
  };

  const renderGroup = (label: string, items: readonly SidebarMenuItemType[]) => (
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
            const targetUrl =
              item.title === "Profile" && (user?.role === "admin" || user?.email === "scholarnexusadmin@gmail.com")
                ? "/dashboard"
                : `${item.url}${item.hash ?? ""}`;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link
                    to={targetUrl}
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

  const menu = isCurrentAdminRoute
    ? adminMenu
    : isFacultyUser
    ? facultyMenu
    : workspace;

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
                {isCurrentAdminRoute ? "Admin Management Portal" : "Academic Research Hub"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1">
        {renderGroup(isCurrentAdminRoute ? "Admin Portal" : "Global Navigation", menu)}
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
