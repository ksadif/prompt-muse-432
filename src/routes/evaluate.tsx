import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { Plus, Upload, FileSpreadsheet, Trash2, PencilLine, FileUp, Search } from "lucide-react";
import { testSets as initialTestSets } from "@/components/console/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/evaluate")({
  head: () => ({ meta: [{ title: "测试集管理 · Claude Console" }] }),
  component: TestSetPage,
});

const EXTRA_FIELDS = ["输入图片", "输入笔记", "地理位置", "短期记忆", "长期记忆"] as const;

type Row = { query: string; extras: Record<string, string> };

const MOCK_DETAIL_FIELDS = ["输入图片", "输入笔记", "地理位置", "用户UID", "短期记忆"] as const;

function genDetailRows(setId: string, name: string) {
  const count = (() => {
    const m = name.match(/(\d+)\s*条/);
    return m ? Math.min(parseInt(m[1], 10), 12) : 6;
  })();
  const queries = [
    "你是谁",
    "附近有什么好吃的",
    "明天会下雨吗",
    "帮我写一段道歉信",
    "邻居家漏水墙面发霉怎么办",
    "推荐一下亲子周末活动",
    "如何申请垃圾分类志愿者",
    "小区电梯故障找谁报修",
    "怎么办理居住证",
    "最近有什么社区活动",
    "我家猫咪走丢了",
    "夜里楼上太吵怎么办",
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `${setId}-r${i + 1}`,
    no: i + 1,
    query: queries[i % queries.length],
    extras: {
      输入图片: i % 3 === 0 ? `img_${setId}_${i}.jpg` : "-",
      输入笔记: i % 4 === 0 ? "邻居纠纷相关笔记" : "-",
      地理位置: ["上海·徐汇", "北京·朝阳", "杭州·西湖", "深圳·南山"][i % 4],
      用户UID: `U${100000 + i * 7}`,
      短期记忆: i % 5 === 0 ? "上一轮：垃圾分类时间咨询" : "-",
    } as Record<string, string>,
  }));
}

type ExtraSample = { id: string; no: number; query: string; extras: Record<string, string> };

function TestSetPage() {
  const [sets, setSets] = useState(initialTestSets);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialTestSets[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [extraRows, setExtraRows] = useState<Record<string, ExtraSample[]>>({});
  const [addOpen, setAddOpen] = useState(false);

  const selected = sets.find((s) => s.id === selectedId) ?? null;
  const baseRows = useMemo(
    () => (selected ? genDetailRows(selected.id, selected.name) : []),
    [selected],
  );
  const detailRows = useMemo(() => {
    if (!selected) return [];
    const added = extraRows[selected.id] ?? [];
    return [...baseRows, ...added];
  }, [selected, baseRows, extraRows]);
  const filteredRows = detailRows.filter((r) =>
    search.trim() ? r.query.toLowerCase().includes(search.trim().toLowerCase()) : true,
  );

  return (
    <ConsoleShell>
      <div className="flex h-full min-h-0">
        {/* 左：测试集列表 */}
        <aside className="w-64 shrink-0 border-r border-border flex flex-col min-h-0">
          <div className="px-3 pt-3 pb-2 border-b border-border flex items-center justify-between">
            <h1 className="text-xs font-medium text-muted-foreground">测试集</h1>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted"
              title="新建测试集"
            >
              <Plus className="h-3 w-3" /> 新建
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5">
            {sets.map((t) => {
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left rounded px-2 py-1.5 mb-0.5 transition flex items-center gap-2 ${
                    active ? "bg-muted text-foreground" : "hover:bg-muted/60 text-foreground/80"
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate">{t.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* 右：详细内容 */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {selected ? (
            <>
              <div className="px-5 pt-3 pb-2 border-b border-border flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-baseline gap-2">
                  <div className="text-sm font-medium truncate">{selected.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {detailRows.length} 条
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="搜索 Query"
                      className="pl-6 pr-2 py-1 text-xs rounded border border-border bg-background outline-none focus:border-[var(--console-orange)] w-44"
                    />
                  </div>
                  <button
                    onClick={() => setAddOpen(true)}
                    className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" /> 新增样本
                  </button>
                  <Link
                    to="/"
                    className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                  >
                    在 Prompt 工作台中使用 →
                  </Link>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto px-5 py-3">
                <div className="rounded border border-border overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 text-muted-foreground sticky top-0">
                      <tr>
                        <th className="w-10 px-3 py-1.5 text-left font-normal">#</th>
                        <th className="px-3 py-1.5 text-left font-normal min-w-[200px]">输入 Query</th>
                        {MOCK_DETAIL_FIELDS.map((f) => (
                          <th key={f} className="px-3 py-1.5 text-left font-normal whitespace-nowrap">
                            {f}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((r) => (
                        <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-3 py-1.5 text-muted-foreground">{r.no}</td>
                          <td className="px-3 py-1.5">{r.query}</td>
                          {MOCK_DETAIL_FIELDS.map((f) => (
                            <td key={f} className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">
                              {r.extras[f]}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {filteredRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={2 + MOCK_DETAIL_FIELDS.length}
                            className="px-3 py-8 text-center text-muted-foreground"
                          >
                            没有匹配的样本
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1" />
          )}
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

      <AddSampleDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(query, extras) => {
          if (!selected) return;
          setExtraRows((m) => {
            const list = m[selected.id] ?? [];
            const next: ExtraSample = {
              id: `${selected.id}-x${list.length + 1}-${Date.now()}`,
              no: baseRows.length + list.length + 1,
              query,
              extras,
            };
            return { ...m, [selected.id]: [...list, next] };
          });
          setAddOpen(false);
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

function AddSampleDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (query: string, extras: Record<string, string>) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeExtras, setActiveExtras] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  const reset = () => {
    setQuery("");
    setActiveExtras([]);
    setValues({});
  };
  const close = () => {
    onClose();
    setTimeout(reset, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新增测试样本</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">输入 Query *</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="用户输入的问题"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)]"
            />
          </div>
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
          {activeExtras.length > 0 && (
            <div className="space-y-2">
              {activeExtras.map((f) => (
                <div key={f}>
                  <label className="text-xs text-muted-foreground">{f}</label>
                  <input
                    value={values[f] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f]: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-[var(--console-orange)]"
                  />
                </div>
              ))}
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
              disabled={!query.trim()}
              onClick={() => {
                const extras: Record<string, string> = {};
                activeExtras.forEach((f) => {
                  extras[f] = values[f]?.trim() || "-";
                });
                onAdd(query.trim(), extras);
                reset();
              }}
              className="px-4 py-1.5 text-sm rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:opacity-90 disabled:opacity-40"
            >
              添加
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
