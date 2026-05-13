import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { Plus, Upload, FileSpreadsheet } from "lucide-react";
import { testSets as initialTestSets } from "@/components/console/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/evaluate")({
  head: () => ({ meta: [{ title: "测试集管理 · Claude Console" }] }),
  component: TestSetPage,
});

function TestSetPage() {
  const [sets, setSets] = useState(initialTestSets);
  const [newOpen, setNewOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <ConsoleShell>
      <div className="px-6 py-5">
        {/* 顶部信息条 */}
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight">测试集管理</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              管理用于效果测试与评估的输入样本集合，可在 Prompt 工作台「效果测试」中关联。
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent"
            >
              <Upload className="h-3.5 w-3.5" /> 导入 CSV
            </button>
            <button
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-1.5 text-sm hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> 新建测试集
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sets.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-border bg-background p-4 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <FileSpreadsheet className="h-5 w-5 text-[var(--console-orange)]" />
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  已启用
                </span>
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

      <NewTestSetDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={(name) => {
          setSets((s) => [
            ...s,
            { id: `ts-${Date.now()}`, name: `${name}（0 条）`, fields: [] },
          ]);
          setNewOpen(false);
        }}
      />
      <ImportCsvDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(name, count) => {
          setSets((s) => [
            ...s,
            { id: `ts-${Date.now()}`, name: `${name}（${count} 条）`, fields: [] },
          ]);
          setImportOpen(false);
        }}
      />
    </ConsoleShell>
  );
}

function NewTestSetDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [scope, setScope] = useState("社区助手");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新建测试集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">测试集名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：社区助手-基础测试集"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">所属业务</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)]"
            >
              <option>社区助手</option>
              <option>客服机器人</option>
              <option>通用</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">描述</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="简要说明该测试集的用途与覆盖范围"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] min-h-[72px] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded-md border border-border hover:bg-accent"
            >
              取消
            </button>
            <button
              disabled={!name.trim()}
              onClick={() => onCreate(name.trim())}
              className="px-4 py-1.5 text-sm rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:opacity-90 disabled:opacity-40"
            >
              创建
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImportCsvDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (name: string, count: number) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>导入 CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">测试集名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="为导入后的测试集命名"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">CSV 文件</label>
            <label className="mt-1 flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50">
              <Upload className="h-4 w-4 mb-1.5" />
              {file ? file.name : "点击选择或拖拽 CSV 文件"}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              首行为字段名，必须包含「输入文字」列
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded-md border border-border hover:bg-accent"
            >
              取消
            </button>
            <button
              disabled={!name.trim() || !file}
              onClick={() => onImport(name.trim(), Math.floor(Math.random() * 50) + 10)}
              className="px-4 py-1.5 text-sm rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:opacity-90 disabled:opacity-40"
            >
              导入
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
