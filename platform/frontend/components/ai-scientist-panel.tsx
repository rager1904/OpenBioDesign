"use client";

import { Download, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/use-app-store";
import { chatWithAiScientist } from "@/lib/api";

export function AiScientistPanel() {
  const messages = useAppStore((state) => state.messages);
  const addMessage = useAppStore((state) => state.addMessage);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;
    addMessage({ id: crypto.randomUUID(), role: "user", content: trimmed });
    setPrompt("");
    setIsLoading(true);
    try {
      const result = await chatWithAiScientist(trimmed);
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.response,
        citations: result.citations,
      });
    } catch {
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Unable to reach the AI Scientist backend. Please ensure the API server is running and try again.",
        citations: [],
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l bg-slate-950/56 backdrop-blur-xl lg:w-[360px]">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="text-sm font-semibold text-white">AI Scientist</h2>
          <p className="text-xs text-muted-foreground">Evidence-linked reasoning assistant</p>
        </div>
        <Button size="icon" variant="ghost" aria-label="Export chat">
          <Download />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "assistant" ? "rounded-lg border bg-slate-900/80 p-3" : "rounded-lg bg-cyan-300 p-3 text-slate-950"}>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
              {message.role === "assistant" && <Sparkles className="size-3" />}
              {message.role === "assistant" ? "OpenBioDesign Scientist" : "Researcher"}
            </div>
            <ReactMarkdown className="prose prose-invert max-w-none text-sm leading-6">{message.content}</ReactMarkdown>
            {message.citations && message.citations.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.citations.map((citation) => (
                  <Badge key={citation} tone="cyan">{citation}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {isLoading && (
          <div className="rounded-lg border bg-slate-900/80 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="size-3 animate-pulse" />
              OpenBioDesign Scientist
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Analyzing scientific context...</p>
          </div>
        )}
      </div>
      <div className="border-t p-4">
        <label className="sr-only" htmlFor="ai-prompt">Ask AI Scientist</label>
        <div className="flex gap-2">
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
            }}
            placeholder="Ask about target biology, docking interpretation, or next experiments..."
            className="min-h-20 flex-1 resize-none rounded-md border bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            disabled={isLoading}
          />
          <Button size="icon" variant="primary" aria-label="Send message" onClick={submit} disabled={isLoading}>
            <Send />
          </Button>
        </div>
      </div>
    </aside>
  );
}
