import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/google-icon";
import { signInWithGoogle } from "@/lib/firebase";
import { getHomePathForRole, setUserSession, type UserSession } from "@/lib/session";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { registered?: boolean } => ({
    registered: search.registered === "true" || search.registered === true ? true : undefined,
  }),
  head: () => ({ meta: [{ title: "Sign In — SCHOLAR NEXUS" }] }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    search.registered ? "Account created successfully! Please sign in with your credentials." : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter your university email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data?.error ?? "Invalid university email or password.");
        return;
      }

      const userPayload: UserSession = {
        email: data.email,
        role: data.role,
        name: data.name,
        profileCompleted: data.profileCompleted,
        displayName: data.displayName,
        affiliation: data.affiliation,
        bio: data.bio,
        provider: data.provider,
        providerId: data.providerId,
        photoURL: data.photoURL,
        status: data.status,
        approvalStatus: data.approvalStatus,
        institution: data.institution,
        department: data.department,
        designation: data.designation,
        facultyId: data.facultyId,
        researchInterests: data.researchInterests,
        areasOfExpertise: data.areasOfExpertise,
        orcid: data.orcid,
      };
      setUserSession(userPayload);
      if (remember) {
        localStorage.setItem("scholarnexusRemember", "true");
      } else {
        localStorage.removeItem("scholarnexusRemember");
      }

      window.location.href = getHomePathForRole(data.role, email, data.approvalStatus || data.status);
    } catch (error) {
      setErrorMessage("Unable to reach the server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      const credential = await signInWithGoogle();
      const user = credential.user;

      if (!user.email || !user.providerId) {
        throw new Error("Google sign-in failed to provide required user information.");
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
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data?.error ?? "Google login failed.");
        return;
      }

      const userPayload: UserSession = {
        email: data.email,
        role: data.role,
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
      window.location.href = getHomePathForRole(data.role, data.email);
    } catch (error) {
      console.error("Google sign-in failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error ?? "Unable to sign in with Google.");
      setErrorMessage(`Unable to sign in with Google. ${errorMessage}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back to ScholarNexus AI"
      subtitle="Sign in to manage research papers, projects, citations, and collaboration"
      footer={
        <div className="text-xs text-muted-foreground">
          New to ScholarNexus AI?{" "}
          <Link to="/register" className="font-bold text-emerald-500 hover:underline">
            Create an Account
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
          <Label htmlFor="email" className="text-xs font-semibold text-foreground">
            University Email Address
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground">
              Password
            </Label>
            <Link to="/forgot-password" className="text-xs font-medium text-emerald-500 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(checked) => setRemember(Boolean(checked))}
          />
          <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground">
            Keep me signed in on this device
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 shadow-md shadow-emerald-600/25 transition duration-150"
          disabled={isSubmitting}
        >
          <LogIn className="h-4 w-4" /> {isSubmitting ? "Authenticating..." : "Sign In to Research Hub"}
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
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          <GoogleIcon className="h-4 w-4 shrink-0" />
          {isGoogleLoading ? "Connecting..." : "Sign in with Google Workspace"}
        </Button>
      </form>
    </AuthLayout>
  );
}
