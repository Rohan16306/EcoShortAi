import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { loadMessages, saveMessages, clearMessages } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Leaf, LogOut, Recycle, Sparkles as SparklesIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/ecosort-logo.png";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Ecosort AI · Recycling & Sustainability Assistant" },
      { name: "description", content: "Chat with Ecosort AI to identify plastics, learn recycling best practices, and grow your sustainability impact." },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  { icon: Recycle, label: "How do I identify plastic type #5 (PP)?" },
  { icon: Leaf, label: "Tips for reducing single-use plastic at home" },
  { icon: SparklesIcon, label: "How does the credit & reward system work?" },
];

function ChatPage() {
  const navigate = useNavigate();
  const loadFn = useServerFn(loadMessages);
  const saveFn = useServerFn(saveMessages);
  const clearFn = useServerFn(clearMessages);

  const { data: initialMessages, isLoading: loadingHistory } = useQuery({
    queryKey: ["messages"],
    queryFn: () => loadFn(),
  });

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const lastSavedCount = useRef(0);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onError: (err) => {
      console.error(err);
      toast.error(err.message || "Something went wrong. Please try again.");
    },
    onFinish: async ({ messages: finalMessages }) => {
      const newOnes = finalMessages.slice(lastSavedCount.current);
      if (newOnes.length === 0) return;
      try {
        await saveFn({ data: { messages: newOnes } });
        lastSavedCount.current = finalMessages.length;
      } catch (e) {
        console.error("Failed to save messages", e);
      }
    },
  });

  useEffect(() => {
    if (initialMessages && Array.isArray(initialMessages) && messages.length === 0 && initialMessages.length > 0) {
      setMessages(initialMessages as unknown as UIMessage[]);
      lastSavedCount.current = initialMessages.length;
    }
  }, [initialMessages, messages.length, setMessages]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (status === "ready") textareaRef.current?.focus();
  }, [status]);

  const handleSubmit = async (msg: PromptInputMessage) => {
    if (!msg.text.trim() && msg.files.length === 0) return;
    const parts: UIMessage["parts"] = [];
    if (msg.text.trim()) parts.push({ type: "text", text: msg.text.trim() });
    for (const f of msg.files) {
      if (f.type === "file" && f.mediaType?.startsWith("image/")) {
        parts.push({ type: "file", mediaType: f.mediaType, url: f.url });
      }
    }
    await sendMessage({ parts });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const handleClear = async () => {
    try {
      await clearFn();
      setMessages([]);
      lastSavedCount.current = 0;
      toast.success("Conversation cleared");
    } catch (e) {
      toast.error("Failed to clear conversation");
    }
  };

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col h-[100dvh] bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-leaf opacity-40 pointer-events-none" aria-hidden />

      <header className="relative z-10 border-b border-border/60 bg-card/70 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" width={36} height={36} className="h-9 w-9" />
            <div>
              <h1 className="text-base font-display font-semibold leading-tight">Ecosort AI</h1>
              <p className="text-xs text-muted-foreground">Recycling & sustainability assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleClear} disabled={messages.length === 0}>
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 flex flex-col">
        <Conversation className="flex-1">
          <ConversationContent className="max-w-3xl mx-auto w-full px-4 py-6">
            {messages.length === 0 && !loadingHistory ? (
              <ConversationEmptyState
                icon={<img src={logo} alt="" width={72} height={72} className="h-18 w-18" />}
                title="Hello, I'm Ecosort AI"
                description="Ask me about plastic types, recycling, or upload a photo of a plastic item and I'll help identify it."
              />
            ) : (
              messages.map((m) => (
                <Message key={m.id} from={m.role}>
                  <MessageContent>
                    {m.parts.map((part, i) => {
                      if (part.type === "text") {
                        return m.role === "assistant" ? (
                          <MessageResponse key={i}>{part.text}</MessageResponse>
                        ) : (
                          <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                        );
                      }
                      if (part.type === "file" && part.mediaType?.startsWith("image/")) {
                        return (
                          <img
                            key={i}
                            src={part.url}
                            alt="Uploaded plastic item"
                            className="mt-2 rounded-xl max-h-72 border border-border/60"
                          />
                        );
                      }
                      return null;
                    })}
                  </MessageContent>
                </Message>
              ))
            )}
            {status === "submitted" && (
              <div className="px-2 py-1">
                <Shimmer>Thinking…</Shimmer>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {messages.length === 0 && !loadingHistory && (
          <div className="max-w-3xl mx-auto w-full px-4 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => sendMessage({ parts: [{ type: "text", text: s.label }] })}
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 backdrop-blur hover:bg-accent transition-colors px-3.5 py-1.5 text-sm text-foreground/80"
              >
                <s.icon className="h-3.5 w-3.5 text-primary" />
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="max-w-3xl mx-auto w-full px-4 pb-4">
          <PromptInput
            onSubmit={handleSubmit}
            accept="image/*"
            multiple
            maxFiles={3}
            maxFileSize={8 * 1024 * 1024}
            onError={(e) => toast.error(e.message)}
            className="bg-card/90 backdrop-blur-xl border-border/60 shadow-organic"
          >
            <PromptInputTextarea ref={textareaRef} placeholder="Ask about recycling, sustainability, or attach a plastic photo…" />
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit status={status} disabled={isBusy} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Ecosort AI may make mistakes. Verify important info with local recycling guidelines.
          </p>
        </div>
      </main>
    </div>
  );
}
