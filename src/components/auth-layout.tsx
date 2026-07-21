import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { GraduationCap, ShieldCheck, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface Props {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}

/* ── Static, blurred research icons for elegant background watermarks ── */
const BACKGROUND_ICONS = [
  { id: "b1", emoji: "📚", size: 64, x: 10, y: 14, rot: -12, opacity: 0.16 },
  { id: "b2", emoji: "🎓", size: 84, x: 76, y: 16, rot: 15, opacity: 0.14 },
  { id: "b3", emoji: "💻", size: 72, x: 12, y: 74, rot: -8, opacity: 0.16 },
  { id: "b4", emoji: "🔬", size: 62, x: 82, y: 72, rot: 20, opacity: 0.14 },
  { id: "b5", emoji: "🔢", size: 56, x: 50, y: 8, rot: -5, opacity: 0.12 },
  { id: "b6", emoji: "📜", size: 60, x: 48, y: 84, rot: 10, opacity: 0.12 },
  { id: "b7", emoji: "⚛️", size: 52, x: 84, y: 44, rot: -15, opacity: 0.12 },
  { id: "b8", emoji: "🏆", size: 54, x: 8, y: 42, rot: 18, opacity: 0.12 },
];

function ProfessionalLeftPanel() {
  return (
    <div className="auth-illustration-panel flex flex-col items-center justify-center p-8 md:p-14 text-center select-none relative" aria-hidden="true">
      {/* Soft gradient background */}
      <div className="auth-mesh-bg" />

      {/* Blurred static research background icons */}
      {BACKGROUND_ICONS.map((icon) => (
        <span
          key={icon.id}
          className="absolute pointer-events-none select-none blur-[4px]"
          style={{
            left: `${icon.x}%`,
            top: `${icon.y}%`,
            fontSize: `${icon.size}px`,
            transform: `rotate(${icon.rot}deg)`,
            opacity: icon.opacity,
          }}
        >
          {icon.emoji}
        </span>
      ))}

      {/* Soft ambient blur orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      {/* Centered Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md mx-auto text-center">
        {/* Brand Icon */}
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-xl shadow-emerald-500/25">
          <GraduationCap size={36} strokeWidth={1.75} />
        </div>

        {/* Main Title */}
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
          SCHOLAR NEXUS
        </h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Student Academic Resource Portal
        </p>

        {/* Subtitle Description */}
        <p className="mt-4 text-sm leading-relaxed text-slate-200">
          The ultimate peer-to-peer university academic portal. Share notes, download course materials, collaborate in live study rooms, and elevate your research.
        </p>

        {/* Key Features List */}
        <div className="mt-6 space-y-2.5 text-xs font-medium text-slate-200 text-left w-full max-w-xs mx-auto border-t border-white/10 pt-5">
          {[
            "50,000+ Verified Course Materials & Solved Papers",
            "Real-Time Virtual Idea Rooms with Screen Sharing",
            "Senior Mentor Academic Q&A & Discussions",
            "Contextual Citation Generator & Research Tools",
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Clean Statistics Row */}
        <div className="mt-7 grid grid-cols-3 gap-6 border-t border-white/10 pt-5 w-full">
          <div>
            <div className="text-xl font-extrabold text-white font-display">50,000+</div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-400 mt-0.5">Materials</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-white font-display">120+</div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-400 mt-0.5">Courses</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-white font-display">15,000+</div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-400 mt-0.5">Scholars</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthLayout({ title, subtitle, footer, children }: Props) {
  return (
    <div className="auth-page-root">
      {/* ── Left Side: Centered Professional Panel ── */}
      <ProfessionalLeftPanel />

      {/* ── Right Side: Professional Form Container ── */}
      <div className="auth-form-panel flex flex-col justify-between">
        {/* Top Header */}
        <header className="auth-form-header px-6 py-5 flex items-center justify-between border-b border-border/60">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-extrabold tracking-tight text-foreground font-display">SCHOLAR NEXUS</span>
              <span className="text-[0.65rem] font-semibold text-emerald-500 uppercase tracking-wider">Student Academic Portal</span>
            </div>
          </Link>
          <ThemeToggle />
        </header>

        {/* Main Form Content */}
        <main className="auth-form-main flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="auth-form-container w-full max-w-md">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-display md:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}

            {/* Auth Form Container Card */}
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
              {children}
            </div>

            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </main>

        {/* Footer */}
        <footer className="auth-form-bottom px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/60">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Encrypted Institutional Portal</span>
            <span>·</span>
            <Link to="/privacy" className="hover:text-foreground transition">Privacy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-foreground transition">Terms</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
