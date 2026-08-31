"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Leaf, Plus, MessageSquare, Trash2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatHistory } from "@/hooks/useChatHistory";
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
import { motion, AnimatePresence } from "framer-motion";

export default function SustainAIPage() {
  const {
    sessions,
    activeSessionId,
    activeSession,
    setActiveSessionId,
    updateSession,
    createNewSession,
    deleteSession
  } = useChatHistory();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    // @ts-ignore
    api: "/api/chat",
    initialMessages: activeSession?.messages || [],
    onError: (err) => {
      console.error(err);
      toast.error(err.message || "Something went wrong. Please try again.");
    },
    onFinish: (message) => {
      // The local messages state will have the updated conversation.
      // We rely on a useEffect to sync it to the history store.
    }
  });

  // When active session changes, update the chat messages
  useEffect(() => {
    if (activeSession) {
      setMessages(activeSession.messages);
    } else {
      setMessages([]);
      // Auto-create a session if there's none
      createNewSession();
    }
  }, [activeSessionId]);

  // Sync messages to the active session whenever they change
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      updateSession(activeSessionId, messages);
    }
  }, [messages, activeSessionId]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (msg: PromptInputMessage) => {
    if (!msg.text.trim() && msg.files.length === 0) return;
    
    // Make sure we have an active session
    if (!activeSessionId) {
      const newId = createNewSession();
      // wait a tick for state to update
      setTimeout(() => {
         submitMessage(msg);
      }, 0);
      return;
    }

    submitMessage(msg);
  };

  const submitMessage = async (msg: PromptInputMessage) => {
    const parts: any[] = [];
    if (msg.text.trim()) parts.push({ type: "text", text: msg.text.trim() });
    for (const f of msg.files) {
      if (f.type === "file" && f.mediaType?.startsWith("image/")) {
        parts.push({ type: "file", mediaType: f.mediaType, url: f.url });
      }
    }
    await sendMessage({ parts });
  }

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-[calc(100vh-4rem)] pt-16 bg-background text-foreground overflow-hidden font-sans">
      
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 bg-muted/30 border-r border-border h-full flex flex-col"
          >
            <div className="p-4 flex items-center justify-between">
              <Button onClick={() => setIsSidebarOpen(false)} variant="ghost" size="icon" className="md:hidden">
                <X className="w-5 h-5" />
              </Button>
              <Button onClick={() => { setMessages([]); createNewSession(); }} className="w-full gap-2 justify-start rounded-full" variant="outline">
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">Recent</p>
              <div className="flex flex-col gap-1">
                {sessions.map(session => (
                  <div key={session.id} className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeSessionId === session.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}>
                    <div className="flex items-center gap-2 overflow-hidden" onClick={() => setActiveSessionId(session.id)}>
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="text-sm truncate">{session.title}</span>
                    </div>
                    <Button 
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b bg-background/80 backdrop-blur shrink-0 absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Leaf className="text-green-500 w-5 h-5" />
              <h2 className="font-semibold text-lg">Sustain AI</h2>
            </div>
          </div>
        </header>

        {/* Conversation List */}
        <div className="flex-1 overflow-hidden mt-14 bg-background">
          <Conversation className="h-full">
            <ConversationContent className="px-4 md:px-20 py-8 max-w-4xl mx-auto w-full h-full flex flex-col">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto pb-20">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-organic"
                  >
                    <Leaf className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h1 className="text-3xl md:text-4xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400">
                    Hello, I'm Sustain AI
                  </h1>
                  <p className="text-muted-foreground text-lg mb-8">
                    Ask me how to recycle specific items, upload a photo to identify plastic types, or get tips on reducing waste.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                     {["How do I recycle batteries?", "Identify this plastic type", "What are eco-credits?", "Tips for a zero-waste kitchen"].map(suggestion => (
                       <Button 
                         key={suggestion} 
                         variant="outline" 
                         className="h-auto py-3 px-4 justify-start text-left font-normal bg-card/50 hover:bg-accent hover:border-green-300 transition-colors"
                         onClick={() => sendMessage({ parts: [{ type: "text", text: suggestion }] })}
                       >
                         {suggestion}
                       </Button>
                     ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <Message key={m.id} from={m.role}>
                    <MessageContent>
                      {((m as any).parts || (m as any).content).map?.((part: any, i: number) => {
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
                              alt="Uploaded content"
                              className="mt-2 rounded-xl max-h-[300px] object-contain border border-border/60"
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
                <div className="px-2 py-4 flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Leaf className="w-4 h-4 text-green-600" />
                  </div>
                  <Shimmer>Sustain AI is thinking…</Shimmer>
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        {/* Input Area */}
        <div className="p-4 md:px-20 lg:px-40 pb-6 bg-gradient-to-t from-background via-background to-transparent shrink-0">
          <PromptInput
            onSubmit={handleSubmit}
            accept="image/*"
            multiple
            maxFiles={3}
            maxFileSize={8 * 1024 * 1024}
            onError={(e) => toast.error(e.message)}
            className="bg-card shadow-lg border-border/50 rounded-2xl max-w-4xl mx-auto"
          >
            <PromptInputTextarea ref={textareaRef} placeholder="Ask about recycling or upload a photo..." className="min-h-[50px]" />
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <div className="flex items-center gap-2">
                {isBusy && (
                  <Button variant="outline" size="sm" onClick={stop} className="text-xs h-8">
                    Stop generating
                  </Button>
                )}
                <PromptInputSubmit status={status} disabled={isBusy} />
              </div>
            </PromptInputFooter>
          </PromptInput>
          <div className="text-center mt-3 text-xs text-muted-foreground max-w-4xl mx-auto">
            Sustain AI can make mistakes. Consider verifying important information about local recycling guidelines.
          </div>
        </div>
      </div>
    </div>
  );
}
