import { useState } from "react";
import {
  ChevronRight,
  Terminal,
  FileEdit,
  FileSearch,
  Wrench,
  Search,
  Sparkles,
  Loader2,
  ImageIcon,
  StickyNote,
} from "lucide-react";

type ActivityIcon =
  | "terminal"
  | "edit"
  | "read"
  | "search"
  | "tool"
  | "ai"
  | "image"
  | "note";

const ICONS: Record<ActivityIcon, typeof Terminal> = {
  terminal: Terminal,
  edit: FileEdit,
  read: FileSearch,
  search: Search,
  tool: Wrench,
  ai: Sparkles,
  image: ImageIcon,
  note: StickyNote,
};

export type ActivityItem = {
  icon?: ActivityIcon;
  label: string;
  tag?: string;
};

export type TrajectoryStep =
  | { kind: "user-text"; content: string }
  | { kind: "user-attachment"; icon: "image" | "note"; content: string }
  | { kind: "agent"; content: string }
  | { kind: "activity"; summary: string; items: ActivityItem[] }
  | { kind: "working"; label?: string };

function ActivityBlock({ summary, items }: { summary: string; items: ActivityItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-[12.5px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition group"
      >
        <span>{summary}</span>
        <ChevronRight
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""} group-hover:translate-x-0.5`}
        />
      </button>
      {open && (
        <div className="mt-1.5 ml-1 pl-2.5 border-l border-border space-y-1">
          {items.map((it, i) => {
            const Icon = ICONS[it.icon ?? "tool"];
            return (
              <div key={i} className="flex items-center gap-2 text-[12px] text-foreground/80">
                <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{it.label}</span>
                {it.tag && (
                  <span className="inline-flex items-center rounded-md bg-muted/70 px-1.5 py-0.5 text-[10.5px] font-mono text-muted-foreground">
                    {it.tag}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserBubble({
  icon,
  children,
}: {
  icon?: "image" | "note";
  children: React.ReactNode;
}) {
  const Icon = icon === "image" ? ImageIcon : icon === "note" ? StickyNote : null;
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-2 text-[12.5px] leading-relaxed shadow-sm flex items-start gap-1.5">
        {Icon && <Icon className="h-3 w-3 mt-0.5 shrink-0 opacity-80" />}
        <div className="min-w-0 flex-1 break-words whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  );
}

export function TrajectoryView({
  steps,
  emptyHint,
}: {
  steps: TrajectoryStep[];
  emptyHint?: React.ReactNode;
}) {
  if (steps.length === 0) {
    return emptyHint ? (
      <div className="text-xs text-muted-foreground py-10 text-center">{emptyHint}</div>
    ) : null;
  }
  return (
    <div className="space-y-3">
      {steps.map((s, i) => {
        if (s.kind === "user-text") {
          return (
            <UserBubble key={i}>
              {s.content || <span className="opacity-60">（无输入文本）</span>}
            </UserBubble>
          );
        }
        if (s.kind === "user-attachment") {
          return (
            <UserBubble key={i} icon={s.icon}>
              {s.content}
            </UserBubble>
          );
        }
        if (s.kind === "activity") {
          return <ActivityBlock key={i} summary={s.summary} items={s.items} />;
        }
        if (s.kind === "working") {
          return (
            <div
              key={i}
              className="inline-flex items-center gap-2 text-[12px] text-muted-foreground"
            >
              <Loader2 className="h-3 w-3 animate-spin text-[var(--console-orange)]" />
              <span>{s.label ?? "Working on it…"}</span>
            </div>
          );
        }
        // agent — plain text, no bubble (Cowork style)
        return (
          <div
            key={i}
            className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap break-words"
          >
            {s.content}
          </div>
        );
      })}
    </div>
  );
}

// Demo helpers — produce a Cowork-style trajectory for a given input/agent name
export function buildDemoTrajectory(input: string, agentName: string): TrajectoryStep[] {
  return [
    {
      kind: "agent",
      content: `让我先分析一下问题，然后调用知识库和相关工具来回答。`,
    },
    {
      kind: "activity",
      summary: "Ran 2 commands",
      items: [
        { icon: "search", label: "知识库检索", tag: "命中 3 条" },
        { icon: "tool", label: "意图识别", tag: "咨询类" },
      ],
    },
    {
      kind: "agent",
      content: `检索到相关上下文，正在生成回答。`,
    },
    {
      kind: "activity",
      summary: "Used 1 tool",
      items: [{ icon: "ai", label: agentName, tag: "draft" }],
    },
    {
      kind: "agent",
      content: `[${agentName}] 模拟输出 — ${input || "（空输入）"}`,
    },
  ];
}
