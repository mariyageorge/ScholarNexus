import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — ScholarNexus AI" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-3xl bg-primary/15 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Privacy Policy
              </p>
              <h1 className="mt-3 text-3xl font-bold text-foreground">ScholarNexus AI Privacy</h1>
            </div>
          </div>

          <Card className="rounded-3xl border border-border bg-background/70 p-6 shadow-sm">
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                ScholarNexus AI collects only the information necessary to provide your research
                workspace, authenticate your account, and support role-based access. Data is
                stored securely and only used in accordance with this policy.
              </p>
              <p>
                We respect your privacy and do not share personal information without your
                consent. Our platform uses encrypted communication and secure storage measures to
                protect your account data.
              </p>
              <p>
                If you have questions about data handling, contact our support team for detailed
                assistance.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Ready to continue?</p>
              <p>Return to login to access your ScholarNexus account.</p>
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
