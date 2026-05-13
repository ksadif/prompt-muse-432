import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/console/Sidebar";
import { Save } from "lucide-react";

export const Route = createFileRoute("/prompt")({
  head: () => ({ meta: [{ title: "Prompt 工作台 · Claude Console" }] }),
  component: PromptWorkbenchPage,
});

function PromptWorkbenchPage() {
  const [name, setName] = useState("未命名 Prompt");
  const [system, setSystem] = useState("");
  const [user, setUser] = useState("");

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-12 px-5 flex items-center justify-between border-b border-border">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-base font-semibold bg-transparent outline-none border-b border-transparent focus:border-border px-1"
          />
          <button className="inline-flex items-center gap-1.5 rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-1.5 text-sm hover:opacity-90">
            <Save className="h-3.5 w-3.5" />
            保存
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 max-w-3xl w-full mx-auto">
          <div className="rounded-lg border border-border bg-background">
            <div className="px-4 py-2.5 border-b border-border text-sm font-medium">
              System Prompt
            </div>
            <textarea
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              placeholder="定义角色、语气或上下文（选填）"
              className="w-full text-sm bg-transparent outline-none resize-none min-h-[200px] placeholder:text-muted-foreground p-4"
            />
          </div>

          <div className="rounded-lg border border-border bg-background">
            <div className="px-4 py-2.5 border-b border-border text-sm font-medium">
              User Prompt
            </div>
            <textarea
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="输入用户指令，可使用 {{变量}}"
              className="w-full text-sm bg-transparent outline-none resize-none min-h-[160px] placeholder:text-muted-foreground p-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
