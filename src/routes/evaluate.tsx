import { createFileRoute, Link } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { Plus, Upload, FileSpreadsheet } from "lucide-react";
import { testSets } from "@/components/console/mockData";

export const Route = createFileRoute("/evaluate")({
  head: () => ({ meta: [{ title: "测试集管理 · Claude Console" }] }),
  component: TestSetPage,
});

function TestSetPage() {
  return (
    <ConsoleShell>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight">测试集管理</h1>
            <p className="text-xs text-muted-foreground mt-1">
              管理用于效果测试与评估的输入样本集合，可在 Prompt 工作台「效果测试」中关联。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent">
              <Upload className="h-3.5 w-3.5" /> 导入 CSV
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-[var(--console-orange)] text-white px-3 py-1.5 text-sm hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> 新建测试集
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testSets.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-border bg-background p-4 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <FileSpreadsheet className="h-5 w-5 text-[var(--console-orange)]" />
                <span className="text-[11px] text-muted-foreground">已启用</span>
              </div>
              <div className="mt-3 text-sm font-medium">{t.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                创建于 2026-05-01 · 所有者 yz
              </div>
              <Link
                to="/"
                className="inline-flex mt-3 text-xs text-[var(--console-orange)] hover:underline"
              >
                在 Prompt 工作台中使用 →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </ConsoleShell>
  );
}
