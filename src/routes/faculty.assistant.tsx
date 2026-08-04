import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Send, Bot, User, BookOpen, Lightbulb, FileSearch } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/faculty/assistant")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — ScholarNexus AI Faculty" },
      { name: "description", content: "Faculty AI assistant for paper analysis and grant drafting." },
    ],
  }),
  component: FacultyAssistantPage,
});

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

function FacultyAssistantPage() {
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "assistant",
      text: "Greetings, Professor. I am your ScholarNexus AI Academic Assistant. How may I assist with manuscript reviewing, grant proposal drafting, or literature synthesis today?",
      timestamp: "Just now",
    },
  ]);

  const handleSend = () => {
    if (!inputQuery.trim()) return;
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: inputQuery,
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");

    setTimeout(() => {
      const aiReply: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "assistant",
        text: `I have analyzed your query regarding "${inputQuery}". Based on your lab's active publications, I recommend focusing on benchmark comparison with SOTA transformers and highlighting low-latency edge deployment metrics.`,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-semibold">
              Faculty AI Copilot
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mt-1">
              AI Research & Review Assistant
            </h1>
          </div>
        </div>

        {/* Chat Conversation Box */}
        <Card className="flex-1 rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "assistant" && (
                  <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white font-medium"
                      : "bg-background border border-border text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <div className="pt-4 border-t border-border flex items-center gap-2">
            <Input
              placeholder="Ask AI to synthesize paper drafts, generate feedback templates..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="rounded-xl text-xs"
            />
            <Button
              onClick={handleSend}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
