import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, BrainCircuit, CheckCircle2, Shield, Users, Layers, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — ScholarNexus AI" },
      {
        name: "description",
        content:
          "Learn about ScholarNexus AI, an intelligent academic research management platform designed to unify the research lifecycle for students and faculty.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
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

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24 space-y-16">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-400">
            About ScholarNexus AI
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl font-display leading-tight">
            Streamlining Higher Education{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Academic Research
            </span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            ScholarNexus AI is an AI-powered Academic Research Management Platform engineered to simplify and unify the entire research lifecycle within a single digital environment.
          </p>
        </div>

        {/* Mission Card */}
        <Card className="surface-elevated border-emerald-500/30 p-8 bg-card/80">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-2xl font-bold font-display">Our Purpose & Vision</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Academic research is an essential component of higher education. However, students and faculty traditionally rely on multiple fragmented tools for literature reviews, paper summaries, citation formatting, similarity assessment, and guide communication.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              By harnessing Retrieval-Augmented Generation (RAG) and Large Language Models (LLMs), ScholarNexus AI replaces disconnected tools with a unified, intelligent platform that enhances document understanding, preserves originality, and facilitates structured collaboration between students and faculty mentors.
            </p>
          </div>
        </Card>

        {/* Core Pillars */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Layers,
              title: "Unified Lifecycle",
              desc: "Consolidate project creation, literature uploads, citation generation, and originality checking in one secure workspace.",
            },
            {
              icon: BrainCircuit,
              title: "RAG & LLM Analysis",
              desc: "Provide context-aware answers grounded directly in your uploaded manuscripts with objective, methodology, and result summaries.",
            },
            {
              icon: Shield,
              title: "Faculty Guidance",
              desc: "Enable mentors to monitor progress, review manuscript drafts, access originality reports, and provide structured feedback.",
            },
          ].map((pillar, idx) => (
            <Card key={idx} className="surface-elevated border-border p-6">
              <CardContent className="p-0 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold font-display">{pillar.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{pillar.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <Button asChild size="lg" className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            <Link to="/register">
              Join ScholarNexus AI <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ScholarNexus AI. All rights reserved.
      </footer>
    </div>
  );
}
