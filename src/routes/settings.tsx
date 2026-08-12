import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  Moon,
  Shield,
  Sun,
  User,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — ScholarNexus AI" },
      { name: "description", content: "Manage your profile, password, notification preferences, and workspace settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") {
      return getUserSession();
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState("security");
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);


  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    projectMilestones: true,
    mentorReviews: true,
    weeklyDigest: false,
    systemAnnouncements: true,
  });

  const { theme, setTheme } = useTheme();

  // Appearance & Theme State
  const [themeMode, setThemeMode] = useState<"dark" | "light" | "system">(theme);
  const [compactMode, setCompactMode] = useState(false);

  // Privacy State
  const [visibility, setVisibility] = useState<"Public" | "Advisor Only" | "Private">("Advisor Only");
  const [allowFacultyInvite, setAllowFacultyInvite] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setUser(session);
    fetchUserSettings(session.email);
  }, []);

  const fetchUserSettings = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/settings?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setNotifications((prev) => ({ ...prev, ...data.preferences.notifications }));
          if (data.preferences.theme) setThemeMode(data.preferences.theme);
          if (data.preferences.visibility) setVisibility(data.preferences.visibility);
        }
      }
    } catch {
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!passwordForm.currentPassword) {
      toast.error("Current password is required.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (res.ok) {
        toast.success("Password changed successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to change password.");
      }
    } catch {
      toast.error("Error changing password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          preferences: { notifications, theme: themeMode, visibility },
        }),
      });
      if (res.ok) {
        toast.success("Preferences updated.");
      }
    } catch {
      toast.error("Error saving preferences.");
    }
  };

  if (typeof window !== "undefined" && !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 pb-12">
        {/* Header */}
        <div className="space-y-1">
          <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
            Account Management
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Workspace & Profile Settings
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Manage your account credentials, research identity, notification alerts, and security preferences.
          </p>
        </div>

        {/* Settings Tabs Bar */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-card border border-border p-1.5 rounded-2xl shadow-sm h-auto">
            <TabsTrigger value="security" className="rounded-xl py-2.5 text-xs font-semibold gap-2">
              <KeyRound className="h-3.5 w-3.5" /> Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-xl py-2.5 text-xs font-semibold gap-2">
              <Bell className="h-3.5 w-3.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-xl py-2.5 text-xs font-semibold gap-2">
              <Sun className="h-3.5 w-3.5" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-xl py-2.5 text-xs font-semibold gap-2">
              <Shield className="h-3.5 w-3.5" /> Privacy
            </TabsTrigger>
          </TabsList>



          {/* TAB 2: SECURITY & CHANGE PASSWORD */}
          <TabsContent value="security">
            <Card className="surface-elevated rounded-2xl border-border bg-card p-6 md:p-8">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" /> Security & Password
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Change your account password and enforce multi-factor security rules.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSavePassword} className="space-y-5 max-w-xl">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="rounded-xl text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="rounded-xl text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Rules */}
                  <div className="flex items-center gap-2 pt-1">
                    <div
                      className={`h-1.5 flex-1 rounded-full ${passwordForm.newPassword.length >= 8 ? "bg-emerald-500" : "bg-muted"
                        }`}
                    />
                    <span className="text-[0.7rem] text-muted-foreground">
                      {passwordForm.newPassword.length >= 8 ? "Valid length" : "Min 8 chars"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="rounded-xl text-xs"
                  />
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-[0.725rem] text-destructive flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Passwords do not match.
                    </p>
                  )}
                </div>

                <div className="pt-3">
                  <Button type="submit" disabled={savingPassword} className="gap-2 rounded-xl bg-primary text-xs font-semibold px-6">
                    {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          {/* TAB 3: NOTIFICATIONS */}
          <TabsContent value="notifications">
            <Card className="surface-elevated rounded-2xl border-border bg-card p-6 md:p-8 space-y-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-bold">Notification Preferences</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Choose how and when ScholarNexus alerts you regarding mentor feedback and milestones.
                </CardDescription>
              </CardHeader>

              <div className="space-y-5 divide-y divide-border/60">
                <div className="flex items-center justify-between pt-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Email Notifications</p>
                    <p className="text-[0.725rem] text-muted-foreground">Receive email alerts for important workspace activities.</p>
                  </div>
                  <Switch
                    checked={notifications.emailAlerts}
                    onCheckedChange={(val) => {
                      setNotifications({ ...notifications, emailAlerts: val });
                      handleSavePreferences();
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Project Milestone Alerts</p>
                    <p className="text-[0.725rem] text-muted-foreground">Alerts when target completion dates or task deadlines approach.</p>
                  </div>
                  <Switch
                    checked={notifications.projectMilestones}
                    onCheckedChange={(val) => {
                      setNotifications({ ...notifications, projectMilestones: val });
                      handleSavePreferences();
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Faculty Review Notifications</p>
                    <p className="text-[0.725rem] text-muted-foreground">Instant notifications when assigned advisors submit reviews or feedback.</p>
                  </div>
                  <Switch
                    checked={notifications.mentorReviews}
                    onCheckedChange={(val) => {
                      setNotifications({ ...notifications, mentorReviews: val });
                      handleSavePreferences();
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Platform Announcements</p>
                    <p className="text-[0.725rem] text-muted-foreground">Updates on new AI models, literature tools, and feature releases.</p>
                  </div>
                  <Switch
                    checked={notifications.systemAnnouncements}
                    onCheckedChange={(val) => {
                      setNotifications({ ...notifications, systemAnnouncements: val });
                      handleSavePreferences();
                    }}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 4: APPEARANCE */}
          <TabsContent value="appearance">
            <Card className="surface-elevated rounded-2xl border-border bg-card p-6 md:p-8 space-y-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-bold">Appearance & Theme</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Customize the look and density of your research workspace.
                </CardDescription>
              </CardHeader>

              <div className="space-y-4">
                <Label className="text-xs font-semibold">Workspace Color Theme</Label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card
                    onClick={() => {
                      setThemeMode("dark");
                      setTheme("dark");
                      handleSavePreferences();
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all text-center space-y-3 ${themeMode === "dark" || theme === "dark" ? "border-primary bg-primary/10" : "border-border bg-card"
                      }`}
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-slate-100 mx-auto">
                      <Moon className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">Dark Mode</p>
                      <p className="text-[0.7rem] text-muted-foreground">High contrast dark theme</p>
                    </div>
                  </Card>

                  <Card
                    onClick={() => {
                      setThemeMode("light");
                      setTheme("light");
                      handleSavePreferences();
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all text-center space-y-3 ${themeMode === "light" || theme === "light" ? "border-primary bg-primary/10" : "border-border bg-card"
                      }`}
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-900 mx-auto border border-border">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">Light Mode</p>
                      <p className="text-[0.7rem] text-muted-foreground">Clean light interface</p>
                    </div>
                  </Card>

                  <Card
                    onClick={() => {
                      setThemeMode("system");
                      setTheme("system");
                      handleSavePreferences();
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all text-center space-y-3 ${themeMode === "system" || theme === "system" ? "border-primary bg-primary/10" : "border-border bg-card"
                      }`}
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-foreground mx-auto">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">System Theme</p>
                      <p className="text-[0.7rem] text-muted-foreground">Sync with OS settings</p>
                    </div>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">Compact Layout Density</p>
                  <p className="text-[0.725rem] text-muted-foreground">Reduce spacing in tables and lists for dense data views.</p>
                </div>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </div>
            </Card>
          </TabsContent>

          {/* TAB 5: PRIVACY */}
          <TabsContent value="privacy">
            <Card className="surface-elevated rounded-2xl border-border bg-card p-6 md:p-8 space-y-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-lg font-bold">Privacy & Visibility</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Control project visibility and export your academic workspace data.
                </CardDescription>
              </CardHeader>

              <div className="space-y-5 max-w-xl">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Default Research Workspace Visibility</Label>
                  <Select value={visibility} onValueChange={(val: any) => setVisibility(val)}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Public" className="text-xs">Public (Discoverable by institution)</SelectItem>
                      <SelectItem value="Advisor Only" className="text-xs">Advisor Only (Assigned faculty mentors)</SelectItem>
                      <SelectItem value="Private" className="text-xs">Private (Only you can access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Allow Faculty Collaboration Invites</p>
                    <p className="text-[0.725rem] text-muted-foreground">Enable faculty advisors to invite you to research groups.</p>
                  </div>
                  <Switch checked={allowFacultyInvite} onCheckedChange={setAllowFacultyInvite} />
                </div>

                <Separator />

                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold text-foreground">Data Export</h4>
                  <p className="text-[0.725rem] text-muted-foreground">
                    Download a full JSON archive of your research projects, literature, notes, and activity timeline.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => toast.success("Export package generated and downloaded.")}
                    className="gap-2 rounded-xl text-xs"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Export Workspace Data
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
