import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { Plus, Upload, FileSpreadsheet, Trash2, PencilLine, FileUp } from "lucide-react";
import { testSets as initialTestSets } from "@/components/console/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/evaluate")({
  head: () => ({ meta: [{ title: "测试集管理 · Claude Console" }] }),
  component: TestSetPage,
});

const EXTRA_FIELDS = ["输入图片", "输入笔记", "地理位置", "短期记忆", "长期记忆"] as const;

type Row = { query: string; extras: Record<string, string> };

function TestSetPage() {
  const [sets, setSets] = useState(initialTestSets);
  const [open, setOpen] = useState(false);

  return (
    <ConsoleShell>
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight">测试集管理</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              管理用于效果测试与评估的输入样本集合，可在 Prompt 工作台「效果测试」中关联。
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOpen(true)}
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
        open={open}
        onClose={() => setOpen(false)}
        onCreate={(name, count) => {
          setSets((s) => [
            ...s,
            { id: `ts-${Date.now()}`, name: `${name}（${count} 条）` },
          ]);
          setOpen(false);
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
  onCreate: (name: string, count: number) => void;
}) {
  const [mode, setMode] = useState<"manual" | "upload">("manual");
  const [name, setName] = useState("");
  const [scope, setScope] = useState("社区助手");
  const [rows, setRows] = useState<Row[]>([{ query: "", extras: {} }]);
  const [activeExtras, setActiveExtras] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const reset = () => {
    setMode("manual");
    setName("");
    setRows([{ query: "", extras: {} }]);
    setActiveExtras([]);
    setFile(null);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const validRows = rows.filter((r) => r.query.trim());
  const canCreate = name.trim() && (mode === "manual" ? validRows.length > 0 : !!file);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>新建测试集</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* 录入方式 Tab */}
          <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
            <button
              onClick={() => setMode("manual")}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 ${mode === "manual" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <PencilLine className="h-3.5 w-3.5" /> 手动录入
            </button>
            <button
              onClick={() => setMode("upload")}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 ${mode === "upload" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <FileUp className="h-3.5 w-3.5" /> 上传文件
            </button>
          </div>

          {mode === "manual" ? (
            <div className="space-y-3">
              {/* 启用字段 */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1.5">附加字段（可选）</div>
                <div className="flex flex-wrap gap-1.5">
                  {EXTRA_FIELDS.map((f) => {
                    const on = activeExtras.includes(f);
                    return (
                      <button
                        key={f}
                        onClick={() =>
                          setActiveExtras((a) => (on ? a.filter((x) => x !== f) : [...a, f]))
                        }
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                          on
                            ? "border-[var(--console-orange)] bg-[var(--console-orange)]/10 text-[var(--console-orange)]"
                            : "border-border bg-background text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 行编辑 */}
              <div className="rounded-md border border-border max-h-[320px] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/60 text-muted-foreground">
                    <tr>
                      <th className="w-8 px-2 py-2 text-left font-medium">#</th>
                      <th className="px-2 py-2 text-left font-medium">输入 Query *</th>
                      {activeExtras.map((f) => (
                        <th key={f} className="px-2 py-2 text-left font-medium">{f}</th>
                      ))}
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-1 py-1">
                          <input
                            value={r.query}
                            onChange={(e) => {
                              const v = e.target.value;
                              setRows((rs) => rs.map((x, j) => (j === i ? { ...x, query: v } : x)));
                            }}
                            placeholder="用户输入的问题"
                            className="w-full rounded border border-transparent bg-transparent px-2 py-1 outline-none focus:border-border focus:bg-background"
                          />
                        </td>
                        {activeExtras.map((f) => (
                          <td key={f} className="px-1 py-1">
                            <input
                              value={r.extras[f] ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRows((rs) =>
                                  rs.map((x, j) =>
                                    j === i ? { ...x, extras: { ...x.extras, [f]: v } } : x,
                                  ),
                                );
                              }}
                              className="w-full rounded border border-transparent bg-transparent px-2 py-1 outline-none focus:border-border focus:bg-background"
                            />
                          </td>
                        ))}
                        <td className="px-1">
                          <button
                            onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                            disabled={rows.length === 1}
                            className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => setRows((rs) => [...rs, { query: "", extras: {} }])}
                className="inline-flex items-center gap-1 text-xs text-[var(--console-orange)] hover:underline"
              >
                <Plus className="h-3 w-3" /> 添加一行
              </button>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Excel / CSV 文件</label>
              <label className="mt-1 flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-3 py-8 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50">
                <Upload className="h-4 w-4 mb-1.5" />
                {file ? file.name : "点击选择或拖拽 .xlsx / .csv 文件"}
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                首行为字段名，必须包含「输入 Query」列；其他列将作为附加字段（如「输入图片」「地理位置」等）。
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={close}
              className="px-4 py-1.5 text-sm rounded-md border border-border hover:bg-accent"
            >
              取消
            </button>
            <button
              disabled={!canCreate}
              onClick={() => {
                const count =
                  mode === "manual" ? validRows.length : Math.floor(Math.random() * 50) + 10;
                onCreate(name.trim(), count);
                reset();
              }}
              className="px-4 py-1.5 text-sm rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:opacity-90 disabled:opacity-40"
            >
              创建{mode === "manual" && validRows.length > 0 ? `（${validRows.length} 条）` : ""}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
