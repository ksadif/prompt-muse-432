import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { Sidebar } from "@/components/console/Sidebar";
import { PromptListPanel } from "@/components/console/PromptListPanel";
import { PromptInfoBar } from "@/components/console/PromptInfoBar";
import { PromptEditorBlock } from "@/components/console/PromptEditorBlock";
import { AgentPreview } from "@/components/console/AgentPreview";
import { EvalTable } from "@/components/console/EvalTable";
import { RightDrawer } from "@/components/console/RightDrawer";
import { initialFolders, versionHistory } from "@/components/console/mockData";
import {
  ALL_MODELS,
  ALL_TOOLS,
  ALL_MEMORIES,
  type EditorBlock,
  type Folder,
  type PromptItem,
} from "@/components/console/types";
import { Plus, ListTree, Play, ArrowDown, Trash2 } from "lucide-react";
import { NewPromptDialog } from "@/components/console/NewPromptDialog";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Agent 编排 · Claude Console" }] }),
  component: PromptPage,
});

function makeBlock(idx: number): EditorBlock {
  return {
    id: `b${Date.now()}-${idx}`,
    title: idx === 0 ? "主 Prompt" : `后处理 #${idx}`,
    linkedPromptId: null,
    model: "claude-opus-4-7",
    maxTurns: 5,
    tools: [],
    memories: [],
    systemPrompt: "",
    userPrompt: "",
  };
}

type DrawerKind =
  | { kind: "model"; blockIdx: number }
  | { kind: "tools"; blockIdx: number }
  | { kind: "memory"; blockIdx: number }
  | { kind: "edit"; blockIdx: number }
  | { kind: "history" }
  | { kind: "compare"; cb: (p: PromptItem) => void }
  | null;

