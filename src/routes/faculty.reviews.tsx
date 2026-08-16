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
            <Badge variant="outline" className="rounded-full border-primary/30 text-primary bg-primary/10 text-xs font-semibold">
              Faculty Mentorship
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
              Reviews & Feedback
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review student research work and provide academic feedback.
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
                  <Card key={rev.id} className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4 hover:border-primary/30 transition-all">
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
                        className="rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md gap-1.5 h-9 px-5"
                      >
                        <MessageSquare className="h-4 w-4" /> Review & Provide Feedback
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

        {/* FULL RESEARCH WORK REVIEW & FEEDBACK MODAL */}
        <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] rounded-3xl p-6 overflow-y-auto space-y-6">
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs font-semibold">
                      {workDocDetail?.templateType || selectedReview?.fileType || "Research Work Document"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        selectedReview?.status === "Pending Review"
                          ? "border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs font-semibold"
                          : "border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold"
                      }
                    >
                      {selectedReview?.status || "Pending Review"}
                    </Badge>
                  </div>
                  <DialogTitle className="text-xl font-bold text-foreground">
                    {selectedReview?.documentTitle}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Student Scholar: <strong className="text-foreground">{selectedReview?.studentName}</strong> ({selectedReview?.studentEmail}) • Project: <strong className="text-foreground">{selectedReview?.projectTitle}</strong>
                  </DialogDescription>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <span>Requested Date: <strong className="text-foreground">{selectedReview?.requestedAt ? new Date(selectedReview.requestedAt).toLocaleDateString() : "Recently"}</strong></span>
                </div>
              </div>
            </DialogHeader>

            {/* COMPLETE DOCUMENT SECTIONS VIEW */}
            <div className="space-y-6">
              {loadingWorkDoc ? (
                <div className="py-12 text-center space-y-2">
                  <Clock className="h-8 w-8 text-primary mx-auto animate-spin" />
                  <p className="text-xs text-muted-foreground">Loading complete research work document sections...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* ABSTRACT SECTION */}
                  <div className="space-y-2 border-b border-border pb-5">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" /> Abstract
                    </h3>
                    {workDocDetail?.abstract ? (
                      <p className="text-xs text-foreground italic leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border/60">
                        "{workDocDetail.abstract}"
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-border/50">
                        No abstract provided.
                      </p>
                    )}
                  </div>

                  {/* KEYWORDS SECTION */}
                  {workDocDetail?.keywords && workDocDetail.keywords.length > 0 && (
                    <div className="space-y-2 border-b border-border pb-5">
                      <h3 className="text-xs font-bold text-foreground">Keywords</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {workDocDetail.keywords.map((kw: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="rounded-xl text-[0.7rem] px-2.5 py-0.5 font-medium">
                            #{kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ALL COMPLETE DOCUMENT SECTIONS */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">
                      Document Content & Academic Sections
                    </h3>
                    {workDocDetail?.sections && workDocDetail.sections.length > 0 ? (
                      workDocDetail.sections.map((sec: any, idx: number) => (
                        <div key={sec.id || idx} className="space-y-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">{idx + 1}</span>
                            {sec.title}
                          </h4>
                          {sec.content ? (
                            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap pt-1 font-sans">
                              {sec.content}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic pt-1">
                              Section content empty.
                            </p>
                          )}
                        </div>
                      ))
                    ) : selectedReview?.fileData ? (
                      <div className="rounded-2xl border border-border bg-slate-950 p-4 text-slate-200 overflow-y-auto font-mono text-[0.75rem] max-h-96">
                        {selectedReview.fileData.startsWith("data:application/pdf") ? (
                          <iframe src={selectedReview.fileData} className="w-full h-80 rounded-xl" title="PDF Document Preview" />
                        ) : (
                          <p className="whitespace-pre-wrap">{selectedReview.fileData}</p>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center border border-dashed border-border rounded-2xl">
                        <p className="text-xs text-muted-foreground italic">No document sections available.</p>
                      </div>
                    )}
                  </div>

                  {/* FACULTY REVIEW & FEEDBACK SECTION */}
                  <div className="space-y-3 pt-4 border-t border-border bg-muted/20 p-5 rounded-3xl border">
                    <label className="font-bold text-foreground flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-primary" /> Faculty Review & Academic Feedback
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Provide structured academic guidance, corrections, and review notes for the student's research work.
                    </p>
                    <Textarea
                      placeholder="Enter constructive academic feedback for this research document..."
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      rows={5}
                      className="rounded-2xl text-xs border-border bg-background"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setSelectedReview(null)} className="rounded-xl text-xs">
                        Close Viewer
                      </Button>
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={submitting || !feedbackInput.trim()}
                        className="rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {submitting ? "Submitting Feedback..." : "Submit Feedback"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
