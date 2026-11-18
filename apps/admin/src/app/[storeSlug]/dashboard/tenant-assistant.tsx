"use client";
// Vanij AI Assistant v2.0 - Optimized for Desktop & Mobile

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  ArrowUpRight,
  Loader2,
  Copy,
  Check,
  Pencil,
  CornerDownLeft,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionsTaken?: string[];
  timestamp: Date;
}

interface TenantAssistantProps {
  storeSlug: string;
  storeName: string;
}

// ========================================================
// ELEGANT MARKDOWN & TYPOGRAPHY PARSER (ZERO BROKEN ASTERISKS)
// ========================================================

function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex supporting:
  // 1. Markdown Links: [label](url)
  // 2. Bold + Italic: ***text*** or ___text___
  // 3. Bold: **text** or __text__
  // 4. Code: `text`
  // 5. Italic: *text* or _text_
  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*\*([^*]+)\*\*\*|___([^_]+)___|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g;
  
  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(cleanRawAsterisks(text.slice(lastIdx, match.index)));
    }

    if (match[2] && match[3]) {
      // [label](url)
      const label = match[2];
      const url = match[3];
      nodes.push(
        <Link
          key={`lnk-${match.index}`}
          href={url}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-1 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200 transition-colors shadow-2xs"
        >
          {label}
          <ArrowUpRight className="size-3 text-emerald-600" />
        </Link>
      );
    } else if (match[4] || match[5]) {
      // Bold + Italic (***text*** or ___text___)
      const content = match[4] || match[5];
      nodes.push(
        <strong key={`bi-${match.index}`} className="font-bold italic text-zinc-950">
          {content}
        </strong>
      );
    } else if (match[6] || match[7]) {
      // Bold (**text** or __text__)
      const content = match[6] || match[7];
      nodes.push(
        <strong key={`b-${match.index}`} className="font-bold text-zinc-950">
          {content}
        </strong>
      );
    } else if (match[8]) {
      // Code (`text`)
      nodes.push(
        <code key={`c-${match.index}`} className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono border border-zinc-200">
          {match[8]}
        </code>
      );
    } else if (match[9] || match[10]) {
      // Italic (*text* or _text_)
      const content = match[9] || match[10];
      nodes.push(
        <em key={`i-${match.index}`} className="italic text-zinc-800">
          {content}
        </em>
      );
    }

    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    nodes.push(cleanRawAsterisks(text.slice(lastIdx)));
  }

  return nodes.length > 0 ? nodes : [text];
}

/**
 * Removes stray unclosed asterisks so the text never looks broken or messy
 */
function cleanRawAsterisks(str: string): string {
  return str.replace(/\*{2,}/g, "").replace(/^\*+|\*+$/g, "");
}

