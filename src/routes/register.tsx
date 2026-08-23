import { useState, type FormEvent, type ChangeEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  Lock,
  User,
  GraduationCap,
  Eye,
  EyeOff,
  Phone,
  Building,
  Award,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileCheck,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
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
  const [role, setRole] = useState<string>("student");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Student Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Faculty Wizard State
  const [facultyStep, setFacultyStep] = useState<number>(1);
  const [facultyData, setFacultyData] = useState({
    // Step 1: Basic
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Step 2: Academic
    institution: "",
    department: "",
    designation: "",
    facultyId: "",
    // Step 3: Research
    researchInterests: "",
    areasOfExpertise: "",
    orcid: "",
    // Step 4: Verification
    verificationDocumentName: "",
    verificationDocument: "",
  });

  const [showFacultyPassword, setShowFacultyPassword] = useState(false);
  const [showFacultyConfirmPassword, setShowFacultyConfirmPassword] = useState(false);

  // Handle Student Registration Submit (Single Page)
  const handleStudentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName || trimmedName.length < 3) {
      setErrorMessage("Full name must be at least 3 characters.");
      return;
    }

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (confirmPassword !== password) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password, role: "student" }),
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

  // Handle Faculty Wizard Step Navigation Validation
  const validateFacultyStep = (step: number): boolean => {
    setErrorMessage(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (step === 1) {
      const trimmedName = facultyData.name.trim();
      const trimmedEmail = facultyData.email.trim();
      const trimmedPhone = facultyData.phone.trim();
      const phoneDigits = trimmedPhone.replace(/\D/g, "");

      if (!trimmedName || trimmedName.length < 3) {
        setErrorMessage("Full name must be at least 3 characters.");
        return false;
      }
      if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
        setErrorMessage("Please enter a valid email address.");
        return false;
      }
      if (!trimmedPhone || /[a-zA-Z]/.test(trimmedPhone) || phoneDigits.length < 7) {
        setErrorMessage("Please enter a valid phone number.");
        return false;
      }
      if (!facultyData.password || facultyData.password.length < 8) {
        setErrorMessage("Password must be at least 8 characters.");
        return false;
      }
      if (facultyData.password !== facultyData.confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return false;
      }
    } else if (step === 2) {
      if (!facultyData.institution.trim()) {
        setErrorMessage("Institution is required.");
        return false;
      }
      if (!facultyData.department.trim()) {
        setErrorMessage("Department is required.");
        return false;
      }
      if (!facultyData.designation.trim()) {
        setErrorMessage("Designation is required.");
        return false;
      }
      if (!facultyData.facultyId.trim()) {
        setErrorMessage("Faculty ID is required.");
        return false;
      }
    } else if (step === 3) {
      if (!facultyData.researchInterests.trim()) {
        setErrorMessage("Research Interests are required.");
        return false;
      }
      if (!facultyData.areasOfExpertise.trim()) {
        setErrorMessage("Areas of Expertise are required.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateFacultyStep(facultyStep)) {
      setFacultyStep((prev) => Math.min(4, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setFacultyStep((prev) => Math.max(1, prev - 1));
  };

  // Handle Verification Document Upload
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const validExts = ["pdf", "png", "jpg", "jpeg", "doc", "docx"];

    if (!validTypes.includes(file.type) && (!fileExt || !validExts.includes(fileExt))) {
      setErrorMessage("Invalid file type. Please upload a PDF, PNG, JPG, or DOCX document.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Document size must not exceed 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFacultyData((prev) => ({
        ...prev,
        verificationDocumentName: file.name,
        verificationDocument: event.target?.result as string,
      }));
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle Final Faculty Form Submit
  const handleFacultySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate all wizard steps in sequence before submission
    if (!validateFacultyStep(1)) {
      setFacultyStep(1);
      return;
    }
    if (!validateFacultyStep(2)) {
      setFacultyStep(2);
      return;
    }
    if (!validateFacultyStep(3)) {
      setFacultyStep(3);
      return;
    }

    if (!facultyData.verificationDocument) {
      setFacultyStep(4);
      setErrorMessage("Verification document is required.");
      return;
    }

    if (!acceptedTerms) {
      setFacultyStep(4);
      setErrorMessage("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: facultyData.name.trim(),
          email: facultyData.email.trim(),
          password: facultyData.password,
          role: "faculty",
          phone: facultyData.phone.trim(),
          institution: facultyData.institution.trim(),
          department: facultyData.department.trim(),
          designation: facultyData.designation.trim(),
          facultyId: facultyData.facultyId.trim(),
          researchInterests: facultyData.researchInterests.trim(),
          areasOfExpertise: facultyData.areasOfExpertise.trim(),
          orcid: facultyData.orcid.trim(),
          verificationDocument: facultyData.verificationDocument,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Unable to complete faculty registration.");
      } else {
        window.location.href = "/login?registered=true&pending=true";
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
        status: data.status,
        approvalStatus: data.approvalStatus,
      };
      setUserSession(userPayload);
      localStorage.removeItem("scholarnexusRemember");
      window.location.href = getHomePathForRole(data.role ?? role, data.email, data.approvalStatus || data.status);
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
      title={role === "faculty" ? "Faculty Registration Portal" : "Create Your Research Account"}
      subtitle={role === "faculty" ? "Academic member registration & verification wizard" : "Join the academic research ecosystem for students and faculty"}
      footer={
        <div className="text-xs text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-emerald-500 hover:underline">
            Sign In to Research Hub
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Role Selection Switch */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-foreground">Account Type</Label>
          <RadioGroup
            defaultValue="student"
            value={role}
            onValueChange={(val) => {
              setRole(val);
              setErrorMessage(null);
            }}
            className="grid grid-cols-2 gap-2"
          >
            {[
              { v: "student", l: "Student Scholar", sub: "Course Access" },
              { v: "faculty", l: "Faculty / Instructor", sub: "Academic Verification Required" },
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

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : null}

        {/* ── STUDENT REGISTRATION FORM (UNTOUCHED 1-PAGE FLOW) ── */}
        {role === "student" ? (
          <form className="space-y-4" onSubmit={handleStudentSubmit}>
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

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="pl-10 pr-10 rounded-xl focus-visible:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
        ) : (
          /* ── FACULTY REGISTRATION MULTI-STEP WIZARD ── */
          <div className="space-y-5">
            {/* Professional Stepper Header */}
            <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-500">Step {facultyStep} of 4</span>
                <span className="text-foreground">
                  {facultyStep === 1
                    ? "Basic Information"
                    : facultyStep === 2
                    ? "Academic Information"
                    : facultyStep === 3
                    ? "Research Information"
                    : "Verification & Document"}
                </span>
              </div>

              {/* Stepper Progress Bar */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {[
                  { step: 1, label: "Basic" },
                  { step: 2, label: "Academic" },
                  { step: 3, label: "Research" },
                  { step: 4, label: "Verification" },
                ].map((s, idx) => (
                  <div key={s.step} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-center">
                      <div
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          facultyStep > s.step
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : facultyStep === s.step
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-sm"
                            : "border-border text-muted-foreground bg-background"
                        }`}
                      >
                        {facultyStep > s.step ? <Check className="h-4 w-4" /> : s.step}
                      </div>
                      {idx < 3 && (
                        <div
                          className={`h-0.5 flex-1 transition-all ${
                            facultyStep > s.step ? "bg-emerald-500" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-[0.65rem] font-semibold ${
                        facultyStep >= s.step ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleFacultySubmit} className="space-y-4">
              {/* STEP 1: BASIC INFORMATION */}
              {facultyStep === 1 && (
                <div className="space-y-3 animate-in fade-in-50 duration-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Prof. Dr. Harrison"
                        value={facultyData.name}
                        onChange={(e) => setFacultyData({ ...facultyData, name: e.target.value })}
                        className="pl-9 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Institutional Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="harrison@university.edu"
                        value={facultyData.email}
                        onChange={(e) => setFacultyData({ ...facultyData, email: e.target.value })}
                        className="pl-9 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="+1 (555) 019-2834"
                        value={facultyData.phone}
                        onChange={(e) => setFacultyData({ ...facultyData, phone: e.target.value })}
                        className="pl-9 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showFacultyPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={facultyData.password}
                        onChange={(e) => setFacultyData({ ...facultyData, password: e.target.value })}
                        className="pl-9 pr-9 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFacultyPassword(!showFacultyPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground"
                      >
                        {showFacultyPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showFacultyConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={facultyData.confirmPassword}
                        onChange={(e) => setFacultyData({ ...facultyData, confirmPassword: e.target.value })}
                        className="pl-9 pr-9 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFacultyConfirmPassword(!showFacultyConfirmPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground"
                      >
                        {showFacultyConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ACADEMIC INFORMATION */}
              {facultyStep === 2 && (
                <div className="space-y-3 animate-in fade-in-50 duration-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Institution / University *</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. Stanford University"
                        value={facultyData.institution}
                        onChange={(e) => setFacultyData({ ...facultyData, institution: e.target.value })}
                        className="pl-9 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Department *</Label>
                    <Input
                      placeholder="e.g. Department of Computer Science & AI"
                      value={facultyData.department}
                      onChange={(e) => setFacultyData({ ...facultyData, department: e.target.value })}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Designation / Title *</Label>
                    <div className="relative">
                      <Award className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. Associate Professor / Principal Investigator"
                        value={facultyData.designation}
                        onChange={(e) => setFacultyData({ ...facultyData, designation: e.target.value })}
                        className="pl-9 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Faculty / Employee ID *</Label>
                    <Input
                      placeholder="e.g. FAC-2026-9812"
                      value={facultyData.facultyId}
                      onChange={(e) => setFacultyData({ ...facultyData, facultyId: e.target.value })}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: RESEARCH INFORMATION */}
              {facultyStep === 3 && (
                <div className="space-y-3 animate-in fade-in-50 duration-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Research Interests *</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. Artificial Intelligence, NLP, Graph Neural Networks"
                        value={facultyData.researchInterests}
                        onChange={(e) => setFacultyData({ ...facultyData, researchInterests: e.target.value })}
                        className="pl-9 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Areas of Expertise *</Label>
                    <Input
                      placeholder="e.g. Deep Learning, Data Analytics, Quantum Computing"
                      value={facultyData.areasOfExpertise}
                      onChange={(e) => setFacultyData({ ...facultyData, areasOfExpertise: e.target.value })}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">ORCID ID (Optional)</Label>
                    <Input
                      placeholder="e.g. 0000-0002-1825-0097"
                      value={facultyData.orcid}
                      onChange={(e) => setFacultyData({ ...facultyData, orcid: e.target.value })}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: VERIFICATION & DOCUMENT UPLOAD */}
              {facultyStep === 4 && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span>Upload Faculty ID / Institutional Proof *</span>
                      <span className="text-[0.65rem] text-destructive font-bold">Mandatory Document</span>
                    </Label>

                    <div className="relative border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-emerald-500/50 bg-background transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        {facultyData.verificationDocumentName ? (
                          <>
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                              <FileCheck className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-semibold text-foreground truncate max-w-xs">
                              {facultyData.verificationDocumentName}
                            </span>
                            <span className="text-[0.7rem] text-emerald-500 font-medium">Document attached successfully! Click to change.</span>
                          </>
                        ) : (
                          <>
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                              <Upload className="h-6 w-6" />
                            </div>
                            <p className="text-xs font-semibold text-foreground">
                              Click or drag faculty ID / institutional proof document
                            </p>
                            <p className="text-[0.65rem] text-muted-foreground">
                              Supports PDF, PNG, JPG, or DOCX (Max 5MB)
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox
                      id="terms-faculty"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(Boolean(checked))}
                      className="mt-0.5"
                    />
                    <Label htmlFor="terms-faculty" className="text-xs font-normal leading-relaxed text-muted-foreground">
                      I certify that all institutional and academic details provided are authentic. I agree to the SCHOLAR NEXUS{" "}
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
                </div>
              )}

              {/* Wizard Navigation Buttons */}
              <div className="flex items-center justify-between pt-3 gap-2">
                {facultyStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="gap-1.5 rounded-xl text-xs font-semibold"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                ) : <div />}

                {facultyStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/25"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !facultyData.verificationDocument}
                    className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 shadow-md shadow-emerald-600/25"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {isSubmitting ? "Submitting Application..." : "Submit Faculty Registration"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
