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
      <div className="flex items-center gap-2 px-5 pt-4">
        <button className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent">
          <List className="h-3.5 w-3.5" />
        </button>
        <button className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border hover:bg-accent text-[var(--console-orange)]">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-start justify-between px-5 pt-3 pb-4">
        <div>
          <button className="flex items-center gap-1 text-[20px] font-semibold tracking-tight">
            {title}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
            <span>Last saved {savedAt}</span>
            {rightExtra}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full bg-[var(--console-active)] p-1 text-sm">
            <Link
              to="/"
              className={`px-4 py-1.5 rounded-full transition ${
                pathname === "/"
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground"
              }`}
            >
              Prompt
            </Link>
            <Link
              to="/evaluate"
              className={`px-4 py-1.5 rounded-full transition ${
                pathname === "/evaluate"
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground"
              }`}
            >
              Evaluate
            </Link>
          </div>

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
    </div>
  );
}
