import { Fragment, useMemo, useState } from "react";
import { Plus, Search, Play } from "lucide-react";
import type { Folder, PromptItem } from "./types";
import { initialEvalRows, testSets, type EvalRow } from "./mockData";

const ISSUE_TYPES = ["无", "略冗长", "事实错误", "格式不符", "拒答", "其他"];

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
  const [showConfig, setShowConfig] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [rows, setRows] = useState<EvalRow[]>(initialEvalRows);
  const [comparePrompts, setComparePrompts] = useState<PromptItem[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [scoreFilters, setScoreFilters] = useState<Record<number, string>>({});
  const [issueFilters, setIssueFilters] = useState<Record<number, string>>({});

  const allVersions = useMemo(
    () => [currentPrompt, ...comparePrompts],
    [currentPrompt, comparePrompts],
  );

  const extraKeys = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => Object.keys(r.extras).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (filters.id && !String(r.id).includes(filters.id)) return false;
    if (filters.input && !r.input.includes(filters.input)) return false;
    return true;
  });

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
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background pl-3 pr-1 py-1 text-sm">
          <span className="text-muted-foreground text-xs">关联测试集</span>
          <select
            value={testSetId}
            onChange={(e) => setTestSetId(e.target.value)}
            className="bg-transparent text-sm outline-none pr-1 cursor-pointer"
          >
            {testSets.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowConfig((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-sm transition ${
            showConfig
              ? "border-[var(--console-orange)] bg-[var(--console-active)] text-[var(--console-orange)]"
              : "border-border bg-background text-muted-foreground hover:bg-accent"
          }`}
        >
          显示 Prompt 配置
        </button>
        <button
          onClick={() => setShowExtras((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-sm transition ${
            showExtras
              ? "border-[var(--console-orange)] bg-[var(--console-active)] text-[var(--console-orange)]"
              : "border-border bg-background text-muted-foreground hover:bg-accent"
          }`}
        >
          显示测试集字段
        </button>

        <button
          onClick={() => filtered.forEach((r) => allVersions.forEach((_, vi) => runRow(r.id, vi)))}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-[var(--console-orange)] text-white px-3 py-1.5 text-sm hover:opacity-90"
        >
          <Play className="h-3 w-3 fill-current" />
          运行测试
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-[var(--console-sidebar)]/60">
            <tr className="border-b border-border">
              <th className="px-3 py-2.5 text-left text-xs font-medium w-20">
                <div>编号</div>
                <input
                  placeholder="搜索"
                  value={filters.id ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, id: e.target.value }))}
                  className="mt-1 w-full rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-normal outline-none"
                />
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium min-w-[160px]">
                <div className="flex items-center gap-1"><Search className="h-3 w-3" />输入文字</div>
                <input
                  placeholder="搜索"
                  value={filters.input ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, input: e.target.value }))}
                  className="mt-1 w-full rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-normal outline-none"
                />
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
                  {showConfig && (
                    <div className="mt-1 text-[10px] text-muted-foreground font-normal leading-snug">
                      模型 claude-opus-4-7 · 工具 网页搜索 · 主对话
                    </div>
                  )}
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
              {allVersions.map((p, vi) => (
                <th key={"hdr" + vi} colSpan={3} className="px-3 py-1.5 text-left text-[11px] text-muted-foreground border-l border-border">
                  版本 {vi + 1}：分数 / 问题类型 / 备注
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-[var(--console-sidebar)]/30 align-top">
                <td className="px-3 py-3 text-xs text-muted-foreground">{r.id}</td>
                <td className="px-3 py-3 text-sm">{r.input}</td>
                {showExtras &&
                  extraKeys.map((k) => (
                    <td key={k} className="px-3 py-3 text-xs text-muted-foreground">
                      {r.extras[k] ?? "-"}
                    </td>
                  ))}
                {allVersions.map((_, vi) => {
                  const v = r.versions[vi];
                  return (
                    <td key={vi} className="px-3 py-3 text-sm border-l border-border">
                      {v?.output ? (
                        v.output
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

      {/* 列筛选条（分数/问题类型整列筛选） */}
      <div className="mt-3 text-xs text-muted-foreground">
        共 {filtered.length} 行 · 当前对比版本数：{allVersions.length}（最多 3）
      </div>
    </div>
  );
}
