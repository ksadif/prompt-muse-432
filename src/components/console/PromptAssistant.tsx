import { useState } from "react";
import { Send, Sparkles, User } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "帮我审查当前 Prompt 的问题",
  "如何让回答更简洁？",
  "这个 Prompt 容易产生哪些幻觉？",
  "如何加入 few-shot 示例？",
];

export function PromptAssistant() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "你好，我是 Prompt 写作助手。可以帮你审查 Prompt 结构、找出潜在问题、给出改写建议。把你的诉求告诉我吧。",
    },
  ]);
  const [input, setInput] = useState("");

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [
      ...m,
      { role: "user", content: t },
      {
        role: "assistant",
        content:
          "（示例回复）我注意到你的 Prompt 角色定义较弱、输出格式未明确。建议：\n\n1. 在 System 中明确「你是 …，目标是 …」\n2. 使用 Markdown 段落约束输出格式\n3. 增加 1-2 个 few-shot 例子覆盖边界情况",
      },
    ]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full -m-5">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}
          >
            {m.role === "assistant" && (
              <div className="shrink-0 h-7 w-7 rounded-full bg-[var(--console-orange)]/15 text-[var(--console-orange)] flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-[var(--console-cta)] text-[var(--console-cta-foreground)]"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border p-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[11px] rounded-full border border-border px-2 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-md border border-border bg-background focus-within:border-[var(--console-orange)] p-1.5">
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
            placeholder="问点什么…（Enter 发送，Shift+Enter 换行）"
            className="flex-1 bg-transparent outline-none text-sm resize-none px-2 py-1"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
