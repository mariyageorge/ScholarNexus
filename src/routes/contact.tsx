import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Mail, MessageSquare, Building, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — ScholarNexus AI" },
      {
        name: "description",
        content:
          "Get in touch with ScholarNexus AI for institutional partnerships, academic support, or platform inquiries.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 shadow-md">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight font-display">ScholarNexus AI</span>
              <span className="text-[0.65rem] font-semibold tracking-wider text-emerald-500 uppercase">
                Academic Research Ecosystem
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Button asChild size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-400">
            Get In Touch
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl font-display">
            Contact ScholarNexus AI
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Have questions about institutional deployment, faculty collaboration, or research management? We're here to assist you.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Information Column */}
          <div className="space-y-6">
            <Card className="surface-elevated border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display">Academic Support</h3>
                  <p className="text-xs text-muted-foreground">support@scholarnexus.ai</p>
                </div>
              </div>
            </Card>

            <Card className="surface-elevated border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display">Institutional Partnerships</h3>
                  <p className="text-xs text-muted-foreground">partnerships@scholarnexus.ai</p>
                </div>
              </div>
            </Card>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Fast Institutional Setup</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Looking to deploy ScholarNexus AI for your department or university lab? Reach out for custom SSO integration and faculty guide onboarding.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <Card className="surface-elevated border-border p-6 md:p-8">
            {submitted ? (
              <div className="text-center py-10 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold font-display">Message Received</h3>
                <p className="text-xs text-muted-foreground">
                  Thank you for contacting ScholarNexus AI. Our academic team will respond shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name" className="text-xs font-semibold">Full Name</Label>
                  <Input id="c-name" required placeholder="Dr. Sarah Jenkins" className="rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-email" className="text-xs font-semibold">Institutional Email</Label>
                  <Input id="c-email" type="email" required placeholder="s.jenkins@university.edu" className="rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-msg" className="text-xs font-semibold">Message</Label>
                  <textarea
                    id="c-msg"
                    required
                    rows={4}
                    placeholder="Tell us about your research lab or query..."
                    className="w-full rounded-xl border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <Button type="submit" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2">
                  <Send className="h-4 w-4" /> Send Message
                </Button>
              </form>
            )}
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ScholarNexus AI. All rights reserved.
      </footer>
    </div>
  );
}
