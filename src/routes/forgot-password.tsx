import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — ScholarNexus AI" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid university email address (e.g. scholar@university.edu).");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Verify registered user in database & dispatch OTP email via SMTP
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data?.error ?? "This email address is not registered in ScholarNexus AI. Please check your email or create an account."
        );
      } else {
        sessionStorage.setItem("resetEmail", email.trim());
        localStorage.setItem("resetEmail", email.trim());

        setSuccessMessage("A 6-digit verification code has been sent to your email address! Redirecting...");

        setTimeout(() => {
          navigate({ to: "/verify-otp", search: { email: email.trim() } as any });
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error. Unable to connect to authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your registered university email to receive a 6-digit verification code"
      footer={
        <div className="text-xs text-muted-foreground">
          Remembered your password?{" "}
          <Link to="/login" className="font-bold text-emerald-500 hover:underline">
            Back to Sign In
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground">
            Registered Email Address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="scholar@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 rounded-xl focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 shadow-md shadow-emerald-600/25 transition duration-150"
        >
          {isSubmitting ? "Sending Verification Code..." : "Send Verification Code"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}
