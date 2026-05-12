import { createFileRoute } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { WorkbenchHeader } from "@/components/console/WorkbenchHeader";
import {
  Settings2,
  Braces,
  Wrench,
  Sparkles,
  Info,
  ChevronDown,
  Paperclip,
  SquareDashed,
  MessagesSquare,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { GeneratePromptDialog } from "@/components/console/GeneratePromptDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Workbench · Claude Console" }],
  }),
  component: PromptPage,
});

function PromptPage() {
  const [system, setSystem] = useState("");
  const [user, setUser] = useState("");
  const [genOpen, setGenOpen] = useState(false);

  return (
    <ConsoleShell>
      <WorkbenchHeader title="点点3.0-Prompt" savedAt="May 11, 2:56 PM" />

      <div className="grid grid-cols-[1fr_360px] gap-0">
        {/* Left: prompt editor */}
        <div className="px-6 py-5 border-r border-border min-h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between text-sm mb-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 text-foreground hover:text-foreground">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                claude-opus-4-7
              </button>
              <button className="text-muted-foreground hover:text-foreground">
                <Braces className="h-3.5 w-3.5" />
              </button>
              <button className="text-muted-foreground hover:text-foreground">
                <Wrench className="h-3.5 w-3.5" />
              </button>
              <button className="text-muted-foreground hover:text-foreground text-sm">
                Examples
              </button>
            </div>
            <button className="inline-flex items-center gap-1.5 text-sm text-[var(--console-orange)] hover:opacity-80">
              <Sparkles className="h-3.5 w-3.5" />
              Templatize
            </button>
          </div>

          {/* System Prompt */}
          <div className="rounded-lg border border-border bg-background mb-4">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                System Prompt
                <Info className="h-3 w-3 text-muted-foreground" />
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <textarea
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              placeholder="Define a role, tone or context (optional)"
              className="w-full px-4 py-3 text-sm bg-transparent outline-none resize-none min-h-[80px] placeholder:text-muted-foreground"
            />
          </div>

          {/* User */}
          <div className="rounded-lg border border-border bg-background mb-3">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <div className="text-sm font-medium">User</div>
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-start gap-2 px-3 py-3">
              <button
                onClick={() => setGenOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-accent shrink-0"
              >
                <Sparkles className="h-3 w-3 text-[var(--console-orange)]" />
                Generate Prompt
              </button>
              <textarea
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="or enter instructions or prompt for Claude…"
                className="flex-1 bg-transparent text-sm outline-none resize-none min-h-[32px] placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <button className="inline-flex items-center gap-1.5 hover:text-foreground">
              <SquareDashed className="h-3.5 w-3.5" /> Pre-fill response
            </button>
            <button className="inline-flex items-center gap-1.5 hover:text-foreground">
              <MessagesSquare className="h-3.5 w-3.5" /> Add message pair
            </button>
          </div>
        </div>

        {/* Right: welcome panel */}
        <aside className="px-6 py-6 min-h-[calc(100vh-120px)]">
          <h2 className="text-xl font-semibold mb-5">Welcome to Workbench</h2>
          <ul className="space-y-3.5 text-sm text-foreground/90">
            {[
              <>
                Write a prompt in the left column, and click{" "}
                <span className="inline-flex items-center gap-1 rounded bg-foreground/90 text-background px-1.5 py-0.5 text-xs">
                  ▶ Run
                </span>{" "}
                to see Claude's response
              </>,
              <>
                Editing the prompt, or changing{" "}
                <Settings2 className="inline h-3 w-3" /> model parameters creates a
                new version
              </>,
              <>
                Write variables like this:{" "}
                <code className="font-[var(--console-mono)] text-[12px] text-blue-600">
                  {"{{VARIABLE_NAME}}"}
                </code>
              </>,
              <>
                Add messages using{" "}
                <MessagesSquare className="inline h-3 w-3" /> to simulate a
                conversation
              </>,
              <>
                High quality examples greatly improve performance. After drafting a
                prompt, click{" "}
                <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                  EXAMPLES
                </span>{" "}
                to add some
              </>,
            ].map((c, i) => (
              <li key={i} className="flex gap-2.5">
                <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="leading-relaxed">{c}</div>
              </li>
            ))}
          </ul>

          <button className="mt-6 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent">
            <span className="rounded bg-muted p-1">📖</span>
            Learn about prompt design
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </button>
        </aside>
      </div>
    </ConsoleShell>
  );
}
