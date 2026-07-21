import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — ScholarNexus AI" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-3xl bg-accent/15 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Terms & Conditions
              </p>
              <h1 className="mt-3 text-3xl font-bold text-foreground">ScholarNexus AI Terms</h1>
            </div>
          </div>

          <Card className="rounded-3xl border border-border bg-background/70 p-6 shadow-sm">
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                These terms set out the rules and responsibilities for using ScholarNexus AI. By
                accessing or using the platform, you agree to comply with the policies and
                permitted use guidelines defined by ScholarNexus.
              </p>
              <p>
                ScholarNexus AI is provided for academic use by students and faculty. Access to
                dashboard features is role-based and assigned through your registered account.
              </p>
              <p>
                Any use of the platform that violates the terms, including unauthorized access,
                misuse of content, or sharing credentials, may result in account suspension.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Need to sign in?</p>
              <p>Use the login link below to access your ScholarNexus workspace.</p>
            </div>
            <Button asChild className="rounded-full">
              <Link to="/login">Go to login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
