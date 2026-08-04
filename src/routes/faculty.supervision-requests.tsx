import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserCheck, Clock, CheckCircle2, XCircle, Search, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty/supervision-requests")({
  head: () => ({
    meta: [
      { title: "Supervision Requests — ScholarNexus AI Faculty" },
      { name: "description", content: "Student thesis and project supervision requests queue." },
    ],
  }),
  component: SupervisionRequestsPage,
});

interface RequestItem {
  id: string;
  studentName: string;
  email: string;
  projectTitle: string;
  domain: string;
  proposalSummary: string;
  submittedAt: string;
  status: "Pending" | "Accepted" | "Declined";
}

function SupervisionRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([
    {
      id: "req-101",
      studentName: "Alex Chen",
      email: "alex.chen@university.edu",
      projectTitle: "Neural Architecture Search for Lightweight LLMs",
      domain: "Artificial Intelligence",
      proposalSummary: "Focusing on hardware-aware NAS techniques for deploying transformer models on mobile hardware with ultra-low latency.",
      submittedAt: "2026-08-02",
      status: "Pending",
    },
    {
      id: "req-102",
      studentName: "Sophia Martinez",
      email: "sophia.m@university.edu",
      projectTitle: "Distributed Consensus Algorithms in Edge Computing",
      domain: "Distributed Systems",
      proposalSummary: "Investigating Byzantine fault-tolerant consensus mechanisms tailored for dynamic IoT edge node clusters.",
      submittedAt: "2026-08-01",
      status: "Pending",
    },
  ]);

  const handleAction = (id: string, newStatus: "Accepted" | "Declined") => {
    setRequests((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (newStatus === "Accepted") {
      toast.success("Supervision request accepted. Scholar added to your supervision list.");
    } else {
      toast.info("Supervision request declined.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <Badge variant="outline" className="rounded-full border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs font-semibold">
              Supervision Queue
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
              Supervision & Mentorship Requests
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review and act on student applications for thesis supervision and research guidance
            </p>
          </div>
        </div>

        {/* Request List Cards */}
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 font-bold">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{req.studentName}</h3>
                    <p className="text-xs text-muted-foreground">{req.email} • Domain: <span className="font-semibold text-foreground">{req.domain}</span></p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={
                    req.status === "Pending"
                      ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                      : req.status === "Accepted"
                      ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                      : "border-destructive/30 text-destructive bg-destructive/10"
                  }
                >
                  {req.status}
                </Badge>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4 space-y-2">
                <h4 className="font-bold text-foreground text-xs">{req.projectTitle}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{req.proposalSummary}</p>
                <span className="text-[0.68rem] text-muted-foreground block pt-1">Submitted on {req.submittedAt}</span>
              </div>

              {req.status === "Pending" && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(req.id, "Declined")}
                    className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction(req.id, "Accepted")}
                    className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Accept Supervision
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
