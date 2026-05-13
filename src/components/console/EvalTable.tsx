import { Fragment, useMemo, useRef, useState, useEffect } from "react";
import { Plus, ChevronDown, Play, Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { Folder, PromptItem } from "./types";
import { initialEvalRows, testSets, type EvalRow } from "./mockData";

const ISSUE_TYPES = ["无", "略冗长", "事实错误", "格式不符", "拒答", "其他"];

function HeaderSearch({
  value,
  onChange,
  placeholder = "搜索",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = !!value;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center h-4 w-4 rounded hover:bg-accent transition ${
          active ? "text-[var(--console-orange)]" : "text-muted-foreground/60"
        } ${open ? "rotate-180" : ""}`}
      >
        <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 rounded-md border border-border bg-background shadow-lg p-1.5">
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-40 rounded border border-border bg-background px-2 py-1 text-[11px] font-normal outline-none focus:border-[var(--console-orange)]"
          />
        </div>
      )}
    </div>
  );
}

function HeaderMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = selected.length > 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggle(o: string) {
    onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center h-4 w-4 rounded hover:bg-accent transition ${
          active ? "text-[var(--console-orange)]" : "text-muted-foreground/60"
        } ${open ? "rotate-180" : ""}`}
      >
        <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 min-w-[110px] rounded-md border border-border bg-background shadow-lg p-1">
          {options.map((o) => {
            const checked = selected.includes(o);
            return (
              <label
                key={o}
                className="flex items-center gap-2 rounded px-2 py-1 text-[11px] hover:bg-accent cursor-pointer font-normal"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(o)}
                  className="accent-[var(--console-orange)] h-3 w-3"
                />
                {o}
              </label>
            );
          })}
          {active && (
            <button
              onClick={() => onChange([])}
              className="w-full mt-1 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent text-left"
            >
              清空
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ChatPreview({ input, output }: { input: string; output: string }) {
  return (
    <div className="mx-auto w-[220px] rounded-[20px] border border-border bg-[var(--console-sidebar)]/60 p-2 shadow-sm">
      {/* phone notch */}
      <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-border/70" />
      <div className="rounded-xl bg-background px-2 py-2 space-y-2 max-h-[180px] overflow-y-auto [scrollbar-width:thin]">
        {/* user bubble */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--console-orange)]/15 px-2.5 py-1.5 text-[12px] leading-snug text-foreground whitespace-pre-wrap break-words">
            {input}
          </div>
        </div>
        {/* AI bubble */}
        <div className="flex items-end gap-1.5">
          <div className="h-5 w-5 shrink-0 rounded-full bg-[var(--console-orange)]/80 text-white text-[10px] font-medium flex items-center justify-center">
            点
          </div>
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-2.5 py-1.5 text-[12px] leading-snug text-foreground whitespace-pre-wrap break-words">
            {output}
          </div>
        </div>
      </div>
    </div>
  );
}

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

function buildExportRows(
  rows: EvalRow[],
  versions: PromptItem[],
  extraKeys: string[],
) {
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
    const rows = getRows();
    const payload = {
      exportedAt: new Date().toISOString(),
      testSet: testSetName,
      versions: versions.map((p, vi) => ({ index: vi + 1, id: p.id, name: p.name })),
      rows: rows.map((r) => ({
        id: r.id,
        input: r.input,
        extras: r.extras,
        versions: r.versions,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
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
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent"
      >
        <Download className="h-3.5 w-3.5" />
        导出
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-md border border-border bg-background shadow-lg p-1">
          <button
            onClick={exportJSON}
            className="w-full text-left rounded px-2 py-1.5 text-xs hover:bg-accent"
          >
            导出为 JSON
          </button>
          <button
            onClick={exportExcel}
            className="w-full text-left rounded px-2 py-1.5 text-xs hover:bg-accent"
          >
            导出为 Excel
          </button>
        </div>
      )}
    </div>
  );
}

export function EvalTable({
  folders,
  currentPrompt,
  onPickComparePrompt,
}: {
  folders: Folder[];
  currentPrompt: PromptItem;
  onPickComparePrompt: (cb: (p: PromptItem) => void) => void;
}) {
  const [testSetId, setTestSetId] = useState(testSets[0].id);
  const [previewMode, setPreviewMode] = useState<"single" | "list">("list");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showExtras, setShowExtras] = useState(false);
  const [rows, setRows] = useState<EvalRow[]>(initialEvalRows);
  const [comparePrompts, setComparePrompts] = useState<PromptItem[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [scoreFilters, setScoreFilters] = useState<Record<number, string[]>>({});
  const [issueFilters, setIssueFilters] = useState<Record<number, string[]>>({});
  const [noteFilters, setNoteFilters] = useState<Record<number, string>>({});
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const allVersions = useMemo(
    () => [currentPrompt, ...comparePrompts],
    [currentPrompt, comparePrompts],
  );

  const extraKeys = useMemo(
    () => ["输入图片", "输入笔记", "输入时间", "地理位置", "用户UID", "设备平台信息", "短期记忆", "长期记忆"],
    [],
  );

  const filtered = rows.filter((r) => {
    if (filters.id && !String(r.id).includes(filters.id)) return false;
    if (filters.input && !r.input.includes(filters.input)) return false;
    for (let vi = 0; vi < allVersions.length; vi++) {
      const v = r.versions[vi];
      const sf = scoreFilters[vi];
      if (sf && sf.length > 0) {
        const sv = v?.score == null ? "未评" : String(v.score);
        if (!sf.includes(sv)) return false;
      }
      const isf = issueFilters[vi];
      if (isf && isf.length > 0) {
        const iv = v?.issueType ?? "无";
        if (!isf.includes(iv)) return false;
      }
      const nf = noteFilters[vi];
      if (nf && !(v?.note ?? "").includes(nf)) return false;
    }
    return true;
  });

  const effectivePageSize = previewMode === "single" ? 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(filtered.length / effectivePageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);

  function updateVersion(rowId: number, vIndex: number, patch: Partial<EvalRow["versions"][number]>) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== rowId) return r;
        const versions = [...r.versions];
        while (versions.length <= vIndex) {
          versions.push({ promptId: allVersions[versions.length]?.id ?? "", output: "", score: null, issueType: "无", note: "" });
        }
        versions[vIndex] = { ...versions[vIndex], ...patch };
        return { ...r, versions };
      }),
    );
  }

  function runRow(rowId: number, vIndex: number) {
    updateVersion(rowId, vIndex, {
      output: `[${allVersions[vIndex].name}] 模拟输出 - ${rows.find((r) => r.id === rowId)?.input}`,
      score: Math.floor(Math.random() * 5) + 1,
    });
  }

  function addCompare() {
    if (comparePrompts.length >= 2) return; // 最多 3 个版本（含当前）
    onPickComparePrompt((p) => setComparePrompts((cs) => [...cs, p]));
  }

  return (
    <div className="px-6 py-5">
      {/* 顶部控制条 */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
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

        <div className="inline-flex items-center gap-2">
          <span className="text-xs text-muted-foreground">预览模式</span>
          <div className="inline-flex items-center rounded-full bg-muted/50 p-0.5">
            {([
              { v: "single", label: "单条" },
              { v: "list", label: "列表" },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                onClick={() => {
                  setPreviewMode(opt.v);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-0.5 text-xs transition ${
                  previewMode === opt.v
                    ? "bg-[var(--console-cta)] text-[var(--console-cta-foreground)] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <SwitchRow label="显示测试集字段" checked={showExtras} onChange={setShowExtras} />

        <div className="ml-auto flex items-center gap-2">
          <ExportMenu
            getRows={() => filtered}
            versions={allVersions}
            extraKeys={extraKeys}
            testSetName={testSets.find((t) => t.id === testSetId)?.name ?? "测试集"}
          />
          <button
            onClick={() => filtered.forEach((r) => allVersions.forEach((_, vi) => runRow(r.id, vi)))}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-1.5 text-sm hover:opacity-90"
          >
            <Play className="h-3 w-3 fill-current" />
            运行测试
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-[var(--console-sidebar)]/60">
            <tr className="border-b border-border">
              <th className="px-3 py-2.5 text-left text-xs font-medium w-20">
                <div className="flex items-center gap-1">
                  编号
                  <HeaderSearch
                    value={filters.id ?? ""}
                    onChange={(v) => setFilters((f) => ({ ...f, id: v }))}
                  />
                </div>
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium min-w-[160px]">
                <div className="flex items-center gap-1">
                  输入文字
                  <HeaderSearch
                    value={filters.input ?? ""}
                    onChange={(v) => setFilters((f) => ({ ...f, input: v }))}
                  />
                </div>
              </th>
              {showExtras &&
                extraKeys.map((k) => (
                  <th key={k} className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    {k}
                  </th>
                ))}
              {allVersions.map((p, vi) => (
                <th key={p.id + vi} className="px-3 py-2.5 text-left text-xs font-medium min-w-[200px] border-l border-border">
                  <div className="flex items-center gap-1">
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">v{vi + 1}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground font-normal leading-snug">
                    模型 claude-opus-4-7 · 工具 网页搜索 · 主对话
                  </div>
                </th>
              ))}
              {comparePrompts.length < 2 && (
                <th className="px-3 py-2.5 text-left text-xs font-medium min-w-[160px] border-l border-border">
                  <button
                    onClick={addCompare}
                    className="inline-flex items-center gap-1 text-[var(--console-orange)] hover:underline"
                  >
                    <Plus className="h-3 w-3" /> 增加 Prompt 对比
                  </button>
                </th>
              )}
              <th colSpan={allVersions.length * 3} className="px-3 py-2.5 text-left text-xs font-medium border-l border-border">
                大模型评估
              </th>
            </tr>
            <tr className="border-b border-border bg-[var(--console-sidebar)]/40">
              <th colSpan={2 + (showExtras ? extraKeys.length : 0) + allVersions.length + (comparePrompts.length < 2 ? 1 : 0)}></th>
              {allVersions.map((_, vi) => (
                <Fragment key={"hdr" + vi}>
                  <th className="px-2 py-1.5 text-left text-[11px] text-muted-foreground border-l border-border font-normal">
                    <div className="flex items-center gap-1">
                      v{vi + 1} 分数
                      <HeaderMultiSelect
                        options={["1", "2", "3", "4", "5", "未评"]}
                        selected={scoreFilters[vi] ?? []}
                        onChange={(arr) => setScoreFilters((s) => ({ ...s, [vi]: arr }))}
                      />
                    </div>
                  </th>
                  <th className="px-2 py-1.5 text-left text-[11px] text-muted-foreground font-normal">
                    <div className="flex items-center gap-1">
                      问题类型
                      <HeaderMultiSelect
                        options={ISSUE_TYPES}
                        selected={issueFilters[vi] ?? []}
                        onChange={(arr) => setIssueFilters((s) => ({ ...s, [vi]: arr }))}
                      />
                    </div>
                  </th>
                  <th className="px-2 py-1.5 text-left text-[11px] text-muted-foreground font-normal">
                    <div className="flex items-center gap-1">
                      备注
                      <HeaderSearch
                        value={noteFilters[vi] ?? ""}
                        onChange={(v) => setNoteFilters((s) => ({ ...s, [vi]: v }))}
                      />
                    </div>
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-[var(--console-sidebar)]/30 align-top">
                <td className="px-3 py-3 text-xs text-muted-foreground">{r.id}</td>
                <td className="px-3 py-3 text-sm">
                  <input
                    value={r.input}
                    onChange={(e) =>
                      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, input: e.target.value } : x)))
                    }
                    placeholder="输入测试内容..."
                    className="w-full bg-transparent text-sm outline-none focus:bg-background focus:border focus:border-[var(--console-orange)] rounded px-1 py-0.5"
                  />
                </td>
                {showExtras &&
                  extraKeys.map((k) => (
                    <td key={k} className="px-3 py-3 text-xs text-muted-foreground">
                      {r.extras[k] ?? "-"}
                    </td>
                  ))}
                {allVersions.map((_, vi) => {
                  const v = r.versions[vi];
                  const key = `${r.id}-${vi}`;
                  const isExpanded = previewMode === "single" || expanded[key];
                  return (
                    <td key={vi} className="px-3 py-3 text-sm border-l border-border">
                      {v?.output ? (
                        isExpanded ? (
                          <div className="space-y-1.5">
                            <ChatPreview input={r.input} output={v.output} />
                            {previewMode === "list" && (
                              <button
                                onClick={() => setExpanded((e) => ({ ...e, [key]: false }))}
                                className="block mx-auto text-[11px] text-muted-foreground hover:text-foreground"
                              >
                                收起
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setExpanded((e) => ({ ...e, [key]: true }))}
                            className="group w-full flex items-center gap-1.5 text-left text-xs text-foreground/80 hover:text-foreground py-0.5"
                            title={v.output}
                          >
                            <ChevronDown className="h-3 w-3 shrink-0 -rotate-90 text-muted-foreground group-hover:text-[var(--console-orange)] transition" />
                            <span className="truncate">{v.output}</span>
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => runRow(r.id, vi)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-accent"
                        >
                          <Play className="h-3 w-3" /> 运行
                        </button>
                      )}
                    </td>
                  );
                })}
                {comparePrompts.length < 2 && <td className="border-l border-border" />}
                {allVersions.map((_, vi) => {
                  const v = r.versions[vi] ?? { score: null, issueType: "无", note: "" };
                  return (
                    <Fragment key={"vf" + vi}>
                      <td className="px-2 py-3 border-l border-border">
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={v.score ?? ""}
                          onChange={(e) =>
                            updateVersion(r.id, vi, { score: e.target.value ? +e.target.value : null })
                          }
                          className="w-12 rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <select
                          value={v.issueType}
                          onChange={(e) => updateVersion(r.id, vi, { issueType: e.target.value })}
                          className="rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none"
                        >
                          {ISSUE_TYPES.map((it) => (
                            <option key={it}>{it}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-3">
                        <input
                          value={v.note}
                          onChange={(e) => updateVersion(r.id, vi, { note: e.target.value })}
                          placeholder="备注"
                          className="w-28 rounded border border-border bg-background px-1.5 py-0.5 text-xs outline-none"
                        />
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => {
            const nextId = (rows.reduce((m, r) => Math.max(m, r.id), 0) || 0) + 1;
            setRows((rs) => [
              ...rs,
              { id: nextId, input: "", extras: {}, versions: [] },
            ]);
          }}
          className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> 新增一行
        </button>
        <span className="text-xs text-muted-foreground">
          共 {filtered.length} 行 · 当前对比版本数：{allVersions.length}（最多 3）
        </span>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>每页</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(+e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-1.5 py-0.5 text-xs outline-none focus:border-[var(--console-orange)] cursor-pointer"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>条</span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-md border border-border bg-background px-2 py-0.5 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-foreground">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-border bg-background px-2 py-0.5 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
