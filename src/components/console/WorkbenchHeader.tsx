import { Link, useLocation } from "@tanstack/react-router";
import { ChevronDown, List, Plus, Play, Code2 } from "lucide-react";

export function WorkbenchHeader({
  title,
  savedAt,
  rightExtra,
}: {
  title: string;
  savedAt: string;
  rightExtra?: React.ReactNode;
}) {
  const { pathname } = useLocation();
  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <div className="flex items-center gap-2">
          <button className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent">
            <List className="h-3.5 w-3.5" />
          </button>
          <button className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent text-[var(--console-orange)]">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent">
            <Code2 className="h-3.5 w-3.5" /> Get Code
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-4 py-1.5 text-sm font-medium hover:opacity-90">
            <Play className="h-3.5 w-3.5 fill-current" />
            {pathname === "/evaluate" ? "Run Remaining" : "Run"}
            <span className="ml-1 text-[11px] opacity-70">⌘ + ⏎</span>
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-4 px-5 pt-3 pb-4">
        <div className="min-w-0">
          <button className="flex items-center gap-1 text-[20px] font-semibold tracking-tight">
            <span className="truncate">{title}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
            <span>Last saved {savedAt}</span>
            {rightExtra}
          </div>
        </div>

        <div className="absolute left-1/2 top-3 -translate-x-1/2 inline-flex shrink-0 rounded-full bg-muted/70 p-0.5 text-xs">
          <Link
            to="/"
            className={`px-3 py-1 rounded-full transition ${
              pathname === "/"
                ? "bg-background shadow-sm font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Prompt 编辑
          </Link>
          <Link
            to="/evaluate"
            className={`px-3 py-1 rounded-full transition ${
              pathname === "/evaluate"
                ? "bg-background shadow-sm font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            效果测试
          </Link>
        </div>
      </div>
    </div>
  );
}
