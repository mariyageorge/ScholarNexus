import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Users,
  Search,
  FileText,
  Shield,
  Layers,
  Menu,
  GitCompare,
  Quote,
  ScanSearch,
  FileSpreadsheet,
  BrainCircuit,
  HelpCircle,
  Mail,
  Send,
  Info,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScholarNexus AI — An Intelligent Academic Research Ecosystem" },
      {
        name: "description",
        content:
          "ScholarNexus AI integrates research project management, intelligent document analysis (RAG & LLMs), paper comparison, citation generation, similarity checking, and faculty collaboration.",
      },
      { property: "og:title", content: "ScholarNexus AI — Intelligent Academic Research Ecosystem" },
      {
        property: "og:description",
        content:
          "Unify the complete research lifecycle: paper analysis, RAG summaries, paper comparison, APA/IEEE citations, similarity checking, and faculty reviews.",
      },
    ],
  }),
  component: LandingPage,
});

/* ── Core Platform Modules based on Abstract ────────────────────────────── */
const PLATFORM_MODULES = [
  {
    icon: Layers,
    title: "Research Project Management",
    desc: "Create and organize research workspace projects, upload literature, track milestones, and manage research paper repositories in one centralized place.",
  },
  {
    icon: BrainCircuit,
    title: "Intelligent RAG & LLM Analysis",
    desc: "Powered by Retrieval-Augmented Generation (RAG) and LLMs to provide precise, context-aware answers grounded directly in your uploaded papers.",
  },
  {
    icon: FileSpreadsheet,
    title: "Automated Structured Summaries",
    desc: "Automatically extract research objectives, methodologies, datasets, findings, key advantages, and limitations from complex papers.",
  },
  {
    icon: GitCompare,
    title: "Research Paper Comparison",
    desc: "Perform side-by-side analysis across multiple papers to compare methodologies, datasets, findings, and identify research gaps.",
  },
  {
    icon: Quote,
    title: "Multi-Format Citation Generator",
    desc: "Instantly generate accurate, publication-ready citations supporting APA, IEEE, MLA, Chicago, and Harvard standards.",
  },
  {
    icon: ScanSearch,
    title: "AI Similarity & Originality Checker",
    desc: "Assess manuscript originality and overlap across sources before final submission to maintain academic integrity.",
  },
  {
    icon: Users,
    title: "Faculty Collaboration Module",
    desc: "Dedicated workspace for faculty guides to review student drafts, track progress timelines, access reports, and provide feedback.",
  },
];

/* ── Sample Paper Library ─────────────────────────────────────────────── */
const SAMPLE_PAPERS = [
  {
    id: "p1",
    title: "Retrieval-Augmented Generation for Complex Academic Document Understanding",
    category: "Artificial Intelligence",
    authors: "E. Martinez, S. Chen et al.",
    year: "2025",
    citations: 142,
  },
  {
    id: "p2",
    title: "Comparative Analysis of Deep Learning Architectures in Medical Image Segmentation",
    category: "Computer Vision",
    authors: "R. Gupta, K. Patel",
    year: "2024",
    citations: 289,
  },
  {
    id: "p3",
    title: "Quantum Key Distribution Protocols: Methodologies and Vulnerability Assessment",
    category: "Quantum Physics",
    authors: "A. Vance, H. Lindqvist",
    year: "2025",
    citations: 94,
  },
];

