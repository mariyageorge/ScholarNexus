import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify-email")({
  head: () => ({ meta: [{ title: "Verify email — ScholarNexus AI" }] }),
  component: () => (
    <AuthLayout title="Check your inbox" subtitle="We've sent a verification link to your email.">
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-primary">
          <MailCheck className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">
          Click the link in the email to activate your account. It may take a minute to arrive.
        </p>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    </AuthLayout>
  ),
});
