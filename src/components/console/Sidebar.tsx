import { Link, useLocation } from "@tanstack/react-router";
import {
  Wrench,
  Sparkles,
  BarChart3,
  Terminal,
  Briefcase,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  BookOpen,
  Box,
} from "lucide-react";
import { useState } from "react";

type NavItem = { label: string; to?: string };
type Section = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  items?: NavItem[];
};

const sections: Section[] = [
  {
    icon: Wrench,
    label: "构建",
    items: [
      { label: "Prompt 工作台", to: "/" },
      { label: "测试集管理", to: "/evaluate" },
      { label: "文件" },
      { label: "技能" },
      { label: "批处理" },
    ],
  },
  {
    icon: Sparkles,
    label: "托管 Agent",
    badge: "新",
    items: [
      { label: "快速开始" },
      { label: "Agent 列表" },
      { label: "会话" },
      { label: "环境" },
      { label: "凭证库" },
      { label: "记忆库" },
    ],
  },
  { icon: BarChart3, label: "数据分析" },
  { icon: Terminal, label: "Claude Code" },
  { icon: Briefcase, label: "管理" },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState<Record<string, boolean>>({
    Build: true,
    "Managed Agents": true,
  });

  return (
    <aside className="w-[260px] shrink-0 border-r border-border bg-[var(--console-sidebar)] flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-[17px] font-semibold tracking-tight">Claude Console</h1>
        <button className="text-muted-foreground hover:text-foreground">
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 mb-2">
        <button className="w-full flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent">
          <span className="flex items-center gap-2">
            <Box className="h-4 w-4 text-[var(--console-orange)]" />
            云杰空间
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 text-sm">
        {sections.map((s) => {
          const Icon = s.icon;
          const isOpen = open[s.label];
          return (
            <div key={s.label} className="mb-1">
              <button
                onClick={() => setOpen((o) => ({ ...o, [s.label]: !o[s.label] }))}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-foreground"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Icon className="h-4 w-4" />
                  {s.label}
                  {s.badge && (
                    <span className="ml-1 rounded bg-[var(--console-orange)]/15 text-[var(--console-orange)] text-[10px] px-1.5 py-0.5 font-medium">
                      {s.badge}
                    </span>
                  )}
                </span>
                {s.items ? (
                  isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              {s.items && isOpen && (
                <div className="mt-0.5 ml-2 pl-4 border-l border-border">
                  {s.items.map((it) => {
                    const active = it.to && pathname === it.to;
                    const cls = `block px-3 py-1.5 rounded-md text-[13px] ${
                      active
                        ? "bg-[var(--console-active)] text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`;
                    return it.to ? (
                      <Link key={it.label} to={it.to} className={cls}>
                        {it.label}
                      </Link>
                    ) : (
                      <a key={it.label} className={cls} href="#">
                        {it.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-3 space-y-2">
        <a className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground">
          <BookOpen className="h-4 w-4" /> Documentation
        </a>
        <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent">
          <div className="h-8 w-8 rounded-md bg-foreground text-background flex items-center justify-center text-xs font-semibold">
            yz
          </div>
          <div className="flex-1 text-left">
            <div className="text-xs font-medium">yz</div>
            <div className="text-[11px] text-muted-foreground truncate">
              Admin · yz's Indivi…
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </aside>
  );
}
