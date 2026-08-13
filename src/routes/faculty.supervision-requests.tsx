import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserCheck, Clock, CheckCircle2, XCircle, Search, Eye, MessageSquare, AlertCircle, ExternalLink, Loader2, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getUserSession, UserSession } from "@/lib/session";
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
  _id?: string;
  projectId: string;
  studentName: string;
  studentEmail: string;
  email: string;
  projectTitle: string;
  domain: string;
  hasResearchWork?: boolean;
  abstract?: string | null;
  methodology?: string | null;
  proposalSummary?: string;
  message?: string;
  submittedAt: string;
  requestedAt?: string;
  status: "Pending" | "Approved" | "Rejected" | "Accepted" | "Declined";
  facultyRemarks?: string;
}

const REJECTION_REASON_PRESETS = [
  "Maximum supervision capacity reached",
  "Research area mismatch",
  "Currently unavailable",
];

function SupervisionRequestsPage() {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== "undefined") return getUserSession();
    return null;
  });

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Pending");

  // Rejection Modal State
  const [rejectingRequest, setRejectingRequest] = useState<RequestItem | null>(null);
  const [selectedPresetReason, setSelectedPresetReason] = useState<string>("");
  const [customRejectionReason, setCustomRejectionReason] = useState<string>("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // View Project Detail Modal State
  const [viewingProjectRequest, setViewingProjectRequest] = useState<RequestItem | null>(null);

  useEffect(() => {
    const session = getUserSession();
    if (session) setUser(session);
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const session = getUserSession();
      const emailQuery = session?.email ? `?facultyEmail=${encodeURIComponent(session.email)}` : "";
      const res = await fetch(`/api/faculty/supervision-requests${emailQuery}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setRequests(data);
      }
    } catch (err) {
      console.error("Error fetching supervision requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: RequestItem) => {
    setSubmittingAction(true);
    try {
      const res = await fetch("/api/supervision-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id || request._id, status: "Approved" }),
      });

      if (res.ok) {
        toast.success(`Approved supervision request for ${request.studentName}. Project updated.`);
        setRequests((prev) =>
          prev.map((item) =>
            (item.id === request.id || item._id === request._id)
              ? { ...item, status: "Approved" }
              : item
          )
        );
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to approve request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const openRejectModal = (request: RequestItem) => {
    setRejectingRequest(request);
    setSelectedPresetReason(REJECTION_REASON_PRESETS[0]);
    setCustomRejectionReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    const finalReason = customRejectionReason.trim() || selectedPresetReason;

    if (!finalReason) {
      toast.error("Please select or enter a reason for rejecting the request.");
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await fetch("/api/supervision-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rejectingRequest.id || rejectingRequest._id,
          status: "Rejected",
          facultyRemarks: finalReason,
        }),
      });

      if (res.ok) {
        toast.info(`Supervision request from ${rejectingRequest.studentName} declined.`);
        setRequests((prev) =>
          prev.map((item) =>
            (item.id === rejectingRequest.id || item._id === rejectingRequest._id)
              ? { ...item, status: "Rejected", facultyRemarks: finalReason }
              : item
          )
        );
        setRejectingRequest(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to decline request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting rejection.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const nameMatch = (req.studentName || "").toLowerCase().includes(q);
    const titleMatch = (req.projectTitle || "").toLowerCase().includes(q);
    const domainMatch = (req.domain || "").toLowerCase().includes(q);

    return matchesStatus && (nameMatch || titleMatch || domainMatch);
  });

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

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Search by student name, title, or domain…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {["Pending", "Approved", "Rejected", "All"].map((st) => (
              <Button
                key={st}
                size="sm"
                variant={statusFilter === st ? "default" : "outline"}
                onClick={() => setStatusFilter(st)}
                className="rounded-xl text-xs font-semibold px-3 py-1.5"
              >
                {st}
              </Button>
            ))}
          </div>
        </div>

        {/* Request List Cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-3xl border border-border p-6 animate-pulse bg-card/50 h-40" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
            <UserCheck className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-base font-bold text-foreground">No supervision requests found</h3>
            <p className="text-xs text-muted-foreground">
              {statusFilter === "Pending"
                ? "There are currently no pending supervision requests from students."
                : "No requests match your selected filters."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const isPending = req.status === "Pending";
              const isApproved = req.status === "Approved" || req.status === "Accepted";
              const isRejected = req.status === "Rejected" || req.status === "Declined";

              return (
                <Card key={req.id || req._id} className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary font-bold">
                        <UserCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{req.studentName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {req.studentEmail || req.email} • Domain: <span className="font-semibold text-foreground">{req.domain}</span>
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={
                        isPending
                          ? "border-amber-500/30 text-amber-500 bg-amber-500/10 font-bold"
                          : isApproved
                          ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 font-bold"
                          : "border-destructive/30 text-destructive bg-destructive/10 font-bold"
                      }
                    >
                      {isPending ? "Pending" : isApproved ? "Approved" : "Rejected"}
                    </Badge>
                  </div>

                  {/* Details Container */}
                  <div className="rounded-2xl border border-border/80 bg-background p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground text-xs sm:text-sm">{req.projectTitle}</h4>
                      <span className="text-[0.68rem] text-muted-foreground">
                        Requested on {req.submittedAt}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">Abstract & Methodology:</p>
                      {!req.hasResearchWork ? (
                        <p className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded-xl border border-border/60">
                          No research work has been created yet.
                        </p>
                      ) : (
                        <div className="space-y-1.5 text-xs bg-muted/20 p-3 rounded-xl border border-border/60">
                          <p className="text-muted-foreground leading-relaxed line-clamp-2">
                            <span className="font-semibold text-foreground">Abstract: </span>
                            {req.abstract ? req.abstract : <span className="italic text-muted-foreground font-normal">No abstract provided yet.</span>}
                          </p>
                          {req.methodology && (
                            <p className="text-muted-foreground leading-relaxed line-clamp-2">
                              <span className="font-semibold text-foreground">Methodology: </span>
                              {req.methodology}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {req.message && (
                      <div className="rounded-xl border border-muted bg-muted/30 p-3 text-xs text-foreground space-y-0.5">
                        <span className="font-semibold text-primary flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" /> Student Message:
                        </span>
                        <p className="text-xs italic leading-relaxed">"{req.message}"</p>
                      </div>
                    )}

                    {isRejected && req.facultyRemarks && (
                      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                        <span className="font-bold block mb-0.5">Rejection Reason:</span>
                        <p>"{req.facultyRemarks}"</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewingProjectRequest(req)}
                      className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <Eye className="h-4 w-4" /> View Project Details
                    </Button>

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRejectModal(req)}
                          disabled={submittingAction}
                          className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req)}
                          disabled={submittingAction}
                          className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Dialog requiring reason */}
      <Dialog open={Boolean(rejectingRequest)} onOpenChange={(open) => !open && setRejectingRequest(null)}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-destructive">
              <XCircle className="h-5 w-5" /> Decline Supervision Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              A rejection reason is required before submitting. This reason will be shared with {rejectingRequest?.studentName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Select a standard reason:</Label>
              <div className="space-y-1.5">
                {REJECTION_REASON_PRESETS.map((preset) => (
                  <div
                    key={preset}
                    onClick={() => {
                      setSelectedPresetReason(preset);
                      setCustomRejectionReason("");
                    }}
                    className={`cursor-pointer rounded-xl border p-2.5 text-xs transition-all ${
                      selectedPresetReason === preset && !customRejectionReason
                        ? "border-destructive bg-destructive/10 font-semibold text-foreground"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    • {preset}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Or provide custom reason:</Label>
              <Textarea
                placeholder="Enter specific feedback or reason for declining supervision..."
                rows={3}
                value={customRejectionReason}
                onChange={(e) => {
                  setCustomRejectionReason(e.target.value);
                  if (e.target.value) setSelectedPresetReason("");
                }}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectingRequest(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReject}
              disabled={submittingAction || (!selectedPresetReason && !customRejectionReason.trim())}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold gap-1.5"
            >
              {submittingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Project Details Modal */}
      <Dialog open={Boolean(viewingProjectRequest)} onOpenChange={(open) => !open && setViewingProjectRequest(null)}>
        <DialogContent className="max-w-xl rounded-2xl border-border bg-card p-6 shadow-xl space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Eye className="h-5 w-5 text-primary" /> Project Details Overview
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review full details for supervision application.
            </DialogDescription>
          </DialogHeader>

          {viewingProjectRequest && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2">
                <p className="font-bold text-sm text-foreground">{viewingProjectRequest.projectTitle}</p>
                <p className="text-muted-foreground">Domain: <span className="font-semibold text-foreground">{viewingProjectRequest.domain}</span></p>
                <p className="text-muted-foreground">Student: <span className="font-semibold text-foreground">{viewingProjectRequest.studentName}</span> ({viewingProjectRequest.studentEmail})</p>
                <p className="text-muted-foreground">Submitted: {viewingProjectRequest.submittedAt}</p>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3 bg-background">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" /> Abstract & Methodology
                </h4>

                {!viewingProjectRequest.hasResearchWork ? (
                  <div className="rounded-lg bg-muted/40 p-3 text-muted-foreground italic">
                    No research work has been created yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-foreground mb-1">Abstract:</p>
                      {viewingProjectRequest.abstract ? (
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-3 rounded-lg border border-border/60">
                          {viewingProjectRequest.abstract}
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-border/60">
                          No abstract provided yet.
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-foreground mb-1">Methodology:</p>
                      {viewingProjectRequest.methodology ? (
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-3 rounded-lg border border-border/60">
                          {viewingProjectRequest.methodology}
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-border/60">
                          No methodology section provided yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {viewingProjectRequest.message && (
                <div>
                  <h4 className="font-bold text-foreground text-xs mb-1">Student Note</h4>
                  <p className="text-muted-foreground leading-relaxed bg-background p-3 rounded-xl border border-border italic">
                    "{viewingProjectRequest.message}"
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setViewingProjectRequest(null)}
              className="rounded-xl text-xs"
            >
              Close Preview
            </Button>
            <Button
              onClick={() => {
                if (viewingProjectRequest) {
                  window.location.href = `/projects/${viewingProjectRequest.projectId}`;
                }
              }}
              className="rounded-xl bg-primary text-xs font-bold text-primary-foreground gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open Full Project Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
