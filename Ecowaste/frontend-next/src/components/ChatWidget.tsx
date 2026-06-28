
"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { MessageSquare, X, Recycle, Leaf, SparklesIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

const SUGGESTIONS = [
  { icon: Recycle, label: "How do I identify plastic type #5 (PP)?" },
  { icon: Leaf, label: "Tips for reducing single-use plastic at home" },
  { icon: SparklesIcon, label: "How does the credit & reward system work?" },
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const { messages, sendMessage, status, setMessages } = useChat({
    onError: (err) => {
      console.error(err);
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (isOpen && status === "ready") {
      textareaRef.current?.focus();
    }
  }, [isOpen, status]);

  const handleSubmit = async (msg: PromptInputMessage) => {
    if (!msg.text.trim() && msg.files.length === 0) return;
    const parts: any[] = [];
    if (msg.text.trim()) parts.push({ type: "text", text: msg.text.trim() });
    for (const f of msg.files) {
      if (f.type === "file" && f.mediaType?.startsWith("image/")) {
        parts.push({ type: "file", mediaType: f.mediaType, url: f.url });
      }
    }
    await sendMessage({ parts });
  };

  const handleClear = () => {
    setMessages([]);
    toast.success("Conversation cleared");
  };

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          aria-label="Toggle chat window"
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-organic bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-organic flex flex-col overflow-hidden"
          >
            <header className="px-4 py-3 border-b flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm">Ecosort AI</h3>
                  <p className="text-[10px] text-muted-foreground">Recycling & Sustainability</p>
                </div>
              </div>
              <Button aria-label="Clear conversation" variant="ghost" size="icon" onClick={handleClear} disabled={messages.length === 0}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </header>

            <div className="flex-1 overflow-hidden relative flex flex-col bg-background/50">
              <Conversation className="flex-1">
                <ConversationContent className="px-4 py-6 w-full">
                  {messages.length === 0 ? (
                    <ConversationEmptyState
                      icon={<Leaf className="h-12 w-12 text-primary" />}
                      title="Hello, I'm Ecosort AI"
                      description="Ask me about plastic types, recycling, or upload a photo of a plastic item and I'll help identify it."
                    />
                  ) : (
                    messages.map((m) => (
                      <Message key={m.id} from={m.role}>
                        <MessageContent>
                          {((m as any).parts || (m as any).content).map?.((part: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, i: number) => {
                            if (typeof part === 'string') {
                              return m.role === "assistant" ? (
                                <MessageResponse key={i}>{part}</MessageResponse>
                              ) : (
                                <p key={i} className="whitespace-pre-wrap">{part}</p>
                              );
                            }
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
                                  className="mt-2 rounded-xl max-h-48 border border-border/60"
                                />
                              );
                            }
                            return null;
                          }) || (
                            m.role === "assistant" ? (
                              <MessageResponse>{(m as any).content}</MessageResponse>
                            ) : (
                              <p className="whitespace-pre-wrap">{(m as any).content}</p>
                            )
                          )}
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

              {messages.length === 0 && (
                <div className="px-4 pb-3 flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => sendMessage({ parts: [{ type: "text", text: s.label }] })}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 hover:bg-accent transition-colors px-3 py-2 text-xs text-left"
                    >
                      <s.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-card border-t">
              <PromptInput
                onSubmit={handleSubmit}
                accept="image/*"
                multiple
                maxFiles={3}
                maxFileSize={8 * 1024 * 1024}
                onError={(e) => toast.error(e.message)}
                className="bg-background border-border/60"
              >
                <PromptInputTextarea ref={textareaRef} placeholder="Ask about recycling..." className="min-h-[40px] text-sm" />
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
