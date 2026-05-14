import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { Plus, Upload, Trash2, PencilLine, FileUp, Search, MoreHorizontal, Pencil, ListTree, ChevronDown } from "lucide-react";
import { testSetFolders as initialFolders } from "@/components/console/mockData";
import { PromptListPanel } from "@/components/console/PromptListPanel";
import type { Folder } from "@/components/console/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/evaluate")({
  head: () => ({ meta: [{ title: "测试集管理 · Claude Console" }] }),
  component: TestSetPage,
});

const EXTRA_FIELDS = ["输入图片", "输入笔记", "地理位置", "短期记忆", "长期记忆"] as const;



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
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const sets = useMemo(() => folders.flatMap((f) => f.prompts), [folders]);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(sets[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [extraRows, setExtraRows] = useState<Record<string, ExtraSample[]>>({});
  const [deletedRowIds, setDeletedRowIds] = useState<Record<string, Set<string>>>({});
  const [overrides, setOverrides] = useState<
    Record<string, Record<string, { query?: string; extras?: Record<string, string> }>>
  >({});
  
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [dirtySets, setDirtySets] = useState<Set<string>>(new Set());
  const [listOpen, setListOpen] = useState(false);
  const [nameMenuOpen, setNameMenuOpen] = useState(false);
  const navigate = useNavigate();

  const selected = sets.find((s) => s.id === selectedId) ?? null;
  const baseRows = useMemo(
    () => (selected ? genDetailRows(selected.id, selected.name) : []),
    [selected],
  );
  const detailRows = useMemo(() => {
    if (!selected) return [];
    const added = extraRows[selected.id] ?? [];
    const deleted = deletedRowIds[selected.id] ?? new Set<string>();
    const ov = overrides[selected.id] ?? {};
    return [...baseRows, ...added]
      .filter((r) => !deleted.has(r.id))
      .map((r) => {
        const o = ov[r.id];
        if (!o) return r;
        return {
          ...r,
          query: o.query ?? r.query,
          extras: { ...r.extras, ...(o.extras ?? {}) },
        };
      });
  }, [selected, baseRows, extraRows, deletedRowIds, overrides]);
  const filteredRows = detailRows.filter((r) =>
    search.trim() ? r.query.toLowerCase().includes(search.trim().toLowerCase()) : true,
  );

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const markDirty = (sid: string) =>
    setDirtySets((d) => {
      if (d.has(sid)) return d;
      const n = new Set(d);
      n.add(sid);
      return n;
    });
  const saveSelected = () => {
    if (!selected) return;
    setDirtySets((d) => {
      const n = new Set(d);
      n.delete(selected.id);
      return n;
    });
  };
  const isDirty = selected ? dirtySets.has(selected.id) : false;

  const renameSet = (id: string, currentName: string) => {
    const next = window.prompt("重命名测试集", currentName);
    if (!next || !next.trim() || next === currentName) return;
    setFolders((fs) =>
      fs.map((f) => ({
        ...f,
        prompts: f.prompts.map((p) => (p.id === id ? { ...p, name: next.trim() } : p)),
      })),
    );
    markDirty(id);
  };

  const addBlankRow = () => {
    if (!selected) return;
    setExtraRows((m) => {
      const list = m[selected.id] ?? [];
      const empty: Record<string, string> = {};
      MOCK_DETAIL_FIELDS.forEach((f) => (empty[f] = ""));
      const next: ExtraSample = {
        id: `${selected.id}-x${list.length + 1}-${Date.now()}`,
        no: baseRows.length + list.length + 1,
        query: "",
        extras: empty,
      };
      return { ...m, [selected.id]: [...list, next] };
    });
    markDirty(selected.id);
    setEditingRowId(`${selected.id}-x${(extraRows[selected.id]?.length ?? 0) + 1}-${Date.now()}`);
  };

  const updateCell = (rowId: string, field: "query" | string, value: string) => {
    if (!selected) return;
    setOverrides((m) => {
      const sid = selected.id;
      const ov = { ...(m[sid] ?? {}) };
      const cur = { ...(ov[rowId] ?? {}) };
      if (field === "query") cur.query = value;
      else cur.extras = { ...(cur.extras ?? {}), [field]: value };
      ov[rowId] = cur;
      return { ...m, [sid]: ov };
    });
    if (selected) markDirty(selected.id);
  };

  const duplicateSet = (id: string) => {
    let newId = "";
    setFolders((fs) =>
      fs.map((f) => {
        const idx = f.prompts.findIndex((p) => p.id === id);
        if (idx < 0) return f;
        const src = f.prompts[idx];
        newId = `ts-${Date.now()}`;
        const copy = {
          ...src,
          id: newId,
          name: `${src.name} 副本`,
          updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        };
        const next = [...f.prompts];
        next.splice(idx + 1, 0, copy);
        return { ...f, prompts: next };
      }),
    );
    if (newId) setSelectedId(newId);
  };

  const deleteSet = (id: string) => {
    setFolders((fs) => fs.map((f) => ({ ...f, prompts: f.prompts.filter((p) => p.id !== id) })));
    if (selectedId === id) {
      const remaining = sets.filter((x) => x.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
  };
  const deleteRow = (rowId: string) => {
    if (!selected) return;
    setDeletedRowIds((m) => {
      const cur = new Set(m[selected.id] ?? []);
      cur.add(rowId);
      return { ...m, [selected.id]: cur };
    });
    markDirty(selected.id);
  };

  return (
    <ConsoleShell>
      <div className="flex flex-col h-full min-h-0 relative">
        {/* 顶部工具条 */}
        <div className="px-3 flex items-center gap-2 border-b border-border bg-background py-2 min-h-[52px]">
          <button
            onClick={() => setListOpen((v) => !v)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border hover:bg-accent"
            title="测试集列表"
          >
            <ListTree className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-[var(--console-orange)] hover:bg-accent"
            title="新建测试集"
          >
            <Plus className="h-4 w-4" />
          </button>
          {selected && (
            <div className="relative">
              <button
                onClick={() => setNameMenuOpen((v) => !v)}
                className="flex items-center gap-1 text-[16px] font-semibold tracking-tight px-2 py-1 rounded hover:bg-accent"
              >
                {selected.name}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              {nameMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNameMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-40 w-56 rounded-md border border-border bg-background shadow-lg py-1">
                    <button
                      onClick={() => {
                        setNameMenuOpen(false);
                        renameSet(selected.id, selected.name);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      <Pencil className="h-3.5 w-3.5" /> 重命名
                    </button>
                    <button
                      onClick={() => {
                        setNameMenuOpen(false);
                        saveSelected();
                      }}
                      disabled={!isDirty}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FileUp className="h-3.5 w-3.5" /> 保存{isDirty ? " ·" : ""}
                    </button>
                    <button
                      onClick={() => {
                        setNameMenuOpen(false);
                        duplicateSet(selected.id);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      <Plus className="h-3.5 w-3.5" /> 创建副本
                    </button>
                    <button
                      onClick={() => {
                        setNameMenuOpen(false);
                        navigate({ to: "/" });
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      <Upload className="h-3.5 w-3.5" /> 在 Agent 工作台使用
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => {
                        setNameMenuOpen(false);
                        if (window.confirm(`确认删除测试集「${selected.name}」？`)) deleteSet(selected.id);
                      }}
                      className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-accent"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> 删除
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {selected && (
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索 Query"
                  className="pl-6 pr-2 py-1.5 text-xs rounded border border-border bg-background outline-none focus:border-[var(--console-orange)] w-44"
                />
              </div>
              
            </div>
          )}
        </div>

        <PromptListPanel
          open={listOpen}
          onClose={() => setListOpen(false)}
          folders={folders}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          onAddFolder={(name) =>
            setFolders((fs) => [...fs, { id: `tsf-${Date.now()}`, name, prompts: [] }])
          }
          variant="testset"
        />


        {/* 详细内容 */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {selected ? (
            <div className="flex-1 min-h-0 overflow-auto px-6 py-4">
              <div className="rounded border border-border overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-muted-foreground sticky top-0">
                    <tr>
                      <th className="w-10 px-3 py-3 text-left font-normal">#</th>
                      <th className="px-4 py-3 text-left font-normal min-w-[200px]">输入 Query</th>
                      {MOCK_DETAIL_FIELDS.map((f) => (
                        <th key={f} className="px-4 py-3 text-left font-normal whitespace-nowrap">
                          {f}
                        </th>
                      ))}
                      <th className="w-8 px-2 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                     {filteredRows.map((r) => {
                       const cellCls =
                         "w-full rounded border border-transparent bg-transparent px-2 py-1 outline-none transition-colors hover:border-border focus:border-[var(--console-orange)] focus:bg-background";
                       return (
                       <tr key={r.id} className="group border-t border-border hover:bg-muted/30">
                         <td className="px-3 py-2 text-muted-foreground">{r.no}</td>
                         <td className="px-2 py-1.5">
                           <input
                             value={r.query}
                             onChange={(e) => updateCell(r.id, "query", e.target.value)}
                             className={cellCls}
                           />
                         </td>
                         {MOCK_DETAIL_FIELDS.map((f) => (
                           <td key={f} className="px-2 py-1.5">
                             <input
                               value={r.extras[f] ?? ""}
                               onChange={(e) => updateCell(r.id, f, e.target.value)}
                               className={cellCls}
                             />
                           </td>
                         ))}
                        <td className="px-1 py-1.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 hover:bg-background hover:text-foreground"
                                aria-label="更多"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-28 p-1">
                              <DropdownMenuItem
                                onClick={() => deleteRow(r.id)}
                                className="text-xs py-1 px-2 cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-1.5" /> 删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                       </tr>
                       );
                     })}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={3 + MOCK_DETAIL_FIELDS.length}
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          没有匹配的样本
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button
                onClick={addBlankRow}
                className="mt-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-[var(--console-orange)] hover:bg-muted"
              >
                <Plus className="h-3 w-3" /> 新增一行
              </button>
            </div>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>

      <NewTestSetDialog
        open={open}
        folders={folders}
        onClose={() => setOpen(false)}
        onCreate={(name, count, folderId) => {
          const newId = `ts-${Date.now()}`;
          setFolders((fs) =>
            fs.map((f) =>
              f.id === folderId
                ? {
                    ...f,
                    prompts: [
                      ...f.prompts,
                      {
                        id: newId,
                        name: `${name}（${count} 条）`,
                        updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
                        owner: "yz",
                      },
                    ],
                  }
                : f,
            ),
          );
          setSelectedId(newId);
          setOpen(false);
        }}
      />
    </ConsoleShell>
  );
}

function NewTestSetDialog({
  open,
  folders,
  onClose,
  onCreate,
}: {
  open: boolean;
  folders: Folder[];
  onClose: () => void;
  onCreate: (name: string, count: number, folderId: string) => void;
}) {
  const [mode, setMode] = useState<"manual" | "upload">("manual");
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState(folders[0]?.id ?? "");
  const [activeExtras, setActiveExtras] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [file, setFile] = useState<File | null>(null);

  const reset = () => {
    setMode("manual");
    setName("");
    setActiveExtras([]);
    setCount(10);
    setFile(null);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const canCreate =
    name.trim() && (mode === "manual" ? count > 0 : !!file);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新建测试集</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
              <label className="text-xs font-medium text-muted-foreground">所属文件夹</label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)]"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5 text-xs">
            <button
              onClick={() => setMode("manual")}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 ${mode === "manual" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <PencilLine className="h-3.5 w-3.5" /> 手动创建
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
              <div>
                <label className="text-xs font-medium text-muted-foreground">初始样本数</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1 w-32 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)]"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  创建后会生成空白样本行，可在表格中直接编辑。
                </p>
              </div>
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
                首行为字段名，必须包含「输入 Query」列；其他列将作为附加字段。
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
                const c = mode === "manual" ? count : Math.floor(Math.random() * 50) + 10;
                onCreate(name.trim(), c, folderId);
                reset();
              }}
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

