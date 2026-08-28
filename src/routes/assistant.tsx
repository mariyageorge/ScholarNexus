import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Bot,
  Sparkles,
  Send,
  AtSign,
  Loader2,
  FolderKanban,
  ArrowRight,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getUserSession, UserSession } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — ScholarNexus AI" },
      { name: "description", content: "Contextual research co-pilot with @ paper mentions." },
    ],
  }),
  component: AssistantPage,
});

function AssistantPage() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [papers, setPapers] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingPapers, setLoadingPapers] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<
    {
      id: string;
      role: "user" | "assistant";
      content: string;
      timestamp: string;
      mentionedPapers?: { id: string; title: string }[];
    }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState("");
  const [selectedMentionedPapers, setSelectedMentionedPapers] = useState<any[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const session = getUserSession();
    setUserSession(session);

    if (session?.email) {
      fetch(`/api/projects?email=${encodeURIComponent(session.email)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setProjects(data);
            setSelectedProjectId(data[0].id || data[0]._id);
            setActiveProject(data[0]);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingProjects(false));
    } else {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setPapers([]);
      setActiveProject(null);
      return;
    }

    const proj = projects.find((p) => (p.id || p._id) === selectedProjectId);
    setActiveProject(proj || null);

    setLoadingPapers(true);
    fetch(`/api/papers?projectId=${encodeURIComponent(selectedProjectId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setPapers(data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingPapers(false));
  }, [selectedProjectId, projects]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isSendingChatMessage]);

  const handleSendChatMessage = async (overridePrompt?: string, overrideMentionedPapers?: any[]) => {
    const rawText = (overridePrompt !== undefined ? overridePrompt : chatInput).trim();
    const activeMentions = overrideMentionedPapers || selectedMentionedPapers;

    if (!rawText) return;

    const userMsgId = `msg-user-${Date.now()}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage = {
      id: userMsgId,
      role: "user" as const,
      content: rawText,
      timestamp: nowStr,
      mentionedPapers: activeMentions.map((p) => ({ id: p.id || String(p._id), title: p.title })),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setSelectedMentionedPapers([]);
    setShowMentionDropdown(false);
    setIsSendingChatMessage(true);

    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
      const mentionedPaperIds = activeMentions.map((p) => p.id || String(p._id));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: rawText,
          projectId: selectedProjectId || undefined,
          history,
          mentionedPaperIds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          const aiMsgId = `msg-ai-${Date.now()}`;
          const aiMessage = {
            id: aiMsgId,
            role: "assistant" as const,
            content: data.response,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            mentionedPapers: data.mentionedPapers,
          };
          setChatMessages((prev) => [...prev, aiMessage]);
        } else if (data.error) {
          toast.error(data.error);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Failed to reach AI Research Assistant.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error communicating with AI Research Assistant.");
    } finally {
      setIsSendingChatMessage(false);
    }
  };

  const handleSelectPaperMention = (paper: any) => {
    if (!selectedMentionedPapers.some((p) => (p.id || p._id) === (paper.id || paper._id))) {
      setSelectedMentionedPapers((prev) => [...prev, paper]);
    }

    if (chatInput.includes("@")) {
      const lastIdx = chatInput.lastIndexOf("@");
      const beforeAt = chatInput.slice(0, lastIdx);
      setChatInput(`${beforeAt}@${paper.title} `);
    } else {
      setChatInput((prev) => (prev ? `${prev} @${paper.title} ` : `@${paper.title} `));
    }
    setShowMentionDropdown(false);
    setMentionSearchQuery("");
  };

  const handleChatInputChange = (val: string) => {
    setChatInput(val);
    const lastAtIndex = val.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const queryAfterAt = val.slice(lastAtIndex + 1);
      if (!queryAfterAt.includes("\n") && queryAfterAt.length <= 40) {
        setShowMentionDropdown(true);
        setMentionSearchQuery(queryAfterAt.trim());
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  if (loadingProjects) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 py-6">
        {/* Page Header with Project Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Bot className="h-6 w-6 text-primary" /> AI Research Assistant
            </h1>
            <p className="text-xs text-muted-foreground">
              Contextual research co-pilot powered by Gemini AI with @ paper mentions.
            </p>
          </div>

          {projects.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                Active Project Context:
              </span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                {projects.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* If Student Has No Projects */}
        {projects.length === 0 ? (
          <Card className="surface-elevated flex flex-col items-center justify-center rounded-2xl border-dashed border-border py-16 px-6 text-center space-y-6">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Bot className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md">
              <Badge variant="outline" className="rounded-full border-primary/30 text-primary text-xs font-semibold">
                Project Workspace Scoped
              </Badge>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Create a Research Project to Enable AI Co-Pilot
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The AI Research Assistant synthesizes literature linked to a specific research project. Create your first project workspace to start exploring research queries.
              </p>
            </div>

            <Button
              onClick={() => (window.location.href = "/projects")}
              className="gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 text-xs"
            >
              <FolderKanban className="h-4 w-4" /> Go to Research Projects <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        ) : (
          /* Main Interactive Chat Window */
          <Card className="surface-elevated overflow-hidden rounded-2xl border-border bg-card flex flex-col min-h-[600px] shadow-sm">
            {/* Header Bar */}
            <div className="border-b border-border bg-muted/40 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary shadow-xs">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    {activeProject?.title || "Research Assistant"}
                    <Badge variant="outline" className="rounded-full text-[0.65rem] border-primary/30 text-primary bg-primary/10">
                      <Sparkles className="h-3 w-3 mr-1" /> Gemini AI
                    </Badge>
                  </h3>
                  <p className="text-[0.7rem] text-muted-foreground">
                    Domain: {activeProject?.domain || "General Science"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full text-[0.65rem] border-border text-foreground font-semibold px-2.5 py-1">
                  {loadingPapers ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />
                  ) : null}
                  {papers.length} Paper{papers.length === 1 ? "" : "s"} Indexed
                </Badge>

                {chatMessages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setChatMessages([])}
                    className="h-7 text-[0.7rem] text-muted-foreground hover:text-foreground"
                  >
                    Clear Chat
                  </Button>
                )}
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 max-h-[500px]">
              {chatMessages.length === 0 ? (
                <div className="space-y-6 max-w-2xl mx-auto py-6">
                  <div className="flex gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 text-xs text-foreground space-y-2">
                      <p className="font-bold text-primary text-sm">AI Research Co-Pilot Ready</p>
                      <p className="leading-relaxed text-muted-foreground">
                        I am synced with "{activeProject?.title}". Ask me about methodologies, quantitative findings, research gaps, or comparative conclusions across your literature.
                      </p>
                      <div className="pt-2 text-[0.75rem] text-foreground font-medium flex items-center gap-1.5">
                        <AtSign className="h-3.5 w-3.5 text-primary" /> Type <code className="rounded bg-primary/10 px-1 py-0.5 text-primary">@</code> to mention reference papers directly in your prompt.
                      </div>
                    </div>
                  </div>

                  {/* Suggested Quick Prompts */}
                  <div className="space-y-2">
                    <p className="text-[0.725rem] font-bold text-muted-foreground uppercase tracking-wider">Suggested Questions</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {papers.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const p = papers[0];
                              handleSendChatMessage(`@${p.title} What methodology was used in this paper?`, [p]);
                            }}
                            className="text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-xs space-y-1 group"
                          >
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                              <AtSign className="h-3 w-3 text-primary" /> @{papers[0].title.slice(0, 28)}...
                            </div>
                            <div className="text-[0.7rem] text-muted-foreground">What methodology was used?</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const p = papers[0];
                              handleSendChatMessage(`@${p.title} What are the key limitations?`, [p]);
                            }}
                            className="text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-xs space-y-1 group"
                          >
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                              <AtSign className="h-3 w-3 text-primary" /> @{papers[0].title.slice(0, 28)}...
                            </div>
                            <div className="text-[0.7rem] text-muted-foreground">What are the key limitations?</div>
                          </button>

                          {papers.length >= 2 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const p1 = papers[0];
                                const p2 = papers[1];
                                handleSendChatMessage(`@${p1.title} @${p2.title} Compare their methodologies.`, [p1, p2]);
                              }}
                              className="text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-xs space-y-1 group sm:col-span-2"
                            >
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                                <Layers className="h-3 w-3 text-primary" /> Compare Methodologies
                              </div>
                              <div className="text-[0.7rem] text-muted-foreground">Compare @{papers[0].title.slice(0, 22)} and @{papers[1].title.slice(0, 22)}</div>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendChatMessage(`How does this research relate to my project domain: ${activeProject?.domain}?`)}
                              className="text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-xs space-y-1 group"
                            >
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Domain Synthesis</div>
                              <div className="text-[0.7rem] text-muted-foreground">How is my literature related to my project?</div>
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendChatMessage(`What research methodology best fits "${activeProject?.title}" in ${activeProject?.domain}?`)}
                          className="text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-xs space-y-1 group sm:col-span-2"
                        >
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Methodology Advice</div>
                          <div className="text-[0.7rem] text-muted-foreground">What research methodology best fits my project domain?</div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary mt-1">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl p-4 text-xs max-w-2xl space-y-2 leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                          : "border border-border/80 bg-muted/30 text-foreground rounded-tl-xs"
                      }`}
                    >
                      {msg.mentionedPapers && msg.mentionedPapers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pb-1">
                          {msg.mentionedPapers.map((mp) => (
                            <Badge
                              key={mp.id}
                              variant="outline"
                              className={`text-[0.65rem] gap-1 font-semibold rounded-full px-2 py-0.5 ${
                                msg.role === "user"
                                  ? "bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground"
                                  : "bg-primary/10 border-primary/30 text-primary"
                              }`}
                            >
                              <AtSign className="h-3 w-3" /> {mp.title}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div
                        className={`text-[0.65rem] text-right ${
                          msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                    {msg.role === "user" && (
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground font-bold text-xs mt-1">
                        You
                      </div>
                    )}
                  </div>
                ))
              )}

              {isSendingChatMessage && (
                <div className="flex gap-3 justify-start">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary animate-pulse">
                    <Sparkles className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> AI co-pilot is analyzing literature and project context...
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Mentioned Paper Badges Bar */}
            {selectedMentionedPapers.length > 0 && (
              <div className="px-4 py-2 bg-muted/60 border-t border-border flex items-center flex-wrap gap-1.5">
                <span className="text-[0.7rem] font-bold text-muted-foreground flex items-center gap-1">
                  <AtSign className="h-3 w-3 text-primary" /> Mentioned Papers:
                </span>
                {selectedMentionedPapers.map((p) => (
                  <Badge
                    key={p.id || p._id}
                    variant="secondary"
                    className="rounded-full text-[0.675rem] gap-1 bg-primary/15 text-primary border border-primary/30 font-semibold px-2.5 py-0.5"
                  >
                    <span>{p.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMentionedPapers((prev) =>
                          prev.filter((item) => (item.id || item._id) !== (p.id || p._id))
                        )
                      }
                      className="hover:text-destructive text-primary/80 transition-colors ml-1 font-bold"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="relative border-t border-border p-4 bg-card">
              {showMentionDropdown && (
                <div className="absolute bottom-full left-4 right-4 mb-2 z-50 rounded-2xl border border-border bg-popover p-2 shadow-xl space-y-1 max-h-56 overflow-y-auto">
                  <div className="px-2 py-1 flex items-center justify-between border-b border-border/60 pb-1.5 mb-1">
                    <span className="text-[0.7rem] font-bold text-foreground flex items-center gap-1">
                      <AtSign className="h-3.5 w-3.5 text-primary" /> Select Paper from Project Literature
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground">
                      {papers.filter((p) => p.title.toLowerCase().includes(mentionSearchQuery.toLowerCase())).length} found
                    </span>
                  </div>

                  {papers.filter((p) => p.title.toLowerCase().includes(mentionSearchQuery.toLowerCase())).length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No reference paper matching "{mentionSearchQuery}" in current project library.
                    </div>
                  ) : (
                    papers
                      .filter((p) => p.title.toLowerCase().includes(mentionSearchQuery.toLowerCase()))
                      .map((paper) => {
                        const isSelected = selectedMentionedPapers.some(
                          (sp) => (sp.id || sp._id) === (paper.id || paper._id)
                        );
                        return (
                          <button
                            key={paper.id || paper._id}
                            type="button"
                            onClick={() => handleSelectPaperMention(paper)}
                            className={`w-full text-left p-2.5 rounded-xl transition-colors text-xs flex flex-col gap-0.5 ${
                              isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                            }`}
                          >
                            <div className="font-semibold truncate flex items-center justify-between gap-2">
                              <span>{paper.title}</span>
                              {paper.year && (
                                <Badge variant="outline" className="shrink-0 text-[0.6rem] px-1.5 py-0">
                                  {paper.year}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[0.675rem] text-muted-foreground truncate flex items-center gap-2">
                              <span>{paper.authors || "Unknown Authors"}</span>
                              {paper.journal && <span>• {paper.journal}</span>}
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex gap-2 items-center"
              >
                <div className="relative flex-1">
                  <Input
                    value={chatInput}
                    onChange={(e) => handleChatInputChange(e.target.value)}
                    placeholder={
                      papers.length > 0
                        ? "Ask a question about your literature... (Type @ to mention paper)"
                        : "Ask a general research question..."
                    }
                    className="rounded-xl text-xs bg-muted/40 pr-9 focus:bg-background"
                  />
                  {papers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowMentionDropdown((prev) => !prev)}
                      title="Mention Paper (@)"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1 rounded-md transition-colors"
                    >
                      <AtSign className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSendingChatMessage || !chatInput.trim()}
                  className="rounded-xl shrink-0 bg-primary text-primary-foreground font-semibold px-4"
                >
                  {isSendingChatMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
