import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, Wand2, Bug, Scissors, Lightbulb } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_ACTIONS = [
  { icon: Bug, label: "审查问题", prompt: "帮我审查当前 Prompt 的潜在问题" },
  { icon: Scissors, label: "更简洁", prompt: "如何让回答更简洁、更聚焦？" },
  { icon: Lightbulb, label: "防幻觉", prompt: "这个 Prompt 容易产生哪些幻觉？怎么避免？" },
  { icon: Wand2, label: "加示例", prompt: "如何加入 few-shot 示例提升稳定性？" },
];

export function PromptAssistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [
      ...m,
      { role: "user", content: t },
      {
        role: "assistant",
        content:
          "我看了下你的 Prompt，给几点建议：\n\n**1. 角色定义**：在 System 顶部明确「你是 …，目标是 …」，让模型有稳定的视角。\n\n**2. 输出格式**：用 Markdown 段落或 JSON Schema 约束输出结构。\n\n**3. 边界覆盖**：补 1-2 个 few-shot 示例覆盖常见 corner case。\n\n需要我直接给出改写后的版本吗？",
      },
    ]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full -m-5">
      {/* 消息区 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <Welcome onPick={send} />
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} />
            ))}
          </div>
        )}
      </div>

      {/* 快捷操作 */}
      {messages.length > 0 && (
        <div className="px-3 pt-2 flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((q) => (
            <button
              key={q.label}
              onClick={() => send(q.prompt)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-[var(--console-orange)] hover:text-[var(--console-orange)] transition"
            >
              <q.icon className="h-3 w-3" />
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* 输入区 */}
      <div className="p-3">
        <div className="rounded-2xl border border-border bg-background focus-within:border-[var(--console-orange)] focus-within:ring-2 focus-within:ring-[var(--console-orange)]/15 transition shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            placeholder="问点什么…"
            className="w-full bg-transparent outline-none text-sm resize-none px-3.5 pt-3 pb-1 placeholder:text-muted-foreground/70"
          />
          <div className="flex items-center justify-between px-2.5 pb-2">
            <span className="text-[10px] text-muted-foreground/70">
              Enter 发送 · Shift+Enter 换行
            </span>
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-2 py-8">
      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[var(--console-orange)] to-amber-400 flex items-center justify-center shadow-lg shadow-[var(--console-orange)]/20">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
      <div className="mt-3 text-[15px] font-semibold">Prompt 写作助手</div>
      <p className="mt-1 text-xs text-muted-foreground max-w-[260px] leading-relaxed">
        审查结构、找出潜在问题、给出改写建议。试试下面的操作开始：
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-[300px]">
        {QUICK_ACTIONS.map((q) => (
          <button
            key={q.label}
            onClick={() => onPick(q.prompt)}
            className="group flex flex-col items-start gap-1.5 rounded-xl border border-border bg-background p-3 text-left hover:border-[var(--console-orange)] hover:bg-[var(--console-orange)]/[0.03] transition"
          >
            <q.icon className="h-4 w-4 text-[var(--console-orange)]" />
            <span className="text-xs font-medium">{q.label}</span>
            <span className="text-[10px] text-muted-foreground line-clamp-2">
              {q.prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3.5 py-2 text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-[var(--console-orange)] to-amber-400 flex items-center justify-center shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted/60 text-foreground px-3.5 py-2 text-sm whitespace-pre-wrap leading-relaxed">
        {renderMarkdownLite(msg.content)}
      </div>
    </div>
  );
}

function renderMarkdownLite(text: string) {
  // 极简 markdown：**bold** 与段落
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
