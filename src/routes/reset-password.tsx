import { useState, useEffect, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Lock, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set New Password — ScholarNexus AI" }] }),
  component: ResetPage,
});

function ResetPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const emailParam =
      urlParams.get("email") ||
      sessionStorage.getItem("resetEmail") ||
      localStorage.getItem("resetEmail") ||
      "";

    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const targetEmail = email.trim() || sessionStorage.getItem("resetEmail") || localStorage.getItem("resetEmail") || "";

    if (!targetEmail || !emailRegex.test(targetEmail)) {
      setErrorMessage("Please enter your registered university email address.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update MongoDB database users collection so /api/login succeeds
      const dbResponse = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, newPassword }),
      });

      const dbData = await dbResponse.json();
      if (!dbResponse.ok) {
        throw new Error(dbData?.error ?? "Unable to update database password.");
      }

      setSuccessMessage("Password reset successfully! Redirecting to Sign In...");
      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("verifiedOtp");
      localStorage.removeItem("resetEmail");

      // Automatically navigate to Sign In session
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Enter your registered email and choose a strong password with at least 6 characters"
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

        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-xs font-semibold text-foreground">
            New Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 pr-10 rounded-xl focus-visible:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
            Confirm New Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10 rounded-xl focus-visible:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 shadow-md shadow-emerald-600/25 transition duration-150"
        >
          <ShieldCheck className="h-4 w-4" />
          {isSubmitting ? "Updating Password..." : "Update Password & Sign In"}
        </Button>
      </form>
    </AuthLayout>
  );
}