function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  const renderedElements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      renderedElements.push(<div key={`sp-${index}`} className="h-2" />);
      return;
    }

    // Dividers (--- or *** or ___)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      renderedElements.push(<hr key={`hr-${index}`} className="my-3 border-zinc-200/80" />);
      return;
    }

    // Headings
    if (trimmed.startsWith("#### ")) {
      renderedElements.push(
        <h5 key={`h4-${index}`} className="font-bold text-xs uppercase tracking-wider text-zinc-700 mt-2.5 mb-1">
          {parseInlineFormatting(trimmed.replace(/^####\s+/, ""))}
        </h5>
      );
    } else if (trimmed.startsWith("### ")) {
      renderedElements.push(
        <h4 key={`h3-${index}`} className="font-bold text-sm text-zinc-950 mt-3 mb-1.5 flex items-center gap-1.5">
          {parseInlineFormatting(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      renderedElements.push(
        <h3 key={`h2-${index}`} className="font-bold text-base text-zinc-950 mt-3.5 mb-1.5">
          {parseInlineFormatting(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      renderedElements.push(
        <h2 key={`h1-${index}`} className="font-bold text-lg text-zinc-950 mt-4 mb-2">
          {parseInlineFormatting(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
    } 
    // Bullet Lists (*, -, •, +)
    else if (/^[*•\-+]\s+/.test(trimmed)) {
      const cleanBullet = trimmed.replace(/^[*•\-+]\s+/, "");
      renderedElements.push(
        <div key={`li-${index}`} className="flex items-start gap-2.5 text-xs sm:text-sm pl-1 my-1.5 leading-relaxed">
          <span className="size-1.5 rounded-full bg-emerald-600 mt-2 shrink-0 shadow-2xs" />
          <div className="flex-1 text-zinc-800">{parseInlineFormatting(cleanBullet)}</div>
        </div>
      );
    } 
    // Numbered Lists (1., 2., etc.)
    else if (/^\d+\.\s+/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      const num = numMatch ? numMatch[1] : "";
      const text = (numMatch && numMatch[2]) || trimmed;
      renderedElements.push(
        <div key={`ol-${index}`} className="flex items-start gap-2 text-xs sm:text-sm pl-1 my-1.5 leading-relaxed">
          <span className="font-bold text-emerald-700 text-xs mt-0.5 shrink-0 min-w-[16px]">{num}.</span>
          <div className="flex-1 text-zinc-800">{parseInlineFormatting(text)}</div>
        </div>
      );
    } 
    // Standard Paragraph
    else {
      renderedElements.push(
        <p key={`p-${index}`} className="text-xs sm:text-sm leading-relaxed text-zinc-800 my-1">
          {parseInlineFormatting(trimmed)}
        </p>
      );
    }
  });

  return <div className="space-y-0.5 font-sans">{renderedElements}</div>;
}

// ========================================================
// ANIMATED VANIJ ROBOT AVATAR WITH WAVING HAND
// ========================================================

function VanijAnimatedAvatar({ size = "md", isWaving = true }: { size?: "sm" | "md" | "lg"; isWaving?: boolean }) {
  const dim = size === "lg" ? "size-12" : size === "sm" ? "size-7" : "size-9";
  
  return (
    <div className={`relative ${dim} shrink-0 flex items-center justify-center select-none`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Subtle glow aura */}
        <circle cx="24" cy="24" r="22" className="fill-emerald-500/10" />

        {/* Robot Head Outer */}
        <rect x="8" y="10" width="32" height="28" rx="10" fill="#18181b" stroke="#27272a" strokeWidth="2" />
        
        {/* Antenna */}
        <path d="M24 10V4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="3" r="3" fill="#34d399" className="vanij-antenna-pulse" />

        {/* Face Screen Visor */}
        <rect x="12" y="15" width="24" height="15" rx="6" fill="#09090b" />

        {/* Digital Eyes with Eye Blink Animation */}
        <g className="vanij-robot-eyes">
          <circle cx="19" cy="22" r="3" fill="#10b981" />
          <circle cx="19" cy="21" r="1" fill="#ecfdf5" />
          <circle cx="29" cy="22" r="3" fill="#10b981" />
          <circle cx="29" cy="21" r="1" fill="#ecfdf5" />
        </g>

        {/* Friendly Mouth Line */}
        <path d="M21 26C22.2 27.2 25.8 27.2 27 26" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />

        {/* Robot Ears / Bolts */}
        <rect x="5" y="20" width="3" height="8" rx="1.5" fill="#52525b" />
        <rect x="40" y="20" width="3" height="8" rx="1.5" fill="#52525b" />

        {/* Animated Waving Hand */}
        {isWaving && (
          <g className="vanij-waving-hand" transform-origin="41 28">
            <path
              d="M41 28C44 26 46 23 45 20C44 18 41 20 40 23"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
      
      {/* Active Online Indicator Ring */}
      <span className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 rounded-full ring-2 ring-zinc-950 shadow-xs" />
    </div>
  );
}

// ========================================================
// MAIN VANIJ AI ASSISTANT COMPONENT
// ========================================================

export function TenantAssistant({ storeSlug, storeName }: TenantAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `Hello! 👋 I am **Vanij AI**, your dedicated store operating assistant for **${storeName}**.\n\nI have complete real-time access to your catalog, orders, and dashboard features. You can ask me to add books or products, update prices, check store analytics, or explain features in **English**, **বাংলা (Bengali)**, or **हिंदी (Hindi)**.\n\nWhat can I help you do today?`,
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleCopyMessage = (id: string, text: string) => {
    const cleanText = text
      .replace(/\*\*\*(.*?)\*\*\*/g, "$1")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1 ($2)");

    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (messageId: string, text: string) => {
    setEditingMessageId(messageId);
    setInput(text);
    inputRef.current?.focus();
    toast.info("Editing query — update and press Enter", { duration: 3000 });
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setInput("");
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const isBengali = /[\u0980-\u09FF]/.test(query);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setEditingMessageId(null);
    setIsLoading(true);

    try {
      const conversationHistory = [...messages.filter((m) => !m.id.startsWith("welcome-")), userMessage];
      const response = await fetch(`/api/${storeSlug}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process request");
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        actionsTaken: data.actionsTaken,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.actionsTaken && data.actionsTaken.length > 0) {
        toast.success("Action Executed Successfully", {
          description: data.actionsTaken.join("\n"),
        });
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const friendlyFallback = isBengali
        ? "একটু সময় নেওয়ার জন্য আন্তরিকভাবে দুঃখিত। আপনার স্টোরের তথ্যের সাথে সংযোগ পুনঃস্থাপন করা হচ্ছে। অনুগ্রহ করে একটু পর আবার প্রশ্নটি করুন অথবা অন্যভাবে জিজ্ঞাসা করুন, আমি সাহায্য করতে প্রস্তুত!"
        : "I apologize for the brief pause. I am momentarily syncing with your store records. Please ask again in just a moment, or feel free to rephrase your question. I am right here to help!";

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: friendlyFallback,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === "Escape" && editingMessageId) {
      handleCancelEdit();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: `Chat cleared. How can I assist you with **${storeName}** now?`,
        timestamp: new Date(),
      },
    ]);
    setEditingMessageId(null);
  };

  // Curated Quick Starters
  const quickStarters = [
    { label: "📊 Store overview", prompt: "Give me an overview of my store metrics and performance." },
    { label: "🛍️ How to add products?", prompt: "How do I add a new product step-by-step?" },
    { label: "📦 Variant advice", prompt: "What variants and pack sizes do you recommend for my store?" },
    { label: "📋 Check recent orders", prompt: "Show me my recent customer orders." },
  ];

  return (
    <>
      {/* INJECT HIGH-PERFORMANCE CUSTOM CSS FOR ANIMATIONS & SCROLLBAR HIDING */}
      <style jsx global>{`
        /* Completely hide scrollbars across all browsers while allowing natural touch/mouse scroll */
        .vanij-hide-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .vanij-hide-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        /* Waving Robot Hand Keyframe */
        @keyframes vanijWave {
          0%, 100% {
            transform: rotate(0deg);
          }
          15%, 45% {
            transform: rotate(18deg);
          }
          30%, 60% {
            transform: rotate(-12deg);
          }
          75% {
            transform: rotate(6deg);
          }
        }

        /* Robot Eye Blink Keyframe */
        @keyframes vanijBlink {
          0%, 90%, 100% {
            transform: scaleY(1);
          }
          95% {
            transform: scaleY(0.1);
          }
        }

        /* Antenna Glow Pulse */
        @keyframes vanijPulse {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 2px #10b981);
          }
          50% {
            opacity: 0.4;
            filter: drop-shadow(0 0 6px #34d399);
          }
        }

        /* Floating Breathing Trigger */
        @keyframes vanijFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .vanij-waving-hand {
          animation: vanijWave 2.8s ease-in-out infinite;
          transform-origin: 38px 26px;
        }

        .vanij-robot-eyes {
          animation: vanijBlink 4.2s infinite;
          transform-origin: 24px 22px;
        }

        .vanij-antenna-pulse {
          animation: vanijPulse 2s infinite;
        }

        .vanij-float-trigger {
          animation: vanijFloat 3.5s ease-in-out infinite;
        }
      `}</style>

      {/* ======================================================== */}
      {/* 1. FLOATING ACTION TRIGGER (MOBILE & DESKTOP TUNED) */}
      {/* ======================================================== */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 vanij-float-trigger">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 bg-zinc-950 text-white pl-2.5 pr-4 py-2.5 rounded-full shadow-2xl hover:shadow-emerald-500/20 hover:scale-[1.03] active:scale-95 transition-all duration-200 border border-zinc-800/80 backdrop-blur-md"
            aria-label="Open Vanij AI"
          >
            {/* Ambient Animated Glow Ring */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />

            <div className="relative">
              <VanijAnimatedAvatar size="md" isWaving={true} />
            </div>

            <div className="relative text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-white">
                  Vanij AI
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-mono px-1 py-0.2 rounded font-semibold border border-emerald-500/30">
                  SMART
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">
                Store Copilot & Insights
              </p>
            </div>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CHAT DRAWER / BOTTOM SHEET FOR MOBILE & DESKTOP */}
      {/* ======================================================== */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay for smooth tap-outside dismiss */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 sm:hidden animate-in fade-in duration-200"
          />

          {/* Chat Window: Full-width Bottom Sheet on Mobile, Luxury Floating Drawer on Desktop */}
          <div className="fixed inset-x-0 bottom-0 z-50 h-[88vh] sm:h-[620px] sm:w-[450px] sm:inset-auto sm:bottom-6 sm:right-6 bg-white sm:rounded-2xl rounded-t-[28px] shadow-2xl border border-zinc-200/90 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-250">
            
            {/* Mobile Sheet Pull Indicator */}
            <div className="w-full flex justify-center pt-2 pb-1 bg-zinc-950 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-zinc-700/80" />
            </div>

            {/* Premium Header */}
            <div className="bg-zinc-950 text-white px-4 py-3 sm:py-3.5 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
              <div className="flex items-center gap-3">
                <VanijAnimatedAvatar size="md" isWaving={false} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold tracking-tight text-white">
                      Vanij AI
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Managing {storeName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  title="Clear chat history"
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition active:scale-95"
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close Assistant"
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/80 transition active:scale-95"
                >
                  <ChevronDown className="size-5 sm:hidden" />
                  <X className="size-4 hidden sm:block" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Body (Zero Scrollbar Visible) */}
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto vanij-hide-scrollbar space-y-3.5 bg-zinc-50/70 font-sans">
              {messages.map((m) => {
                const isAssistant = m.role === "assistant";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`relative max-w-[92%] sm:max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                        isAssistant
                          ? "bg-white text-zinc-800 border border-zinc-200/90 rounded-tl-sm"
                          : "bg-zinc-950 text-white rounded-tr-sm"
                      }`}
                    >
                      {isAssistant ? (
                        <FormattedMessage content={m.content} />
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{m.content}</p>
                      )}

                      {/* Action Confirmation Badges */}
                      {m.actionsTaken && m.actionsTaken.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-100 flex flex-col gap-1">
                          {m.actionsTaken.map((act, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50/90 px-2.5 py-1 rounded-md border border-emerald-200/60"
                            >
                              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interactive Action Bar (Copy & Edit) */}
                    <div className="flex items-center gap-1.5 mt-1 px-1 opacity-80 sm:opacity-70 hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-zinc-400 mr-0.5">
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <button
                        onClick={() => handleCopyMessage(m.id, m.content)}
                        title="Copy message"
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md transition shadow-2xs active:scale-95"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="size-3 text-emerald-600" />
                            <span className="text-emerald-700 font-medium text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>

                      {!isAssistant && (
                        <button
                          onClick={() => handleStartEdit(m.id, m.content)}
                          title="Edit question"
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md transition shadow-2xs active:scale-95"
                        >
                          <Pencil className="size-3" />
                          <span className="text-[10px]">Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-2.5 text-zinc-600 bg-white border border-zinc-200/90 w-fit px-3.5 py-2.5 rounded-2xl text-xs shadow-xs animate-in fade-in">
                  <Loader2 className="size-3.5 animate-spin text-emerald-600 shrink-0" />
                  <span className="font-medium">Vanij AI is analyzing store records...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starters Carousel (Zero Scrollbar Visible) */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-3 py-2 bg-white border-t border-zinc-100 flex items-center gap-2 overflow-x-auto vanij-hide-scrollbar shrink-0">
                {quickStarters.map((starter, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(starter.prompt)}
                    className="whitespace-nowrap text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 transition-all shrink-0 active:scale-95"
                  >
                    {starter.label}
                  </button>
                ))}
              </div>
            )}

            {/* Active Edit Mode Banner */}
            {editingMessageId && (
              <div className="bg-amber-50/90 border-t border-amber-200/80 px-3.5 py-2 flex items-center justify-between text-xs text-amber-900 shrink-0 animate-in fade-in">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <Pencil className="size-3 text-amber-600 shrink-0" />
                  Editing question... Press Enter or click send to update
                </span>
                <button
                  onClick={handleCancelEdit}
                  className="text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-0.5 text-[11px] ml-2 active:scale-95"
                >
                  <X className="size-3.5" /> Cancel
                </button>
              </div>
            )}

            {/* Bottom Message Input Bar */}
            <div className="p-3 bg-white border-t border-zinc-200/80 flex items-center gap-2 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={editingMessageId ? "Edit your question..." : "Ask Vanij in English, বাংলা, हिंदी..."}
                className="flex-1 bg-zinc-100/90 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 disabled:opacity-50 transition"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                className="size-10 bg-zinc-950 text-white rounded-xl flex items-center justify-center hover:bg-zinc-800 disabled:opacity-40 transition-all active:scale-95 shrink-0 shadow-xs"
                aria-label={editingMessageId ? "Update and send" : "Send message"}
                title={editingMessageId ? "Update and send" : "Send"}
              >
                {editingMessageId ? <CornerDownLeft className="size-4" /> : <Send className="size-4" />}
              </button>
            </div>

          </div>
        </>
      )}
    </>
  );
}
