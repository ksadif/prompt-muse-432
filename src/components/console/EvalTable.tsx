import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ChevronDown, Play, Download, Bot, Wrench, Sparkles, ImageIcon, StickyNote, X } from "lucide-react";
import * as XLSX from "xlsx";
import type { Folder, PromptItem } from "./types";
import { initialEvalRows, testSets, type EvalRow } from "./mockData";

const ISSUE_CATEGORIES: Record<string, string[]> = {
  "无": [],
  "内容质量": ["事实错误", "逻辑混乱", "信息不足", "过度冗长"],
  "格式问题": ["格式不符", "结构混乱", "Markdown 错误"],
  "行为偏差": ["拒答", "答非所问", "幻觉"],
  "工具使用": ["调用失败", "参数错误", "未使用工具"],
  "其他": ["其他"],
};
const ISSUE_TYPES = Object.keys(ISSUE_CATEGORIES);

type Step = { role: "user" | "agent" | "tool"; content: string; meta?: string };

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-muted/50 pl-3 pr-1 py-1 cursor-pointer select-none">
      <span className="text-xs text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-4 w-7 rounded-full transition border ${
          checked
            ? "bg-[var(--console-orange)]/40 border-[var(--console-orange)]/50"
            : "bg-background border-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${
            checked ? "left-[14px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function buildExportRows(rows: EvalRow[], versions: PromptItem[], extraKeys: string[]) {
  return rows.map((r) => {
    const obj: Record<string, unknown> = { 编号: r.id, 输入文字: r.input };
    for (const k of extraKeys) obj[k] = r.extras[k] ?? "";
    versions.forEach((p, vi) => {
      const v = r.versions[vi];
      const tag = `v${vi + 1}_${p.name}`;
      obj[`${tag}_输出`] = v?.output ?? "";
      obj[`${tag}_分数`] = v?.score ?? "";
      obj[`${tag}_问题类型`] = v?.issueType ?? "";
      obj[`${tag}_备注`] = v?.note ?? "";
    });
    return obj;
  });
}

