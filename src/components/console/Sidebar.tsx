import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, PanelLeftClose, BookOpen, Box } from "lucide-react";

const items: { label: string; to: string }[] = [
  { label: "Prompt 工作台", to: "/prompt" },
  { label: "Agent 编排", to: "/" },
  { label: "测试集管理", to: "/evaluate" },
];

export function Sidebar() {
  const { pathname } = useLocation();

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
        {items.map((it) => {
          const active = pathname === it.to;
          return (
            <Link
              key={it.label}
              to={it.to}
              className={`block px-3 py-2 rounded-md text-[13px] ${
                active
                  ? "bg-[var(--console-active)] text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-3 space-y-2">
        <a className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground">
          <BookOpen className="h-4 w-4" /> 帮助文档
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
