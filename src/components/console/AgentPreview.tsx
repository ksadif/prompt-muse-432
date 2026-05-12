import { useState } from "react";
import { Image as ImageIcon, FileText, FileSpreadsheet, Play, Bot, User } from "lucide-react";

type Step = { role: "user" | "agent" | "tool"; content: string; meta?: string };

export function AgentPreview() {
  const [query, setQuery] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);

  function run() {
    if (!query.trim()) return;
    setSteps([
      { role: "user", content: query },
      { role: "tool", content: "调用工具：知识库检索", meta: "命中 3 条相关文档" },
      { role: "agent", content: "我是点点，你的社区助手。可以告诉我具体的问题吗？" },
    ]);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <div className="text-sm font-semibold mb-2">Agent 效果预览</div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入查询内容（支持 {{变量}}）"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] resize-none min-h-[72px]"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <button className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent" title="上传图片">
              <ImageIcon className="h-3.5 w-3.5" />
            </button>
            <button className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent" title="附加笔记">
              <FileText className="h-3.5 w-3.5" />
            </button>
            <button className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-accent" title="上传 Excel（带记忆测试）">
              <FileSpreadsheet className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            onClick={run}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--console-orange)] text-white px-3 py-1.5 text-xs hover:opacity-90"
          >
            <Play className="h-3 w-3 fill-current" />
            运行测试
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {steps.length === 0 ? (
          <div className="text-xs text-muted-foreground py-10 text-center">
            点击"运行测试"，将在此展示 Agent 历史轨迹
          </div>
        ) : (
          steps.map((s, i) => (
            <div key={i} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                {s.role === "user" && <><User className="h-3 w-3" /> 用户</>}
                {s.role === "agent" && <><Bot className="h-3 w-3 text-[var(--console-orange)]" /> Agent</>}
                {s.role === "tool" && <>🔧 工具调用</>}
                {s.meta && <span className="ml-auto">{s.meta}</span>}
              </div>
              <div className="text-sm leading-relaxed">{s.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
