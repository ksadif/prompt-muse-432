import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ChevronDown, Play, Download, Bot, User, Wrench, Sparkles } from "lucide-react";
import * as XLSX from "xlsx";
import type { Folder, PromptItem } from "./types";
import { initialEvalRows, testSets, type EvalRow } from "./mockData";

const ISSUE_TYPES = ["无", "略冗长", "事实错误", "格式不符", "拒答", "其他"];

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
    { role: "user", content: input || "(空)" },
    { role: "tool", content: "调用工具：知识库检索", meta: "命中 3 条相关文档" },
    { role: "tool", content: "调用工具：意图识别", meta: "意图=咨询类" },
    { role: "agent", content: `[${promptName}] 模拟输出 - ${input}` },
  ];
}

function StepCard({ s }: { s: Step }) {
  return (
    <div className="rounded-md border border-border bg-background p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
        {s.role === "user" && <><User className="h-3 w-3" /> 用户</>}
        {s.role === "agent" && <><Bot className="h-3 w-3 text-[var(--console-orange)]" /> Agent</>}
        {s.role === "tool" && <><Wrench className="h-3 w-3" /> 工具调用</>}
        {s.meta && <span className="ml-auto">{s.meta}</span>}
      </div>
      <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">{s.content}</div>
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
  const [showExtras, setShowExtras] = useState(false);
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

        <SwitchRow label="显示测试集字段" checked={showExtras} onChange={setShowExtras} />

        <ExportMenu
          getRows={() => rows}
          versions={allVersions}
          extraKeys={extraKeys}
          testSetName={testSets.find((t) => t.id === testSetId)?.name ?? "测试集"}
        />

        <button
          onClick={runAll}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-1.5 text-sm hover:opacity-90"
        >
          <Play className="h-3 w-3 fill-current" />
          运行全部
        </button>
      </div>

      {/* 主体：左侧测试集列表 + 右侧对比环境 */}
      <div className="flex-1 min-h-0 flex">
        {/* 左侧侧边栏 */}
        <aside className="w-[280px] shrink-0 border-r border-border bg-[var(--console-sidebar)]/30 flex flex-col">
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
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {rows.map((r) => {
              const active = r.id === selectedRow?.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left rounded-md border px-2.5 py-2 transition ${
                    active
                      ? "border-[var(--console-orange)] bg-background shadow-sm"
                      : "border-transparent bg-background/60 hover:border-border hover:bg-background"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="inline-flex items-center justify-center min-w-5 h-4 px-1 rounded bg-muted text-[10px] text-muted-foreground font-medium">
                      #{r.id}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {r.extras["输入时间"] ?? "—"}
                    </span>
                  </div>
                  <div className="text-xs text-foreground line-clamp-2">
                    {r.input || <span className="text-muted-foreground">（空输入）</span>}
                  </div>
                  {showExtras && (
                    <div className="mt-1.5 space-y-0.5 text-[10.5px] text-muted-foreground">
                      {extraKeys
                        .filter((k) => k !== "输入时间" && r.extras[k] && r.extras[k] !== "-")
                        .slice(0, 3)
                        .map((k) => (
                          <div key={k} className="truncate">
                            <span className="text-muted-foreground/70">{k}：</span>
                            {r.extras[k]}
                          </div>
                        ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* 右侧：对比环境 */}
        <div className="flex-1 min-w-0 overflow-auto">
          {selectedRow ? (
            <div className="p-4">
              {/* 当前样本信息 */}
              <div className="rounded-lg border border-border bg-background p-3 mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded bg-muted text-[11px] text-muted-foreground font-medium">
                    #{selectedRow.id}
                  </span>
                  <span className="text-[11px] text-muted-foreground">输入文字</span>
                  <button
                    onClick={() => runAllForRow(selectedRow.id)}
                    className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                  >
                    <Play className="h-3 w-3" /> 运行此样本
                  </button>
                </div>
                <input
                  value={selectedRow.input}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) => (x.id === selectedRow.id ? { ...x, input: e.target.value } : x)),
                    )
                  }
                  placeholder="输入测试内容..."
                  className="w-full bg-transparent text-sm outline-none border border-transparent focus:border-[var(--console-orange)] rounded px-2 py-1"
                />
                {showExtras && (
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    {extraKeys.map((k) => (
                      <div key={k} className="flex gap-1.5 truncate">
                        <span className="text-muted-foreground/70 shrink-0">{k}：</span>
                        <span className="truncate text-foreground/80">{selectedRow.extras[k] ?? "-"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 对比环境列 */}
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${allVersions.length + (comparePrompts.length < 2 ? 1 : 0)}, minmax(280px, 1fr))`,
                }}
              >
                {allVersions.map((p, vi) => {
                  const key = `${selectedRow.id}-${vi}`;
                  const steps = trajectories[key];
                  const v = selectedRow.versions[vi];
                  return (
                    <div key={p.id + vi} className="rounded-lg border border-border bg-background flex flex-col">
                      {/* 环境标题 */}
                      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
                        <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          v{vi + 1}
                        </span>
                        <span className="text-xs font-medium truncate flex-1">{p.name}</span>
                        <button
                          onClick={() => runRow(selectedRow.id, vi)}
                          className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent"
                          title="运行"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                      </div>

                      {/* 大模型评估（位于结果上方） */}
                      <div className="px-3 py-2 border-b border-border bg-[var(--console-sidebar)]/40 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                          <Sparkles className="h-3 w-3 text-[var(--console-orange)]" />
                          大模型评估
                        </div>
                        <div className="flex items-center gap-1.5">
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
                            placeholder="分"
                            className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none"
                          />
                          <select
                            value={v?.issueType ?? "无"}
                            onChange={(e) =>
                              updateVersion(selectedRow.id, vi, { issueType: e.target.value })
                            }
                            className="rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none"
                          >
                            {ISSUE_TYPES.map((it) => (
                              <option key={it}>{it}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          value={v?.note ?? ""}
                          onChange={(e) => updateVersion(selectedRow.id, vi, { note: e.target.value })}
                          placeholder="备注"
                          className="w-full rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none"
                        />
                      </div>

                      {/* 历史轨迹 + 最终结果 */}
                      <div className="p-2.5 space-y-2 flex-1">
                        {steps ? (
                          <>
                            <div className="text-[10.5px] text-muted-foreground px-0.5">历史轨迹</div>
                            {steps.slice(0, -1).map((s, i) => (
                              <StepCard key={i} s={s} />
                            ))}
                            <div className="text-[10.5px] text-muted-foreground px-0.5 pt-1">最终结果</div>
                            <div className="rounded-md border border-[var(--console-orange)]/40 bg-[var(--console-orange)]/5 p-2.5">
                              <div className="flex items-center gap-1.5 text-[11px] text-[var(--console-orange)] mb-1">
                                <Bot className="h-3 w-3" /> Agent
                              </div>
                              <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                                {steps[steps.length - 1].content}
                              </div>
                            </div>
                          </>
                        ) : v?.output ? (
                          <div className="rounded-md border border-[var(--console-orange)]/40 bg-[var(--console-orange)]/5 p-2.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--console-orange)] mb-1">
                              <Bot className="h-3 w-3" /> Agent
                            </div>
                            <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                              {v.output}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-10">
                            <button
                              onClick={() => runRow(selectedRow.id, vi)}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-accent"
                            >
                              <Play className="h-3 w-3" /> 运行
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 增加对比 */}
                {comparePrompts.length < 2 && (
                  <button
                    onClick={addCompare}
                    className="rounded-lg border border-dashed border-border bg-background/40 hover:bg-background hover:border-[var(--console-orange)]/50 hover:text-[var(--console-orange)] text-muted-foreground transition flex flex-col items-center justify-center gap-1.5 py-10 text-xs"
                  >
                    <Plus className="h-4 w-4" />
                    增加 Prompt 对比
                    <span className="text-[10px] text-muted-foreground">
                      最多 3 个环境
                    </span>
                  </button>
                )}
              </div>
            </div>
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
