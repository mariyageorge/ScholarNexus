import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { UserCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getHomePathForRole, getUserSession, setUserSession, type UserSession } from "@/lib/session";

export const Route = createFileRoute("/profile-setup")({
  head: () => ({ meta: [{ title: "Complete your profile — ScholarNexus AI" }] }),
  component: ProfileSetupPage,
});

function ProfileSetupPage() {
  const [displayName, setDisplayName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("scholarnexusUser");
    if (!raw) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(raw) as { email?: string };
      if (!user?.email) {
        window.location.href = "/login";
        return;
      }
      setEmail(user.email);
    } catch {
      window.location.href = "/login";
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage("Unable to find your login session. Please sign in again.");
      return;
    }

    if (!displayName.trim() || !affiliation.trim() || !bio.trim()) {
      setErrorMessage("Please fill in all profile fields before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, affiliation, bio }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data?.error ?? "Unable to save profile details.");
        return;
      }

      setSuccessMessage("Profile completed successfully. Redirecting to your dashboard...");
      const rawStored = getUserSession();
      if (rawStored) {
        const updatedUser: UserSession = {
          ...rawStored,
          profileCompleted: true,
          displayName,
          affiliation,
          bio,
        };
        setUserSession(updatedUser);
      }

      window.setTimeout(() => {
        window.location.href = getHomePathForRole(rawStored?.role);
      }, 800);
    } catch (error) {
      setErrorMessage("Unable to reach the server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome to ScholarNexus"
      subtitle="Complete your profile to continue"
      footer={
        <>
          Go back to{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {successMessage}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <div className="relative">
            <UserCircle2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Public display name"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="affiliation">Academic affiliation</Label>
          <Input
            id="affiliation"
            value={affiliation}
            onChange={(event) => setAffiliation(event.target.value)}
            placeholder="University, lab, or department"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Research interests</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Describe your research focus and academic interests"
            rows={5}
          />
        </div>

        <Button type="submit" className="w-full gap-2 rounded-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving profile..." : "Complete profile"}
        </Button>
      </form>
    </AuthLayout>
  );
}
