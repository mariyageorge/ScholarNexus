import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  Lock,
  Building,
  Award,
  BookOpen,
  LogOut,
  Mail,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { getUserSession, clearUserSession, UserSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty-pending")({
  head: () => ({
    meta: [
      { title: "Account Verification Pending — ScholarNexus AI" },
      { name: "description", content: "Faculty account verification and administrative review status." },
    ],
  }),
  component: FacultyPendingPage,
});

function FacultyPendingPage() {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setUser(session);
  }, []);

  const handleLogout = () => {
    clearUserSession();
    toast.success("Logged out successfully.");
    window.location.href = "/login";
  };

  const handleContactAdmin = () => {
    window.location.href = "mailto:scholarnexusadmin@gmail.com?subject=Faculty%20Account%20Verification%20Inquiry";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 md:p-10">
      {/* Top Brand Nav Header */}
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-emerald-500 shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">ScholarNexus AI</h1>
            <p className="text-[0.68rem] text-muted-foreground font-medium">Academic Research Ecosystem</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" /> Logout
        </Button>
      </header>

      {/* Main Verification Status Area */}
      <main className="mx-auto my-auto w-full max-w-2xl py-8 space-y-6">
        {/* Verification Alert Header */}
        <Card className="rounded-3xl border-amber-500/30 bg-amber-500/5 p-6 md:p-8 shadow-sm space-y-4 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/20 text-amber-500 mx-auto animate-pulse">
            <Clock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <Badge
              variant="outline"
              className="rounded-full border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-300 px-3 py-1 text-xs font-semibold"
            >
              Pending Admin Verification
            </Badge>

            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Welcome, {user?.name || "Faculty Member"}
            </h2>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Your faculty registration has been submitted successfully. Your account is currently under review.
              You will gain access to the Faculty Dashboard once your account has been approved by system administration.
            </p>
          </div>
        </Card>

        {/* Submitted Academic Information Card */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" /> Submitted Registration Attributes
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-2xl border border-border bg-background p-3.5 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1.5 font-medium">
                <Building className="h-3.5 w-3.5 text-primary" /> Institution
              </span>
              <p className="font-bold text-foreground truncate">{user?.institution || user?.affiliation || "ScholarNexus Partner Institute"}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-3.5 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1.5 font-medium">
                <Award className="h-3.5 w-3.5 text-indigo-500" /> Department & Title
              </span>
              <p className="font-bold text-foreground truncate">{user?.department || "Computer Science"} — {user?.designation || "Faculty Advisor"}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-3.5 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1.5 font-medium">
                <GraduationCap className="h-3.5 w-3.5 text-amber-500" /> Faculty Employee ID
              </span>
              <p className="font-mono font-bold text-foreground">{user?.facultyId || "FAC-2026-PENDING"}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-3.5 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1.5 font-medium">
                <BookOpen className="h-3.5 w-3.5 text-emerald-500" /> Research Domain
              </span>
              <p className="font-bold text-foreground truncate">{user?.researchInterests || "Academic Research & Artificial Intelligence"}</p>
            </div>
          </div>
        </Card>

        {/* Verification Timeline */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" /> Verification Progress Timeline
          </h3>

          <div className="grid gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-center space-y-1">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white mx-auto">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-[0.75rem]">Account Created</p>
              <p className="text-[0.65rem] text-muted-foreground">Credentials Set</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-center space-y-1">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white mx-auto">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-[0.75rem]">Info Submitted</p>
              <p className="text-[0.65rem] text-muted-foreground">Proof Uploaded</p>
            </div>

            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-center space-y-1 animate-pulse">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-amber-500 text-white mx-auto">
                <Clock className="h-4 w-4" />
              </div>
              <p className="font-bold text-amber-600 dark:text-amber-300 text-[0.75rem]">Admin Review</p>
              <p className="text-[0.65rem] text-amber-600 dark:text-amber-300">Under Review</p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-3 text-center space-y-1 opacity-60">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground mx-auto">
                <Lock className="h-4 w-4" />
              </div>
              <p className="font-semibold text-muted-foreground text-[0.75rem]">Dashboard Access</p>
              <p className="text-[0.65rem] text-muted-foreground">Pending Approval</p>
            </div>
          </div>
        </Card>

        {/* Quick Action Footer Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleContactAdmin}
            className="w-full sm:w-auto gap-2 rounded-xl text-xs font-semibold"
          >
            <Mail className="h-4 w-4 text-primary" /> Contact Administrator
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto gap-2 rounded-xl text-xs font-semibold text-muted-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-4xl text-center text-xs text-muted-foreground border-t border-border pt-4">
        ScholarNexus AI Platform &copy; 2026. Academic Faculty Verification Portal.
      </footer>
    </div>
  );
}
