import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Quote, FileText, CheckCircle2, MessageSquare, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews & Feedback — ScholarNexus AI Faculty" },
      { name: "description", content: "Manuscript peer review and student paper feedback portal." },
    ],
  }),
  component: FacultyReviewsPage,
});

function FacultyReviewsPage() {
  const [reviews, setReviews] = useState([
    {
      id: "rev-1",
      paperTitle: "Neural Architecture Search for Edge Devices: A Survey",
      studentName: "Alex Chen",
      type: "Conference Manuscript Draft",
      submittedDate: "2026-08-01",
      status: "Review Pending",
    },
    {
      id: "rev-2",
      paperTitle: "Lattice-Based Post-Quantum Digital Signatures",
      studentName: "Ethan Vance",
      type: "Thesis Chapter 4",
      submittedDate: "2026-07-28",
      status: "Feedback Provided",
    },
  ]);

  const handleReviewAction = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Feedback Provided" } : r))
    );
    toast.success("Feedback submitted to scholar successfully.");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <Badge variant="outline" className="rounded-full border-purple-500/30 text-purple-500 bg-purple-500/10 text-xs font-semibold">
              Peer Review Hub
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
              Manuscript Reviews & Feedback
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review student draft submissions, thesis chapters, and conference papers
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {reviews.map((rev) => (
            <Card key={rev.id} className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-500 font-bold">
                    <Quote className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{rev.paperTitle}</h3>
                    <p className="text-xs text-muted-foreground">Scholar: <span className="font-semibold text-foreground">{rev.studentName}</span> • Type: {rev.type}</p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={
                    rev.status === "Review Pending"
                      ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                      : "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                  }
                >
                  {rev.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">Submitted: {rev.submittedDate}</span>
                {rev.status === "Review Pending" ? (
                  <Button
                    size="sm"
                    onClick={() => handleReviewAction(rev.id)}
                    className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                  >
                    <MessageSquare className="h-4 w-4 mr-1.5" /> Submit Review & Feedback
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold h-8">
                    View Published Feedback
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
