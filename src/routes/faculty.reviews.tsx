import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Quote,
  FileText,
  CheckCircle2,
  MessageSquare,
  Clock,
  User,
  BookOpen,
  Eye,
  Download,
  Calendar,
  Send,
  Sparkles,
  Inbox,
  Filter,
} from "lucide-react";
import { getUserSession, UserSession } from "@/lib/session";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews & Feedback — ScholarNexus AI Faculty" },
      { name: "description", content: "Academic manuscript review and student research feedback portal." },
    ],
  }),
  component: FacultyReviewsPage,
});

interface ReviewRequest {
  id: string;
  _id?: string;
  projectId: string;
  projectTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  facultyId: string;
  facultyName: string;
  facultyEmail: string;
  documentId: string;
  documentTitle: string;
  fileType: string;
  fileData?: string;
  url?: string;
  feedback: string;
  status: "Pending Review" | "Reviewed";
  requestedAt: string;
  reviewedAt?: string | null;
}

function FacultyReviewsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [reviews, setReviews] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  // Selected Review Modal State
  const [selectedReview, setSelectedReview] = useState<ReviewRequest | null>(null);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [workDocDetail, setWorkDocDetail] = useState<any | null>(null);
  const [loadingWorkDoc, setLoadingWorkDoc] = useState(false);

  useEffect(() => {
    const user = getUserSession();
    if (user) {
      setSession(user);
      fetchFacultyReviews(user.email);
    }
  }, []);

  const fetchFacultyReviews = async (facultyEmail: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?facultyEmail=${encodeURIComponent(facultyEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setReviews(data);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("Failed to load review requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = async (rev: ReviewRequest) => {
    setSelectedReview(rev);
    setFeedbackInput(rev.feedback || "");
    setWorkDocDetail(null);

    if (rev.documentId) {
      setLoadingWorkDoc(true);
      try {
        const res = await fetch(`/api/research-work?id=${encodeURIComponent(rev.documentId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.title) {
            setWorkDocDetail(data);
          }
        }
      } catch (err) {
        console.error("Error fetching research work details:", err);
      } finally {
        setLoadingWorkDoc(false);
      }
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedReview || !feedbackInput.trim()) {
      toast.error("Please enter constructive academic feedback before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedReview.id,
          feedback: feedbackInput.trim(),
        }),
      });

      if (res.ok) {
        toast.success(`Feedback submitted for "${selectedReview.documentTitle}" successfully.`);
        
        // Immediate UI state update without full reload
        setReviews((prev) =>
          prev.map((r) =>
            r.id === selectedReview.id
              ? {
                  ...r,
                  feedback: feedbackInput.trim(),
                  status: "Reviewed",
                  reviewedAt: new Date().toISOString(),
                }
              : r
          )
        );

        setSelectedReview(null);
        setFeedbackInput("");
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to submit review feedback.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingReviews = reviews.filter((r) => r.status === "Pending Review");
  const completedReviews = reviews.filter((r) => r.status === "Reviewed");

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <Badge variant="outline" className="rounded-full border-purple-500/30 text-purple-500 bg-purple-500/10 text-xs font-semibold">
              Academic Feedback Portal
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
              Reviews & Feedback
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review research documents, draft manuscripts, and provide structured academic feedback to your supervised scholars
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              Pending: {pendingReviews.length}
            </span>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              Reviewed: {completedReviews.length}
            </span>
          </div>
        </div>

        {/* Reviews Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/60 p-1 rounded-2xl border border-border w-full sm:w-auto justify-start">
            <TabsTrigger value="pending" className="rounded-xl text-xs font-semibold gap-2 px-5 py-2.5">
              <Clock className="h-4 w-4 text-amber-500" /> Pending Reviews ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="rounded-xl text-xs font-semibold gap-2 px-5 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Reviewed ({completedReviews.length})
            </TabsTrigger>
          </TabsList>

          {/* PENDING REVIEWS SECTION */}
          <TabsContent value="pending" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-3xl" />
                ))}
              </div>
            ) : pendingReviews.length === 0 ? (
              <Card className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3">
                <Inbox className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="text-base font-bold text-foreground">No Pending Review Requests</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  When scholars assigned to you submit research documents for review, they will appear here.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((rev) => (
                  <Card key={rev.id} className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4 hover:border-purple-500/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 font-bold shrink-0 border border-amber-500/20">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-foreground text-sm leading-snug">{rev.documentTitle}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-foreground">
                              <User className="h-3.5 w-3.5 text-indigo-500" /> Student: {rev.studentName}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5 text-emerald-500" /> Project: {rev.projectTitle}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs font-semibold w-fit">
                        Pending Review
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Requested Date: <strong className="text-foreground">{new Date(rev.requestedAt).toLocaleDateString()}</strong>
                      </span>

                      <Button
                        size="sm"
                        onClick={() => handleOpenReviewModal(rev)}
                        className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md gap-1.5 h-9 px-5"
                      >
                        <MessageSquare className="h-4 w-4" /> Review
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REVIEWED SECTION */}
          <TabsContent value="reviewed" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-3xl" />
                ))}
              </div>
            ) : completedReviews.length === 0 ? (
              <Card className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="text-base font-bold text-foreground">No Reviewed Documents Yet</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Completed academic reviews and published student feedback will be stored here.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedReviews.map((rev) => (
                  <Card key={rev.id} className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4 hover:border-emerald-500/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold shrink-0 border border-emerald-500/20">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-foreground text-sm leading-snug">{rev.documentTitle}</h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="font-semibold text-foreground">Student: {rev.studentName}</span>
                            <span>•</span>
                            <span>Project: {rev.projectTitle}</span>
                          </div>
                        </div>
                      </div>

                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold w-fit">
                        Reviewed
                      </Badge>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1 text-xs">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" /> Published Academic Feedback:
                      </span>
                      <p className="text-foreground italic leading-relaxed">"{rev.feedback}"</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                      <span>Reviewed on: <strong className="text-foreground">{rev.reviewedAt ? new Date(rev.reviewedAt).toLocaleDateString() : "Completed"}</strong></span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReviewModal(rev)}
                        className="rounded-xl text-xs font-semibold h-8 gap-1.5"
                      >
                        Edit Feedback
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* REVIEW SCREEN / FEEDBACK MODAL */}
        <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
          <DialogContent className="sm:max-w-2xl rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Quote className="h-5 w-5 text-purple-500" /> Review Document & Provide Academic Feedback
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Evaluate student submission and submit constructive guidance
              </DialogDescription>
            </DialogHeader>

            {selectedReview && (
              <div className="space-y-5 py-2 text-xs">
                {/* Header Information Grid */}
                <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-border bg-muted/30 p-4">
                  <div>
                    <span className="text-muted-foreground block text-[0.7rem]">Student Scholar</span>
                    <span className="font-bold text-foreground text-sm">{selectedReview.studentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[0.7rem]">Research Project</span>
                    <span className="font-bold text-foreground text-sm truncate block">{selectedReview.projectTitle}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[0.7rem]">Document / Paper Name</span>
                    <span className="font-semibold text-foreground">{selectedReview.documentTitle}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[0.7rem]">Requested Date</span>
                    <span className="font-semibold text-foreground">{new Date(selectedReview.requestedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Document Viewer / Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" /> Student Research Document Viewer
                    </span>
                    {workDocDetail?.templateType && (
                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs font-semibold">
                        {workDocDetail.templateType}
                      </Badge>
                    )}
                  </div>

                  <div className="h-64 rounded-2xl border border-border bg-card p-4 text-foreground overflow-y-auto space-y-4 text-xs font-mono">
                    {loadingWorkDoc ? (
                      <p className="text-muted-foreground italic text-center py-8">Loading research work sections...</p>
                    ) : workDocDetail ? (
                      <div className="space-y-4 font-sans">
                        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
                          <span className="font-bold text-primary block text-[0.7rem]">Abstract</span>
                          <p className="text-foreground italic">{workDocDetail.abstract || "Not added yet"}</p>
                        </div>

                        {workDocDetail.sections?.map((sec: any, idx: number) => (
                          <div key={sec.id || idx} className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1.5">
                            <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                              <span className="text-[0.65rem] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">{idx + 1}</span>
                              {sec.title}
                            </h4>
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                              {sec.content || <em className="text-muted-foreground">Not added yet</em>}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : selectedReview.fileData?.startsWith("data:application/pdf") ? (
                      <iframe src={selectedReview.fileData} className="w-full h-full rounded-xl" title="Document PDF Preview" />
                    ) : selectedReview.fileData ? (
                      <p className="whitespace-pre-wrap">{selectedReview.fileData.slice(0, 1000)}...</p>
                    ) : (
                      <div className="grid h-full place-items-center text-center text-muted-foreground font-sans">
                        <div>
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50 text-primary" />
                          <p className="font-semibold text-foreground">{selectedReview.documentTitle}</p>
                          <p className="text-[0.7rem] text-muted-foreground mt-1">Submitted for academic faculty evaluation.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Faculty Feedback Form */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                    <MessageSquare className="h-4 w-4 text-primary" /> Faculty Feedback
                  </label>
                  <Textarea
                    placeholder="Enter constructive academic feedback..."
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    rows={5}
                    className="rounded-2xl text-xs border-border"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setSelectedReview(null)} className="rounded-xl text-xs font-semibold">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={submitting || !feedbackInput.trim()}
                className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> {submitting ? "Submitting Feedback..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