function ExportMenu({
  getRows,
  versions,
  extraKeys,
  testSetName,
}: {
  getRows: () => EvalRow[];
  versions: PromptItem[];
  extraKeys: string[];
  testSetName: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function stamp() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  }

  function exportJSON() {
    const payload = {
      exportedAt: new Date().toISOString(),
      testSet: testSetName,
      versions: versions.map((p, vi) => ({ index: vi + 1, id: p.id, name: p.name })),
      rows: getRows().map((r) => ({
        id: r.id,
        input: r.input,
        extras: r.extras,
        versions: r.versions,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `评估结果_${testSetName}_${stamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function exportExcel() {
    const data = buildExportRows(getRows(), versions, extraKeys);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "评估结果");
    XLSX.writeFile(wb, `评估结果_${testSetName}_${stamp()}.xlsx`);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:bg-accent"
      >
        <Download className="h-3 w-3" />
        导出
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-md border border-border bg-background shadow-lg p-1">
          <button onClick={exportJSON} className="w-full text-left rounded px-2 py-1.5 text-xs hover:bg-accent">
            导出为 JSON
          </button>
          <button onClick={exportExcel} className="w-full text-left rounded px-2 py-1.5 text-xs hover:bg-accent">
            导出为 Excel
          </button>
        </div>
      )}
    </div>
  );
}

function buildSteps(input: string, promptName: string): Step[] {
  return [
    { role: "tool", content: "调用工具：知识库检索", meta: "命中 3 条相关文档" },
    { role: "tool", content: "调用工具：意图识别", meta: "意图=咨询类" },
    { role: "agent", content: `[${promptName}] 模拟输出 - ${input}` },
  ];
}

function StepCard({ s }: { s: Step }) {
  // tool call — neutral inline note
  if (s.role === "tool") {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10.5px] text-muted-foreground">
          <Wrench className="h-3 w-3" />
          <span>{s.content}</span>
          {s.meta && <span className="text-muted-foreground/70">· {s.meta}</span>}
        </div>
      </div>
    );
  }
  // agent — left bubble
  return (
    <div className="flex gap-2">
      <div className="shrink-0 h-6 w-6 rounded-full bg-[var(--console-orange)]/15 flex items-center justify-center">
        <Bot className="h-3.5 w-3.5 text-[var(--console-orange)]" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words">
        {s.content}
      </div>
    </div>
  );
}

function UserBubble({
  icon: Icon,
  children,
  onRemove,
}: {
  icon?: typeof ImageIcon;
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <div className="flex justify-end group/bubble">
      {onRemove && (
        <button
          onClick={onRemove}
          className="self-center mr-1 opacity-0 group-hover/bubble:opacity-100 text-muted-foreground hover:text-destructive transition"
          title="移除"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-2 text-xs leading-relaxed shadow-sm flex items-start gap-1.5">
        {Icon && <Icon className="h-3 w-3 mt-0.5 shrink-0 opacity-80" />}
        <div className="min-w-0 flex-1 break-words whitespace-pre-wrap">{children}</div>
      </div>
    </div>
  );
}

function ChatInputBubbles({
  row,
  onChange,
}: {
  row: EvalRow;
  onChange: (patch: Partial<EvalRow>) => void;
}) {
  const image = row.extras["输入图片"] && row.extras["输入图片"] !== "-" ? row.extras["输入图片"] : "";
  const note = row.extras["输入笔记"] && row.extras["输入笔记"] !== "-" ? row.extras["输入笔记"] : "";
  const [editing, setEditing] = useState<null | "text" | "image" | "note">(null);
  const [draft, setDraft] = useState("");

  const setExtra = (k: string, v: string) =>
    onChange({ extras: { ...row.extras, [k]: v || "-" } });

  const startEdit = (kind: "text" | "image" | "note", current: string) => {
    setEditing(kind);
    setDraft(current);
  };
  const commit = () => {
    if (editing === "text") onChange({ input: draft });
    else if (editing === "image") setExtra("输入图片", draft);
    else if (editing === "note") setExtra("输入笔记", draft);
    setEditing(null);
  };

  const editorCls =
    "w-full rounded-2xl rounded-tr-sm bg-background border border-[var(--console-orange)] px-3 py-2 text-xs outline-none";

  return (
    <div className="space-y-2">
      {/* 文本 */}
      {editing === "text" ? (
        <div className="flex justify-end">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(null); }}
            className={`${editorCls} max-w-[85%]`}
            placeholder="输入文本…"
          />
        </div>
      ) : (
        <div onClick={() => startEdit("text", row.input)} className="cursor-text">
          <UserBubble>
            {row.input || <span className="opacity-60">点击输入文本…</span>}
          </UserBubble>
        </div>
      )}

      {/* 图片 */}
      {editing === "image" ? (
        <div className="flex justify-end">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(null); }}
            className={`${editorCls} max-w-[85%]`}
            placeholder="图片 URL 或文件名"
          />
        </div>
      ) : image ? (
        <div onClick={() => startEdit("image", image)} className="cursor-text">
          <UserBubble icon={ImageIcon} onRemove={() => setExtra("输入图片", "")}>
            {image}
          </UserBubble>
        </div>
      ) : null}

      {/* 笔记 */}
      {editing === "note" ? (
        <div className="flex justify-end">
          <textarea
            autoFocus
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Escape") setEditing(null); }}
            className={`${editorCls} max-w-[85%] resize-none`}
            placeholder="笔记内容…"
          />
        </div>
      ) : note ? (
        <div onClick={() => startEdit("note", note)} className="cursor-text">
          <UserBubble icon={StickyNote} onRemove={() => setExtra("输入笔记", "")}>
            {note}
          </UserBubble>
        </div>
      ) : null}

    </div>
  );
}

export function EvalTable({
  folders: _folders,
  currentPrompt,
  onPickComparePrompt,
}: {
  folders: Folder[];
  currentPrompt: PromptItem;
  onPickComparePrompt: (cb: (p: PromptItem) => void) => void;
}) {
  const [testSetId, setTestSetId] = useState(testSets[0].id);
  const [rows, setRows] = useState<EvalRow[]>(initialEvalRows);
  const [comparePrompts, setComparePrompts] = useState<PromptItem[]>([]);
  const [selectedId, setSelectedId] = useState<number>(initialEvalRows[0]?.id ?? 0);
  const [trajectories, setTrajectories] = useState<Record<string, Step[]>>({});

  const allVersions = useMemo(
    () => [currentPrompt, ...comparePrompts],
    [currentPrompt, comparePrompts],
  );

  const extraKeys = useMemo(
    () => ["输入图片", "输入笔记", "输入时间", "地理位置", "用户UID", "设备平台信息", "短期记忆", "长期记忆"],
    [],
  );

  const selectedRow = rows.find((r) => r.id === selectedId) ?? rows[0];

  function updateVersion(rowId: number, vIndex: number, patch: Partial<EvalRow["versions"][number]>) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== rowId) return r;
        const versions = [...r.versions];
        while (versions.length <= vIndex) {
          versions.push({
            promptId: allVersions[versions.length]?.id ?? "",
            output: "",
            score: null,
            issueType: "无",
            note: "",
          });
        }
        versions[vIndex] = { ...versions[vIndex], ...patch };
        return { ...r, versions };
      }),
    );
  }

  function runRow(rowId: number, vIndex: number) {
    const r = rows.find((x) => x.id === rowId);
    if (!r) return;
    const steps = buildSteps(r.input, allVersions[vIndex].name);
    setTrajectories((t) => ({ ...t, [`${rowId}-${vIndex}`]: steps }));
    updateVersion(rowId, vIndex, {
      output: steps[steps.length - 1].content,
      score: Math.floor(Math.random() * 5) + 1,
    });
  }

  function runAllForRow(rowId: number) {
    allVersions.forEach((_, vi) => runRow(rowId, vi));
  }

  function runAll() {
    rows.forEach((r) => allVersions.forEach((_, vi) => runRow(r.id, vi)));
  }

  useEffect(() => {
    const onRun = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tab?: string } | undefined;
      if (!detail || detail.tab === "test") runAll();
    };
    window.addEventListener("console:run", onRun);
    return () => window.removeEventListener("console:run", onRun);
  });

  function addCompare() {
    if (comparePrompts.length >= 2) return;
    onPickComparePrompt((p) => setComparePrompts((cs) => [...cs, p]));
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* 顶部控制条 */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-border">
        <div className="inline-flex items-center gap-2">
          <span className="text-xs text-muted-foreground">关联测试集</span>
          <select
            value={testSetId}
            onChange={(e) => setTestSetId(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-[var(--console-orange)] cursor-pointer"
          >
            {testSets.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={addCompare}
          disabled={comparePrompts.length >= 2}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-3 w-3" />
          增加 Agent 对比
          <span className="text-[10px] text-muted-foreground">（{allVersions.length}/3）</span>
        </button>

        <ExportMenu
          getRows={() => rows}
          versions={allVersions}
          extraKeys={extraKeys}
          testSetName={testSets.find((t) => t.id === testSetId)?.name ?? "测试集"}
        />

        <div className="ml-auto inline-flex items-center gap-1.5">
          <button
            onClick={() => runAllForRow(selectedId)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-1.5 text-sm hover:opacity-90"
          >
            <Play className="h-3 w-3 fill-current" />
            运行此样本
          </button>
          <button
            onClick={runAll}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-accent"
          >
            运行全部
          </button>
        </div>
      </div>

      {/* 主体：左侧测试集列表 + 右侧对比环境 */}
      <div className="flex-1 min-h-0 flex">
        {/* 左侧侧边栏 */}
        <aside className="w-[260px] shrink-0 border-r border-border bg-[var(--console-sidebar)]/30 flex flex-col">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              测试样本（{rows.length}）
            </span>
            <button
              onClick={() => {
                const nextId = (rows.reduce((m, r) => Math.max(m, r.id), 0) || 0) + 1;
                setRows((rs) => [...rs, { id: nextId, input: "", extras: {}, versions: [] }]);
                setSelectedId(nextId);
              }}
              className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3 w-3" /> 新增
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {rows.map((r) => {
              const active = r.id === selectedRow?.id;
              const hasImage = r.extras["输入图片"] && r.extras["输入图片"] !== "-";
              const hasNote = r.extras["输入笔记"] && r.extras["输入笔记"] !== "-";
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`group w-full text-left rounded-md border px-2.5 py-1.5 transition cursor-pointer flex items-center gap-2 ${
                    active
                      ? "border-[var(--console-orange)] bg-background shadow-sm"
                      : "border-transparent bg-background/60 hover:border-border hover:bg-background"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-foreground line-clamp-2">
                      {r.input || <span className="text-muted-foreground">（空输入）</span>}
                    </div>
                    {(hasImage || hasNote) && (
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                        {hasImage && <span className="inline-flex items-center gap-0.5"><ImageIcon className="h-2.5 w-2.5" />图</span>}
                        {hasNote && <span className="inline-flex items-center gap-0.5"><StickyNote className="h-2.5 w-2.5" />笔记</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* 右侧：对比环境 */}
        <div className="flex-1 min-w-0 flex flex-col">
          {selectedRow ? (
            <>
              {/* 对比列：每列内部滑动，评估固定底部 */}
              <div className="flex-1 min-h-0 px-3 pb-3 pt-3">
                <div
                  className="h-full grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${allVersions.length}, minmax(320px, 1fr))` }}
                >
                  {allVersions.map((p, vi) => {
                    const key = `${selectedRow.id}-${vi}`;
                    const steps = trajectories[key];
                    const v = selectedRow.versions[vi];
                    const subTypes = ISSUE_CATEGORIES[v?.issueType ?? "无"] ?? [];
                    return (
                      <div
                        key={p.id + vi}
                        className="h-full min-h-0 flex flex-col rounded-lg border border-border bg-background/40 overflow-hidden"
                      >
                        {/* 列标题 */}
                        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border bg-muted/30">
                          <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            v{vi + 1}
                          </span>
                          <span className="text-xs font-medium truncate flex-1">{p.name}</span>
                          {vi > 0 && (
                            <button
                              onClick={() => {
                                setComparePrompts((cs) => cs.filter((_, i) => i !== vi - 1));
                                setRows((rs) =>
                                  rs.map((r) => ({
                                    ...r,
                                    versions: r.versions.filter((_, i) => i !== vi),
                                  })),
                                );
                                setTrajectories((t) => {
                                  const next: typeof t = {};
                                  for (const k of Object.keys(t)) {
                                    const [rid, idx] = k.split("-").map(Number);
                                    if (idx === vi) continue;
                                    const newIdx = idx > vi ? idx - 1 : idx;
                                    next[`${rid}-${newIdx}`] = t[k];
                                  }
                                  return next;
                                });
                              }}
                              className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-accent"
                              title="移除此对比"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {/* 对话区（可滑动）：用户输入 → 工具/Agent 轨迹 → 最终结果 */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
                          <ChatInputBubbles
                            row={selectedRow}
                            onChange={(patch) =>
                              setRows((rs) => rs.map((x) => (x.id === selectedRow.id ? { ...x, ...patch } : x)))
                            }
                          />
                          {steps ? (
                            <>
                              {steps.slice(0, -1).map((s, i) => (
                                <StepCard key={i} s={s} />
                              ))}
                              <div className="flex gap-2">
                                <div className="shrink-0 h-6 w-6 rounded-full bg-[var(--console-orange)]/15 flex items-center justify-center">
                                  <Bot className="h-3.5 w-3.5 text-[var(--console-orange)]" />
                                </div>
                                <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-[var(--console-orange)]/40 bg-[var(--console-orange)]/5 px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words">
                                  {steps[steps.length - 1].content}
                                </div>
                              </div>
                            </>
                          ) : v?.output ? (
                            <div className="flex gap-2">
                              <div className="shrink-0 h-6 w-6 rounded-full bg-[var(--console-orange)]/15 flex items-center justify-center">
                                <Bot className="h-3.5 w-3.5 text-[var(--console-orange)]" />
                              </div>
                              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-[var(--console-orange)]/40 bg-[var(--console-orange)]/5 px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words">
                                {v.output}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-6 border border-dashed border-border rounded-md">
                              <button
                                onClick={() => runRow(selectedRow.id, vi)}
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                <Play className="h-3 w-3" /> 运行
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 大模型评估 — 固定底部 */}
                        <div className="shrink-0 border-t border-border bg-[var(--console-orange)]/[0.04] p-2.5 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-[var(--console-orange)]" />
                            <span className="text-[11px] font-medium text-foreground">大模型评估</span>
                            <div className="ml-auto flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">分数</span>
                              <input
                                type="number"
                                min={1}
                                max={5}
                                value={v?.score ?? ""}
                                onChange={(e) =>
                                  updateVersion(selectedRow.id, vi, {
                                    score: e.target.value ? +e.target.value : null,
                                  })
                                }
                                placeholder="—"
                                className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none focus:border-[var(--console-orange)] text-center"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={v?.issueType ?? "无"}
                              onChange={(e) =>
                                updateVersion(selectedRow.id, vi, {
                                  issueType: e.target.value,
                                  issueSubType: "",
                                })
                              }
                              className="flex-1 min-w-0 rounded border border-border bg-background px-1.5 py-1 text-xs outline-none cursor-pointer"
                            >
                              {ISSUE_TYPES.map((it) => (
                                <option key={it}>{it}</option>
                              ))}
                            </select>
                            <select
                              value={v?.issueSubType ?? ""}
                              onChange={(e) =>
                                updateVersion(selectedRow.id, vi, { issueSubType: e.target.value })
                              }
                              disabled={subTypes.length === 0}
                              className="flex-1 min-w-0 rounded border border-border bg-background px-1.5 py-1 text-xs outline-none cursor-pointer disabled:opacity-40"
                            >
                              <option value="">{subTypes.length ? "细分类型…" : "—"}</option>
                              {subTypes.map((it) => (
                                <option key={it}>{it}</option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            value={v?.note ?? ""}
                            onChange={(e) => updateVersion(selectedRow.id, vi, { note: e.target.value })}
                            placeholder="备注：写下评估说明、改进建议……"
                            rows={1}
                            className="w-full resize-y rounded border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-[var(--console-orange)] leading-relaxed"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              请在左侧选择一个测试样本
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