function PromptPage() {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [selectedId, setSelectedId] = useState<string>("p1");
  const [tab, setTab] = useState<"edit" | "test">("edit");
  const [blocksMap, setBlocksMap] = useState<Record<string, EditorBlock[]>>({
    p1: [makeBlock(0)],
  });
  const [drawer, setDrawer] = useState<DrawerKind>(null);
  const [listOpen, setListOpen] = useState(false);
  const [newPromptOpen, setNewPromptOpen] = useState(false);

  const selectedPrompt = useMemo(() => {
    for (const f of folders) {
      const p = f.prompts.find((x) => x.id === selectedId);
      if (p) return p;
    }
    return null;
  }, [folders, selectedId]);

  const blocks = blocksMap[selectedId] ?? [makeBlock(0)];

  function setBlocks(updater: (b: EditorBlock[]) => EditorBlock[]) {
    setBlocksMap((m) => ({ ...m, [selectedId]: updater(m[selectedId] ?? [makeBlock(0)]) }));
  }

  function handleAddFolder(name: string) {
    setFolders((fs) => [...fs, { id: `f${Date.now()}`, name, prompts: [] }]);
  }

  function handleAddPrompt(d: { name: string; description: string; folderId: string }) {
    const newPrompt: PromptItem = {
      id: `p${Date.now()}`,
      name: d.name,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      owner: "yz",
    };
    setFolders((fs) =>
      fs.map((f) => (f.id === d.folderId ? { ...f, prompts: [...f.prompts, newPrompt] } : f)),
    );
    setSelectedId(newPrompt.id);
    setBlocksMap((m) => ({ ...m, [newPrompt.id]: [makeBlock(0)] }));
  }

  function renamePrompt(name: string) {
    setFolders((fs) =>
      fs.map((f) => ({
        ...f,
        prompts: f.prompts.map((p) => (p.id === selectedId ? { ...p, name } : p)),
      })),
    );
  }

  function duplicatePrompt() {
    if (!selectedPrompt) return;
    const dup: PromptItem = {
      ...selectedPrompt,
      id: `p${Date.now()}`,
      name: selectedPrompt.name + "（副本）",
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    };
    setFolders((fs) =>
      fs.map((f) =>
        f.prompts.find((x) => x.id === selectedId)
          ? { ...f, prompts: [...f.prompts, dup] }
          : f,
      ),
    );
    setBlocksMap((m) => ({ ...m, [dup.id]: blocks.map((b) => ({ ...b, id: `b${Math.random()}` })) }));
    setSelectedId(dup.id);
  }

  function deletePrompt() {
    setFolders((fs) =>
      fs.map((f) => ({ ...f, prompts: f.prompts.filter((p) => p.id !== selectedId) })),
    );
    const remain = folders.flatMap((f) => f.prompts).find((p) => p.id !== selectedId);
    if (remain) setSelectedId(remain.id);
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col relative">
        <div className="px-3 flex items-stretch gap-2 border-b border-border bg-background">
          <div className="flex items-center gap-2 py-2">
            <button
              onClick={() => setListOpen((v) => !v)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border hover:bg-accent"
              title="Agent 列表"
            >
              <ListTree className="h-4 w-4" />
            </button>
            <button
              onClick={() => setNewPromptOpen(true)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-[var(--console-orange)] hover:bg-accent"
              title="新建 Agent"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {selectedPrompt && (
            <div className="flex-1 min-w-0">
              <PromptInfoBar
                prompt={selectedPrompt}
                onRename={renamePrompt}
                onShowHistory={() => setDrawer({ kind: "history" })}
                onDuplicate={duplicatePrompt}
                onDelete={deletePrompt}
                onSave={() => {}}
                centerSlot={
                  <div className="inline-flex items-center rounded-full bg-[var(--console-active)] p-0.5">
                    {[
                      { k: "edit", label: "Agent 调试" },
                      { k: "test", label: "效果测试" },
                    ].map((t) => (
                      <button
                        key={t.k}
                        onClick={() => setTab(t.k as "edit" | "test")}
                        className={`px-4 py-1 text-sm rounded-full transition ${
                          tab === t.k
                            ? "bg-background text-foreground shadow-sm font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                }
                rightSlot={
                  tab === "test" ? (
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent("console:run", { detail: { tab } }))}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-1.5 text-sm hover:opacity-90"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      运行测试
                    </button>
                  ) : null
                }
              />
            </div>
          )}
        </div>

        <PromptListPanel
          variant="agent"
          open={listOpen}
          onClose={() => setListOpen(false)}
          folders={folders}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            if (!blocksMap[id]) setBlocksMap((m) => ({ ...m, [id]: [makeBlock(0)] }));
          }}
          onAddFolder={handleAddFolder}
          onCreate={() => setNewPromptOpen(true)}
        />

        <NewPromptDialog
          open={newPromptOpen}
          folders={folders}
          onClose={() => setNewPromptOpen(false)}
          onCreate={(d) => {
            handleAddPrompt(d);
            setNewPromptOpen(false);
          }}
        />

        {tab === "edit" ? (
          <div className="grid grid-cols-[280px_1fr] flex-1 min-h-0">
            {/* 左：节点列 */}
            <div className="border-r border-border overflow-y-auto bg-muted/20">
              <div className="px-4 py-3 border-b border-border text-sm font-semibold">
                Agent 流程
              </div>
              <div className="px-3 py-4">
              {blocks.map((b, i) => {
                const linked = folders
                  .flatMap((f) => f.prompts)
                  .find((p) => p.id === b.linkedPromptId);
                const active = drawer?.kind === "edit" && drawer.blockIdx === i;
                return (
                  <div key={b.id}>
                    <button
                      onClick={() => setDrawer({ kind: "edit", blockIdx: i })}
                      className={`w-full text-left rounded-lg border bg-background hover:border-[var(--console-orange)]/60 hover:shadow-sm transition p-3 group ${
                        active
                          ? "border-[var(--console-orange)] shadow-sm"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded bg-[var(--console-orange)]/10 text-[var(--console-orange)] text-[10.5px] font-semibold">
                            {i === 0 ? "主" : `#${i}`}
                          </span>
                          <span className="text-[13px] font-medium truncate max-w-[160px]">
                            {linked ? linked.name : i === 0 ? "主 Prompt" : `后处理 ${i}`}
                          </span>
                        </div>
                        {i > 0 && (
                          <span
                            role="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBlocks((bs) => bs.filter((_, idx) => idx !== i));
                              if (drawer?.kind === "edit" && drawer.blockIdx === i) setDrawer(null);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="删除"
                          >
                            <Trash2 className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {b.model}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                        <span>工具 {b.tools.length}</span>
                      </div>
                    </button>
                    {i < blocks.length - 1 && (
                      <div className="flex justify-center py-1.5 text-muted-foreground/60">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => setBlocks((bs) => [...bs, makeBlock(bs.length)])}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> 增加后处理
              </button>
              </div>
            </div>
            {/* 右：Agent 效果预览 */}
            <div className="overflow-y-auto">
              <AgentPreview />
            </div>
          </div>
        ) : (
          selectedPrompt && (
            <EvalTable
              folders={folders}
              currentPrompt={selectedPrompt}
              onPickComparePrompt={(cb) => setDrawer({ kind: "compare", cb })}
            />
          )
        )}
      </div>

      {/* 节点编辑抽屉 */}
      <RightDrawer
        open={drawer?.kind === "edit"}
        title={
          drawer?.kind === "edit"
            ? drawer.blockIdx === 0
              ? "编辑：主 Prompt"
              : `编辑：后处理 ${drawer.blockIdx}`
            : ""
        }
        onClose={() => setDrawer(null)}
        width={560}
      >
        {drawer?.kind === "edit" && blocks[drawer.blockIdx] && (
          <PromptEditorBlock
            block={blocks[drawer.blockIdx]}
            index={drawer.blockIdx}
            removable={false}
            folders={folders}
            onChange={(nb) =>
              setBlocks((bs) =>
                bs.map((x, idx) => (idx === drawer.blockIdx ? nb : x)),
              )
            }
            onRemove={() => {}}
            onOpenModelPicker={() => setDrawer({ kind: "model", blockIdx: drawer.blockIdx })}
            onOpenToolPicker={() => setDrawer({ kind: "tools", blockIdx: drawer.blockIdx })}
            onOpenMemoryPicker={() => setDrawer({ kind: "memory", blockIdx: drawer.blockIdx })}
          />
        )}
      </RightDrawer>

      {/* 右侧抽屉 */}
      <RightDrawer
        open={drawer?.kind === "model"}
        title="选择模型"
        onClose={() => setDrawer(null)}
      >
        <div className="space-y-2">
          <input
            placeholder="搜索模型..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] mb-1"
          />
          {ALL_MODELS.map((m) => {
            const active =
              drawer?.kind === "model" && blocks[drawer.blockIdx]?.model === m;
            return (
              <button
                key={m}
                onClick={() => {
                  if (drawer?.kind !== "model") return;
                  setBlocks((bs) =>
                    bs.map((b, idx) => (idx === drawer.blockIdx ? { ...b, model: m } : b)),
                  );
                  setDrawer(null);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition flex items-center gap-3 ${
                  active
                    ? "border-[var(--console-orange)] bg-[var(--console-active)]"
                    : "border-border hover:bg-accent hover:border-[var(--console-orange)]/40"
                }`}
              >
                <div className="h-7 w-7 shrink-0 rounded-md bg-[var(--console-orange)]/10 text-[var(--console-orange)] inline-flex items-center justify-center text-[11px] font-semibold">
                  AI
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m}</div>
                  <div className="text-[11px] text-muted-foreground">通用对话模型</div>
                </div>
                {active && (
                  <span className="text-[11px] text-[var(--console-orange)] font-medium">已选</span>
                )}
              </button>
            );
          })}
        </div>
      </RightDrawer>

      <RightDrawer
        open={drawer?.kind === "tools"}
        title="选择工具"
        onClose={() => setDrawer(null)}
      >
        <div className="space-y-2">
          <input
            placeholder="搜索工具..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] mb-1"
          />
          {ALL_TOOLS.map((t) => {
            const cur = drawer?.kind === "tools" ? blocks[drawer.blockIdx]?.tools ?? [] : [];
            const active = cur.includes(t);
            return (
              <label
                key={t}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                  active
                    ? "border-[var(--console-orange)] bg-[var(--console-active)]"
                    : "border-border hover:bg-accent hover:border-[var(--console-orange)]/40"
                }`}
              >
                <div className="h-7 w-7 shrink-0 rounded-md bg-[var(--console-orange)]/10 text-[var(--console-orange)] inline-flex items-center justify-center text-xs">
                  🔧
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t}</div>
                  <div className="text-[11px] text-muted-foreground">点击启用此工具</div>
                </div>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => {
                    if (drawer?.kind !== "tools") return;
                    setBlocks((bs) =>
                      bs.map((b, idx) =>
                        idx === drawer.blockIdx
                          ? {
                              ...b,
                              tools: active ? b.tools.filter((x) => x !== t) : [...b.tools, t],
                            }
                          : b,
                      ),
                    );
                  }}
                  className="h-4 w-4 accent-[var(--console-orange)]"
                />
              </label>
            );
          })}
        </div>
      </RightDrawer>

      <RightDrawer
        open={drawer?.kind === "memory"}
        title="选择记忆"
        onClose={() => setDrawer(null)}
      >
        <div className="space-y-2">
          <input
            placeholder="搜索记忆库..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] mb-1"
          />
          {ALL_MEMORIES.map((t) => {
            const cur = drawer?.kind === "memory" ? blocks[drawer.blockIdx]?.memories ?? [] : [];
            const active = cur.includes(t);
            return (
              <label
                key={t}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition ${
                  active
                    ? "border-[var(--console-orange)] bg-[var(--console-active)]"
                    : "border-border hover:bg-accent hover:border-[var(--console-orange)]/40"
                }`}
              >
                <div className="h-7 w-7 shrink-0 rounded-md bg-[var(--console-orange)]/10 text-[var(--console-orange)] inline-flex items-center justify-center text-xs">
                  🧠
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t}</div>
                  <div className="text-[11px] text-muted-foreground">长期记忆数据源</div>
                </div>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => {
                    if (drawer?.kind !== "memory") return;
                    setBlocks((bs) =>
                      bs.map((b, idx) =>
                        idx === drawer.blockIdx
                          ? {
                              ...b,
                              memories: active
                                ? b.memories.filter((x) => x !== t)
                                : [...b.memories, t],
                            }
                          : b,
                      ),
                    );
                  }}
                  className="h-4 w-4 accent-[var(--console-orange)]"
                />
              </label>
            );
          })}
        </div>
      </RightDrawer>

      <RightDrawer
        open={drawer?.kind === "history"}
        title="版本历史"
        onClose={() => setDrawer(null)}
      >
        <div className="space-y-2">
          {versionHistory.map((v) => (
            <div
              key={v.version}
              className="rounded-md border border-border bg-background p-3 hover:bg-accent cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{v.name}</span>
                <span className="text-[11px] rounded bg-[var(--console-active)] px-1.5 py-0.5">
                  {v.version}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {v.time} · 操作人：{v.operator}
              </div>
            </div>
          ))}
        </div>
      </RightDrawer>

      <RightDrawer
        open={drawer?.kind === "compare"}
        title="选择对比 Prompt"
        onClose={() => setDrawer(null)}
      >
        <div className="space-y-3">
          {folders.map((f) => (
            <div key={f.id}>
              <div className="text-xs font-medium text-muted-foreground mb-1.5">{f.name}</div>
              {f.prompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (drawer?.kind === "compare") drawer.cb(p);
                    setDrawer(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md border border-border hover:bg-accent mb-1"
                >
                  <div className="text-sm">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.updatedAt} · {p.owner}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </RightDrawer>
    </div>
  );
}
