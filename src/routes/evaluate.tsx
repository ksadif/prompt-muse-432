import { createFileRoute } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { WorkbenchHeader } from "@/components/console/WorkbenchHeader";
import { ChevronDown, Play, Plus, Sparkles, Upload, Download, MoreVertical } from "lucide-react";

export const Route = createFileRoute("/evaluate")({
  head: () => ({ meta: [{ title: "Evaluate · Claude Console" }] }),
  component: EvaluatePage,
});

type Row = {
  limit: string;
  question: string;
  v7?: { text: string; score: string };
  v4?: { text: string; score: string };
};

const rows: Row[] = [
  { limit: "15", question: "你擅长什么", v7: { text: "我擅长回答社区问题、提供生活建议和解决邻里事务。", score: "2" }, v4: { text: "我擅长解答社区问题、提供建议和信息查询服务。", score: "3" } },
  { limit: "10", question: "你会做什么", v7: { text: "我能回答问题、提供建议和帮助解决问题。", score: "5" }, v4: { text: "我能回答问题、提供帮助。", score: "1" } },
  { limit: "9", question: "你是谁", v7: { text: "我是点点，社区助手。", score: "4" }, v4: { text: "我是点点，社区助手。", score: "5" } },
  { limit: "12", question: "你能帮我什么", v7: { text: "我能帮你解答问题、提供建议、聊天陪伴。", score: "-" }, v4: { text: "我能帮你解答问题、聊天、提供建议！", score: "-" } },
  { limit: "10", question: "你是谁", v7: { text: "我是点点，社区助手。", score: "-" } },
  { limit: "", question: "" },
  { limit: "11", question: "怎么使用你" },
];

function Score({ value }: { value: string }) {
  return (
    <button className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs min-w-[44px] justify-between">
      {value}
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}

function RunBtn() {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent">
      <Play className="h-3 w-3 fill-current" /> Run
    </button>
  );
}

function EvaluatePage() {
  return (
    <ConsoleShell>
      <WorkbenchHeader
        title="点点3.0-PromptV1"
        savedAt="May 11, 4:33 PM"
        rightExtra={
          <>
            <span>·</span>
            <button className="text-[var(--console-orange)] hover:underline">Save changes</button>
          </>
        }
      />

      <div className="px-6 py-5">
        <div className="rounded-lg border border-border bg-[var(--console-sidebar)] px-6 py-5 mb-5 text-center text-sm">
          <p className="text-muted-foreground">and is read-only. Create a new revision with your changes to evaluate.</p>
          <button className="mt-3 inline-flex items-center rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90">
            Save Changes as v8
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-[var(--console-sidebar)]/50">
                <th className="w-10 px-3 py-3 text-left text-xs text-muted-foreground font-normal"></th>
                <th className="px-3 py-3 text-left"></th>
                <th className="px-3 py-3 text-left"></th>
                <VersionHeader version="v7" score="3.67" />
                <VersionHeader version="v4" score="3.00" />
                <th className="w-10 px-3 py-3">
                  <button className="text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></button>
                </th>
              </tr>
              <tr className="border-b border-border">
                <th className="px-3 py-2.5"></th>
                <th className="px-3 py-2.5 text-left font-mono text-[12px] text-blue-600">{"{{CHARACTER_LIMIT}}"}</th>
                <th className="px-3 py-2.5 text-left font-mono text-[12px] text-blue-600">{"{{USER_QUESTION}}"}</th>
                <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-normal">Model output</th>
                <th className="px-3 py-2.5 text-left text-xs text-muted-foreground font-normal">Model output</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-[var(--console-sidebar)]/40">
                  <td className="px-3 py-3 text-muted-foreground text-xs align-top">{i + 1}</td>
                  <td className="px-3 py-3 align-top text-sm">{r.limit}</td>
                  <td className="px-3 py-3 align-top text-sm">{r.question}</td>
                  <td className="px-3 py-3 align-top text-sm">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-[200px]">
                        {r.v7 ? r.v7.text : <RunBtn />}
                      </div>
                      <Score value={r.v7?.score ?? "-"} />
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top text-sm">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-[200px]">
                        {r.v4 ? r.v4.text : <RunBtn />}
                      </div>
                      <Score value={r.v4?.score ?? "-"} />
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <button className="text-muted-foreground hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent">
            <Plus className="h-3.5 w-3.5" /> Add Row
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent">
            <Sparkles className="h-3.5 w-3.5 text-[var(--console-orange)]" /> Generate Test Case
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent">
            <Upload className="h-3.5 w-3.5" /> Import Test Cases
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent">
            <Download className="h-3.5 w-3.5" /> Export to CSV
          </button>
        </div>
      </div>
    </ConsoleShell>
  );
}

function VersionHeader({ version, score }: { version: string; score: string }) {
  return (
    <th className="px-3 py-2.5 text-left font-normal">
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
          点点3.0-PromptV1 <ChevronDown className="h-3 w-3" />
        </button>
        <span className="rounded-md border border-border bg-background px-2 py-1 text-xs">{version}</span>
        <span className="ml-2 text-xs text-muted-foreground">{score}</span>
        <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-[var(--console-orange)]" style={{ width: `${(parseFloat(score) / 5) * 100}%` }} />
        </div>
      </div>
    </th>
  );
}
