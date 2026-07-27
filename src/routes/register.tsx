import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Lock, User, GraduationCap, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/google-icon";
import { signInWithGoogle } from "@/lib/firebase";
import { getHomePathForRole, setUserSession, type UserSession } from "@/lib/session";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — SCHOLAR NEXUS" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!acceptedTerms) {
      setErrorMessage("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Unable to create account.");
      } else {
        window.location.href = "/login?registered=true";
      }
    } catch (error) {
      setErrorMessage("Unable to reach the server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!acceptedTerms) {
      setErrorMessage("You must agree to the Terms of Service and Privacy Policy before signing up with Google.");
      return;
    }

    setIsGoogleLoading(true);

    try {
      const credential = await signInWithGoogle();
      const user = credential.user;

      if (!user.email || !user.providerId) {
        throw new Error("Google sign-up failed to provide required user information.");
      }

      const response = await fetch("/api/oauth-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          providerId: user.uid,
          email: user.email,
          name: user.displayName ?? user.email,
          photoURL: user.photoURL ?? undefined,
          role,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data?.error ?? "Google sign-up failed.");
        return;
      }

      const userPayload: UserSession = {
        email: data.email,
        role: data.role ?? role,
        name: data.name,
        profileCompleted: data.profileCompleted,
        displayName: data.displayName,
        affiliation: data.affiliation,
        bio: data.bio,
        provider: data.provider,
        providerId: data.providerId,
        photoURL: data.photoURL,
      };
      setUserSession(userPayload);
      localStorage.removeItem("scholarnexusRemember");
      window.location.href = getHomePathForRole(data.role ?? role);
    } catch (error) {
      console.error("Google sign-up failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error ?? "Unable to sign up with Google.");
      setErrorMessage(`Unable to sign up with Google. ${errorMessage}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Research Account"
      subtitle="Join the academic research ecosystem for students and faculty"
      footer={
        <div className="text-xs text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-emerald-500 hover:underline">
            Sign In to Research Hub
          </Link>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400">
            {successMessage}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold text-foreground">
            Full Name
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Chen"
              className="pl-10 rounded-xl focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-foreground">
            Institutional Email Address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="pl-10 rounded-xl focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-foreground">
            Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="pl-10 pr-10 rounded-xl focus-visible:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">Academic Role</Label>
          <RadioGroup
            defaultValue="student"
            value={role}
            onValueChange={setRole}
            className="grid grid-cols-2 gap-2"
          >
            {[
              { v: "student", l: "Student Scholar", sub: "Course Access" },
              { v: "faculty", l: "Faculty / Instructor", sub: "Course Reviewer" },
            ].map((r) => (
              <label
                key={r.v}
                className="flex cursor-pointer flex-col rounded-xl border border-border p-3 text-xs font-medium transition duration-150 hover:border-emerald-500/50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/10"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={r.v} />
                  <span className="font-bold">{r.l}</span>
                </div>
                <span className="mt-1 text-[0.65rem] font-semibold text-emerald-400 pl-6">{r.sub}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-start gap-2 pt-1">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(Boolean(checked))}
            className="mt-0.5"
          />
          <Label htmlFor="terms" className="text-xs font-normal leading-relaxed text-muted-foreground">
            I agree to the SCHOLAR NEXUS{" "}
            <Link to="/terms" className="text-emerald-500 font-semibold hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-emerald-500 font-semibold hover:underline">
              Privacy Policy
            </Link>
            .
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 shadow-md shadow-emerald-600/25 transition duration-150"
          disabled={isSubmitting}
        >
          <GraduationCap className="h-4 w-4" />
          {isSubmitting ? "Creating Account..." : "Create Research Account"}
        </Button>

        <div className="relative py-2">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-[0.7rem] uppercase font-bold tracking-wider text-muted-foreground">
            or continue with
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2.5 rounded-xl py-2.5 font-semibold text-xs border-border hover:bg-muted/30 transition duration-150"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isSubmitting}
        >
          <GoogleIcon className="h-4 w-4 shrink-0" />
          {isGoogleLoading ? "Connecting to Google..." : "Sign up with Google Workspace"}
        </Button>
      </form>
    </AuthLayout>
  );
}

