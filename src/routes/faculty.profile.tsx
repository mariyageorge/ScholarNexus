import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Building, Award, BookOpen, Mail, Phone, ShieldCheck, Edit3 } from "lucide-react";
import { getUserSession, UserSession } from "@/lib/session";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/faculty/profile")({
  head: () => ({
    meta: [
      { title: "Research Profile — ScholarNexus AI Faculty" },
      { name: "description", content: "Faculty academic profile and research portfolio." },
    ],
  }),
  component: FacultyProfilePage,
});

function FacultyProfilePage() {
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const user = getUserSession();
    if (user) setSession(user);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold">
              Academic Credentials
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
              Faculty Research Profile
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your verified academic profile, research interests, and lab info
            </p>
          </div>

          <Button variant="outline" className="gap-2 rounded-xl text-xs font-semibold">
            <Edit3 className="h-4 w-4" /> Edit Profile Details
          </Button>
        </div>

        <Card className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-500 font-bold text-2xl border border-emerald-500/20">
              {session?.name ? session.name.charAt(0) : "P"}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{session?.name || "Faculty Member"}</h2>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Approved Faculty
                </Badge>
              </div>
              <p className="text-xs font-semibold text-muted-foreground">{session?.designation || "Associate Professor"} • {session?.department || "Department of Computer Science"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <Building className="h-3.5 w-3.5 text-primary" /> {session?.institution || "ScholarNexus Partner University"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border">
            <div className="rounded-2xl border border-border bg-background p-4 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1 font-medium">
                <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
              </span>
              <p className="font-bold text-foreground text-xs">{session?.email}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1 font-medium">
                <Phone className="h-3.5 w-3.5 text-emerald-500" /> Phone Number
              </span>
              <p className="font-bold text-foreground text-xs">{session?.phone || "+1 (555) 019-2834"}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1 font-medium">
                <Award className="h-3.5 w-3.5 text-indigo-500" /> Faculty Employee ID
              </span>
              <p className="font-mono font-bold text-foreground text-xs">{session?.facultyId || "FAC-2026-9812"}</p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-4 space-y-1">
              <span className="text-[0.68rem] text-muted-foreground flex items-center gap-1 font-medium">
                <BookOpen className="h-3.5 w-3.5 text-amber-500" /> ORCID Identifier
              </span>
              <p className="font-mono font-bold text-foreground text-xs">{session?.orcid || "0000-0002-1825-0097"}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Research Focus & Domains</h3>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-medium text-foreground leading-relaxed">
                {session?.researchInterests || "Artificial Intelligence, Deep Learning, Graph Neural Networks, and Distributed Edge Computing Systems."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