/* ── FAQ Items ────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: "How does ScholarNexus AI ensure accuracy in paper analysis?",
    a: "ScholarNexus AI uses Retrieval-Augmented Generation (RAG) coupled with Large Language Models. Answers are grounded directly in your uploaded PDFs with exact citation quotes, preventing hallucination.",
  },
  {
    q: "What citation formats are supported?",
    a: "The built-in Citation Generator supports APA (7th ed.), IEEE, MLA (9th ed.), Chicago, and Harvard standards for articles, books, proceedings, and DOIs.",
  },
  {
    q: "How does the Faculty Collaboration Module work?",
    a: "Faculty guides receive a dedicated workspace where they can monitor student project progress timelines, review uploaded drafts, access originality reports, and provide inline feedback.",
  },
  {
    q: "Is my research data secure and private?",
    a: "Yes. All uploaded papers and drafts are encrypted and isolated to your institutional project workspace. Your manuscripts are never used to train public models.",
  },
];

function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredPapers = SAMPLE_PAPERS.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground font-sans selection:bg-emerald-500/30 selection:text-emerald-300 scroll-smooth">
      {/* ── Global Header Bar ── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 shadow-md shadow-emerald-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight font-display">ScholarNexus AI</span>
              <span className="text-[0.65rem] font-semibold tracking-wider text-emerald-500 uppercase">
                Academic Research Ecosystem
              </span>
            </div>
          </Link>

          {/* Public Header Navigation — In-page Anchors */}
          <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:flex">
            <a href="#problem" className="transition duration-200 hover:text-emerald-500">
              The Solution
            </a>
            <a href="#modules" className="transition duration-200 hover:text-emerald-500">
              Modules
            </a>
            <a href="#about" className="transition duration-200 hover:text-emerald-500">
              About Us
            </a>
            <a href="#docs" className="transition duration-200 hover:text-emerald-500">
              Documentation
            </a>
            <a href="#faq" className="transition duration-200 hover:text-emerald-500">
              FAQ
            </a>
            <a href="#contact" className="transition duration-200 hover:text-emerald-500">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground sm:inline"
            >
              Sign In
            </Link>
            <Button asChild size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25">
              <Link to="/register">Get Started</Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 grid-neural opacity-30 dark:opacity-15" aria-hidden />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-[48rem] rounded-full bg-emerald-500/10 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-5xl px-4 text-center md:px-6">
          <Badge className="mx-auto gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>ScholarNexus AI — Unified Academic Research Ecosystem</span>
          </Badge>

          <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight md:text-6xl font-display leading-tight">
            An Intelligent Academic{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Research Ecosystem
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            ScholarNexus AI integrates project tracking, RAG document analysis, automated paper summaries, multi-format citation generation, originality checking, and faculty collaboration into one streamlined digital workspace.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition duration-200 hover:-translate-y-0.5">
              <Link to="/register">
                Start Research Project <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 rounded-full border-border hover:bg-muted/10 font-semibold text-sm transition duration-200 hover:-translate-y-0.5">
              <Link to="/login">Sign In to Workspace</Link>
            </Button>
          </div>

          {/* Highlights Ribbon */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-md sm:grid-cols-4">
            {[
              { icon: BrainCircuit, label: "RAG & LLM Analysis", value: "Context Aware" },
              { icon: FileSpreadsheet, label: "Structured Summaries", value: "Automated" },
              { icon: Quote, label: "APA, IEEE, MLA, Chicago", value: "Citations" },
              { icon: Shield, label: "Originality & Faculty Review", value: "Verified" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center p-2 text-center">
                <stat.icon className="h-5 w-5 text-emerald-400 mb-1" />
                <span className="text-base font-extrabold text-foreground font-display">{stat.value}</span>
                <span className="text-[0.7rem] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem & Solution Section ── */}
      <section id="problem" className="border-y border-border bg-muted/20 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="space-y-4">
              <Badge variant="outline" className="rounded-full border-amber-500/30 text-amber-400">
                The Academic Challenge
              </Badge>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl font-display">
                Eliminate Fragmented Research Workflows
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Academic research is essential in higher education, but students often rely on multiple independent platforms for literature review, paper analysis, citation management, originality checking, project tracking, and faculty guide communication.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Switching between disconnected tools makes the research process fragmented, time-consuming, and difficult to manage effectively — creating obstacles in completing academic projects efficiently.
              </p>
            </div>

            <Card className="surface-elevated border-emerald-500/30 bg-card/80 p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> ScholarNexus AI Unified Solution
                </div>
                <h3 className="text-xl font-bold font-display">One Streamlined Environment</h3>
                <ul className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span><strong>Unified Research Lifecycle:</strong> Integrate paper uploads, project management, and AI analysis in one hub.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span><strong>RAG-Powered Insights:</strong> Ask complex questions and receive accurate, context-aware answers grounded in your papers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span><strong>Faculty Guide Supervision:</strong> Seamless review workflows connecting students directly with mentors.</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Core Platform Modules Matrix ── */}
      <section id="modules" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-400">
            Platform Capabilities
          </Badge>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl font-display">
            Integrated Research Modules
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            A comprehensive suite engineered specifically for university researchers, students, and faculty guides.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_MODULES.map((m) => (
            <Card key={m.title} className="surface-elevated border-border transition duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl">
              <CardContent className="p-6 space-y-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <m.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold font-display">{m.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{m.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── ABOUT US SECTION (In-Page Anchor: #about) ── */}
      <section id="about" className="border-t border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-400">
              About ScholarNexus AI
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl font-display">
              Streamlining Higher Education Academic Research
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              ScholarNexus AI is an AI-powered Academic Research Management Platform designed to simplify the research lifecycle through a unified digital environment.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="surface-elevated border-border p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center font-bold">
                01
              </div>
              <h3 className="text-base font-bold font-display">Centralized Workspace</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Replaces scattered browser tabs, PDF folders, and email threads with organized project workspaces.
              </p>
            </Card>

            <Card className="surface-elevated border-border p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center font-bold">
                02
              </div>
              <h3 className="text-base font-bold font-display">RAG Intelligence</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Utilizes Retrieval-Augmented Generation to extract objective methodology, dataset, and result insights safely.
              </p>
            </Card>

            <Card className="surface-elevated border-border p-6 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center font-bold">
                03
              </div>
              <h3 className="text-base font-bold font-display">Faculty Supervision</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connects student researchers with faculty mentors for progress monitoring and draft feedback.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── DOCUMENTATION SECTION (In-Page Anchor: #docs) ── */}
      <section id="docs" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="rounded-full border-cyan-500/30 text-cyan-400">
            Documentation & Workflow
          </Badge>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl font-display">
            How ScholarNexus AI Works
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            A simple 4-step workflow from literature collection to faculty submission.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "Step 1",
              title: "Create Project Workspace",
              desc: "Set up your research project workspace and upload reference PDFs and manuscripts.",
            },
            {
              step: "Step 2",
              title: "AI Analysis & RAG Summary",
              desc: "Generate structured summaries covering objectives, methodologies, datasets, and results.",
            },
            {
              step: "Step 3",
              title: "Comparison & Citation",
              desc: "Perform side-by-side paper analysis and generate APA, IEEE, or MLA citations.",
            },
            {
              step: "Step 4",
              title: "Originality & Faculty Review",
              desc: "Assess manuscript similarity and share draft reports directly with your faculty guide.",
            },
          ].map((item, idx) => (
            <Card key={idx} className="surface-elevated border-border p-6 space-y-3 relative">
              <span className="text-xs font-bold text-emerald-400 font-mono">{item.step}</span>
              <h3 className="text-base font-bold font-display">{item.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── FAQ SECTION (In-Page Anchor: #faq) ── */}
      <section id="faq" className="border-t border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-400">
              Frequently Asked Questions
            </Badge>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl font-display">
              Got Questions? We Have Answers
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Everything you need to know about ScholarNexus AI modules, privacy, and faculty access.
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, idx) => (
              <Card key={idx} className="surface-elevated border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-sm font-display focus:outline-none"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === idx ? "rotate-180 text-emerald-400" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                    {item.a}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT US SECTION (In-Page Anchor: #contact) ── */}
      <section id="contact" className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mx-auto max-w-2xl text-center mb-12 space-y-3">
          <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-400">
            Get In Touch
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl font-display">
            Contact ScholarNexus AI
          </h2>
          <p className="text-sm text-muted-foreground">
            Have inquiries regarding institutional deployment, faculty access, or academic partnerships?
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Details */}
          <div className="space-y-4">
            <Card className="surface-elevated border-border p-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-display uppercase tracking-wider text-muted-foreground">Support Email</h4>
                <p className="text-sm font-semibold">support@scholarnexus.ai</p>
              </div>
            </Card>

            <Card className="surface-elevated border-border p-6 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-display uppercase tracking-wider text-muted-foreground">Institutional Deployment</h4>
                <p className="text-sm font-semibold">partnerships@scholarnexus.ai</p>
              </div>
            </Card>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Academic Integrity Commitment</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ScholarNexus AI strictly complies with academic privacy standards. All student research data remains confidential and protected.
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="surface-elevated border-border p-6 md:p-8">
            {contactSubmitted ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold font-display">Message Sent</h3>
                <p className="text-xs text-muted-foreground">
                  Thank you for contacting ScholarNexus AI. Our team will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cont-name" className="text-xs font-semibold">Full Name</Label>
                  <Input id="cont-name" required placeholder="Dr. Sarah Jenkins" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cont-email" className="text-xs font-semibold">Institutional Email</Label>
                  <Input id="cont-email" type="email" required placeholder="s.jenkins@university.edu" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cont-msg" className="text-xs font-semibold">Message</Label>
                  <textarea
                    id="cont-msg"
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
      </section>

      {/* ── Call To Action Banner ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-card to-card p-10 text-center shadow-2xl md:p-16">
          <div className="absolute inset-0 grid-neural opacity-30" aria-hidden />
          <div className="relative mx-auto max-w-2xl space-y-4">
            <Badge className="mx-auto bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Simplify Your Research Lifecycle
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl font-display">
              Join ScholarNexus AI Today
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Experience a centralized, intelligent platform that enhances research productivity, improves paper understanding, and streamlines student-faculty collaboration.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl">
                <Link to="/register">Create Research Account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/login">Sign In to Portal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Global Public Footer with In-Page Anchors ── */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4 md:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-sm font-extrabold font-display">ScholarNexus AI</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              An AI-powered Academic Research Management Platform unifying document analysis, citation generation, similarity checking, and faculty supervision.
            </p>
          </div>

          {[
            {
              title: "Platform Overview",
              links: [
                ["The Solution", "#problem"],
                ["Platform Modules", "#modules"],
                ["About Us", "#about"],
                ["Documentation", "#docs"],
              ],
            },
            {
              title: "Company & FAQ",
              links: [
                ["FAQ", "#faq"],
                ["Contact Us", "#contact"],
                ["Faculty Portal", "#faculty"],
              ],
            },
            {
              title: "Legal & Access",
              links: [
                ["Privacy Policy", "/privacy"],
                ["Terms of Service", "/terms"],
                ["Sign In to Portal", "/login"],
                ["Create Account", "/register"],
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col.title}</h4>
              <ul className="mt-3 space-y-2 text-xs">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith("#") ? (
                      <a href={href} className="text-muted-foreground hover:text-foreground transition">
                        {label}
                      </a>
                    ) : (
                      <Link to={href} className="text-muted-foreground hover:text-foreground transition">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ScholarNexus AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
