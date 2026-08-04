import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from "react";
import {
  UserCircle,
  Camera,
  Loader2,
  Save,
  RotateCcw,
  ShieldCheck,
  Mail,
  Building2,
  Phone,
  Sparkles,
  Trash2,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PagePlaceholder } from "@/components/page-placeholder";
import { getUserSession, setUserSession, getUserInitials, type UserSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "User Profile — ScholarNexus AI" },
      { name: "description", content: "Your researcher profile and academic identity." },
    ],
  }),
  component: UserProfilePage,
});

function UserProfilePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form field states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [bio, setBio] = useState("");
  const [researchInterests, setResearchInterests] = useState("");
  const [profileImage, setProfileImage] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const session = getUserSession();
    if (!session) {
      setIsLoading(false);
      return;
    }
    if (session.role === "admin" || session.email === "scholarnexusadmin@gmail.com") {
      window.location.href = "/dashboard";
      return;
    }

    setUser(session);
    setName(session.displayName ?? session.name ?? "");
    setAffiliation(session.affiliation ?? "");
    setBio(session.bio ?? "");
    setPhone(session.phone ?? "");
    setResearchInterests(session.researchInterests ?? "");
    setProfileImage(session.profileImage ?? session.photoURL ?? "");

    // Fetch latest profile details from server
    fetch(`/api/profile?email=${encodeURIComponent(session.email)}`, {
      headers: { "x-user-email": session.email },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setName(data.name ?? data.displayName ?? session.name ?? "");
          setAffiliation(data.affiliation ?? session.affiliation ?? "");
          setBio(data.bio ?? session.bio ?? "");
          setPhone(data.phone ?? session.phone ?? "");
          setResearchInterests(data.researchInterests ?? session.researchInterests ?? "");
          setProfileImage(data.profileImage ?? data.photoURL ?? session.photoURL ?? "");

          // Update local session cache if server has updated values
          const updatedSession: UserSession = {
            ...session,
            name: data.name ?? session.name,
            displayName: data.displayName ?? session.displayName,
            affiliation: data.affiliation ?? session.affiliation,
            bio: data.bio ?? session.bio,
            phone: data.phone ?? session.phone,
            researchInterests: data.researchInterests ?? session.researchInterests,
            profileImage: data.profileImage ?? data.photoURL ?? session.photoURL,
            photoURL: data.photoURL ?? data.profileImage ?? session.photoURL,
            provider: data.provider ?? session.provider,
            role: data.role ?? session.role,
            profileCompleted: data.profileCompleted ?? session.profileCompleted,
          };
          setUserSession(updatedSession);
          setUser(updatedSession);
        }
      })
      .catch((err) => {
        console.error("Error loading user profile:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleResetForm = () => {
    if (!user) return;
    setName(user.displayName ?? user.name ?? "");
    setAffiliation(user.affiliation ?? "");
    setBio(user.bio ?? "");
    setPhone(user.phone ?? "");
    setResearchInterests(user.researchInterests ?? "");
    setProfileImage(user.profileImage ?? user.photoURL ?? "");
    toast.info("Form changes reset.");
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setProfileImage(result);
        toast.success("Profile picture updated. Save changes to keep it!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Profile picture removed. Save changes to apply.");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Full Name cannot be empty.");
      return;
    }

    if (trimmedName.length < 3) {
      toast.error("Full Name must be at least 3 characters long.");
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const digitsOnly = trimmedPhone.replace(/[^0-9]/g, "");
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      if (!phoneRegex.test(trimmedPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
        toast.error("Please enter a valid phone number (7–15 digits, e.g. +1 (555) 000-0000).");
        return;
      }
    }

    if (affiliation.trim().length > 200) {
      toast.error("Institution/Affiliation must not exceed 200 characters.");
      return;
    }

    if (bio.trim().length > 500) {
      toast.error("Short Bio must not exceed 500 characters.");
      return;
    }

    if (researchInterests.trim().length > 500) {
      toast.error("Research Interests must not exceed 500 characters.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user.email,
        },
        body: JSON.stringify({
          email: user.email,
          name: trimmedName,
          displayName: trimmedName,
          phone: trimmedPhone,
          affiliation: affiliation.trim(),
          bio: bio.trim(),
          researchInterests: researchInterests.trim(),
          profileImage: profileImage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error ?? "Failed to update profile. Please try again.");
        return;
      }

      const updatedUserRecord = result.user;
      const newSession: UserSession = {
        ...user,
        name: updatedUserRecord?.name ?? name.trim(),
        displayName: updatedUserRecord?.displayName ?? name.trim(),
        phone: updatedUserRecord?.phone ?? phone.trim(),
        affiliation: updatedUserRecord?.affiliation ?? affiliation.trim(),
        bio: updatedUserRecord?.bio ?? bio.trim(),
        researchInterests: updatedUserRecord?.researchInterests ?? researchInterests.trim(),
        profileImage: updatedUserRecord?.profileImage ?? profileImage,
        photoURL: updatedUserRecord?.photoURL ?? profileImage,
        profileCompleted: true,
      };

      setUserSession(newSession);
      setUser(newSession);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Network error. Unable to reach server.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate profile completion percentage
  const fields = [
    Boolean(name.trim()),
    Boolean(phone.trim()),
    Boolean(affiliation.trim()),
    Boolean(bio.trim()),
    Boolean(researchInterests.trim()),
    Boolean(profileImage),
  ];
  const completedFieldsCount = fields.filter(Boolean).length;
  const completionPercentage = Math.round((completedFieldsCount / fields.length) * 100);

  const getProviderDisplayName = (provider?: string) => {
    if (!provider || provider === "email") return "Email / Password";
    if (provider.toLowerCase().includes("google")) return "Google Account";
    return provider;
  };

  return (
    <DashboardLayout>
      {!user ? (
        <PagePlaceholder
          title="User Profile"
          description="Please sign in to view your profile."
          icon={<UserCircle className="h-7 w-7" />}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Profile Picture Upload Container */}
                <div className="relative group shrink-0">
                  <Avatar className="h-20 w-20 border-2 border-border shadow-md transition-transform group-hover:scale-105">
                    {profileImage ? (
                      <AvatarImage src={profileImage} alt={name || user.name} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">
                      {getUserInitials({ ...user, displayName: name })}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    title="Change Profile Picture"
                  >
                    <Camera className="h-6 w-6" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Researcher Profile
                    </p>
                    <Badge variant="outline" className="capitalize text-xs font-medium border-primary/30 text-primary">
                      {user.role}
                    </Badge>
                  </div>
                  <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                    {name || user.displayName || user.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 gap-1.5 text-xs rounded-xl"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Upload Photo
                    </Button>
                    {profileImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Signed in Email Card */}
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/60 px-4 py-3 sm:max-w-xs">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
                  <p className="truncate text-sm font-semibold text-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Profile Completion Indicator */}
            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Profile Completion</span>
                </div>
                <span className="font-semibold text-primary">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2 rounded-full" />
              <p className="mt-2 text-xs text-muted-foreground">
                {completionPercentage === 100
                  ? "Great job! Your profile details are 100% complete."
                  : "Complete all fields including photo, bio, phone, and research interests to reach 100%."}
              </p>
            </div>
          </div>

          {/* Details & About Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Account Details Card */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="border-b border-border pb-3">
                <h2 className="text-lg font-semibold text-foreground">Account & Personal Details</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update your contact details and view account authorization.
                </p>
              </div>

              {/* Editable: Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-semibold text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Alex Morgan"
                  className="rounded-xl border-border bg-background"
                  required
                  minLength={3}
                />
                <p className="text-[0.7rem] text-muted-foreground">Must be at least 3 characters long.</p>
              </div>

              {/* Editable: Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="rounded-xl border-border bg-background"
                />
                <p className="text-[0.7rem] text-muted-foreground">Optional. E.g., +1 (555) 000-0000 or 0123456789 (7–15 digits).</p>
              </div>

              {/* Read-Only: Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                  <Badge variant="secondary" className="ml-auto text-[0.65rem] font-normal py-0 px-1.5 gap-1">
                    <Lock className="h-2.5 w-2.5" /> Read-only
                  </Badge>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="rounded-xl border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Read-Only: Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  User Role
                  <Badge variant="secondary" className="ml-auto text-[0.65rem] font-normal py-0 px-1.5 gap-1">
                    <Lock className="h-2.5 w-2.5" /> Read-only
                  </Badge>
                </Label>
                <Input
                  id="role"
                  type="text"
                  value={user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Student"}
                  readOnly
                  disabled
                  className="rounded-xl border-border bg-muted/50 text-muted-foreground cursor-not-allowed capitalize"
                />
              </div>

              {/* Read-Only: Authentication Provider */}
              <div className="space-y-2">
                <Label htmlFor="provider" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  Authentication Provider
                  <Badge variant="secondary" className="ml-auto text-[0.65rem] font-normal py-0 px-1.5 gap-1">
                    <Lock className="h-2.5 w-2.5" /> Read-only
                  </Badge>
                </Label>
                <Input
                  id="provider"
                  type="text"
                  value={getProviderDisplayName(user.provider)}
                  readOnly
                  disabled
                  className="rounded-xl border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

            {/* Academic Profile & Bio Card */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div className="border-b border-border pb-3">
                <h2 className="text-lg font-semibold text-foreground">Academic Information & Bio</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Share your research focus, affiliation, and academic background.
                </p>
              </div>

              {/* Editable: Institution / Affiliation */}
              <div className="space-y-2">
                <Label htmlFor="affiliation" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Institution / Affiliation
                </Label>
                <Input
                  id="affiliation"
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="e.g. Stanford University — Department of Computer Science"
                  className="rounded-xl border-border bg-background"
                  maxLength={200}
                />
                <p className="text-[0.7rem] text-muted-foreground text-right">{affiliation.length}/200</p>
              </div>

              {/* Editable: Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-semibold text-foreground">
                  Short Bio
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short introduction describing your academic background, current position, and pursuits..."
                  rows={4}
                  className="rounded-xl border-border bg-background resize-none"
                  maxLength={500}
                />
                <p className="text-[0.7rem] text-muted-foreground text-right">{bio.length}/500</p>
              </div>

              {/* Editable: Research Interests */}
              <div className="space-y-2">
                <Label htmlFor="researchInterests" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  Research Interests
                </Label>
                <Textarea
                  id="researchInterests"
                  value={researchInterests}
                  onChange={(e) => setResearchInterests(e.target.value)}
                  placeholder="e.g. Machine Learning, Natural Language Processing, Quantum Computing, Climate Modeling..."
                  rows={4}
                  className="rounded-xl border-border bg-background resize-none"
                  maxLength={500}
                />
                <p className="text-[0.7rem] text-muted-foreground text-right">{researchInterests.length}/500</p>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetForm}
              disabled={isSaving}
              className="rounded-xl gap-2 text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}
