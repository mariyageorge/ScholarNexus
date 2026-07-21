import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { sendFirebasePasswordReset } from "@/lib/firebase";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({ meta: [{ title: "Verify Code — ScholarNexus AI" }] }),
  component: OtpPage,
});

function OtpPage() {
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  const getSavedEmail = () => {
    if (typeof window === "undefined") return "";
    const searchParams = new URLSearchParams(window.location.search);
    return (
      searchParams.get("email") ||
      sessionStorage.getItem("resetEmail") ||
      localStorage.getItem("resetEmail") ||
      ""
    );
  };

  const email = getSavedEmail();

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (otp.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code sent to your email.");
      return;
    }

    if (!email) {
      setErrorMessage("Email address missing. Please return to the Forgot Password page.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Invalid or expired verification code.");
      } else {
        setSuccessMessage("Code verified successfully! Moving to password reset window...");
        sessionStorage.setItem("verifiedOtp", otp);
        sessionStorage.setItem("resetEmail", email);
        localStorage.setItem("resetEmail", email);

        setTimeout(() => {
          navigate({ to: "/reset-password", search: { email } as any });
        }, 1000);
      }
    } catch (err) {
      setErrorMessage("Unable to verify code. Please check your network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMessage("Email address missing. Please return to Forgot Password.");
      return;
    }

    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      try {
        await sendFirebasePasswordReset(email);
      } catch (fbErr) {
        console.warn("Firebase resend note:", fbErr);
      }

      setSuccessMessage("Verification code email re-sent from Firebase!");
    } catch (err) {
      setErrorMessage("Unable to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify Identity"
      subtitle={`Enter the 6-digit verification code sent via Firebase to ${email || "your registered email"}`}
      footer={
        <div className="text-xs text-muted-foreground">
          Didn't receive the code in your mail?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-bold text-emerald-500 hover:underline disabled:opacity-50"
          >
            {isResending ? "Resending..." : "Resend Code via Firebase"}
          </button>
        </div>
      }
    >
      <form className="space-y-6" onSubmit={handleVerify}>
        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="flex justify-center py-2">
          <InputOTP maxLength={6} value={otp} onChange={(val) => setOtp(val)}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || otp.length < 6}
          className="w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 shadow-md shadow-emerald-600/25 transition duration-150"
        >
          <ShieldCheck className="h-4 w-4" />
          {isSubmitting ? "Verifying Code..." : "Verify Code & Move to Reset Password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
