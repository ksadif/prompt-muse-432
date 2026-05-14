import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sidebar } from "@/components/console/Sidebar";
import { PromptListPanel } from "@/components/console/PromptListPanel";
import { PromptInfoBar } from "@/components/console/PromptInfoBar";
import { NewPromptDialog } from "@/components/console/NewPromptDialog";
import { RightDrawer } from "@/components/console/RightDrawer";
import { initialFolders, versionHistory } from "@/components/console/mockData";
import type { Folder, PromptItem } from "@/components/console/types";
import { Plus, ListTree, Variable, Hash, BookOpen, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { PromptCodeEditor } from "@/components/console/PromptCodeEditor";
import { JinjaReference } from "@/components/console/JinjaReference";
import { PromptAssistant } from "@/components/console/PromptAssistant";

function EditorCard({
  label,
  hint,
  value,
  onChange,
  placeholder,
  collapsed,
  onToggle,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const lines = value ? value.split("\n").length : 0;
  const chars = value.length;
  const vars = Array.from(value.matchAll(/\{\{([^}]+)\}\}/g)).map((m) => m[1].trim());
  const uniqueVars = Array.from(new Set(vars));
  return (
    <div
      className={`rounded-xl border border-border bg-background shadow-sm flex flex-col min-h-0 overflow-hidden ${
        collapsed ? "flex-none" : "flex-1"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 hover:opacity-80"
          title={collapsed ? "展开" : "折叠"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="inline-flex items-center gap-1 text-sm font-semibold">
            <Hash className="h-3.5 w-3.5 text-[var(--console-orange)]" />
            {label}
          </span>
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        </button>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {uniqueVars.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-[var(--console-orange)]/10 text-[var(--console-orange)] px-1.5 py-0.5">
              <Variable className="h-3 w-3" />
              {uniqueVars.length} 变量
            </span>
          )}
          <span>{lines} 行</span>
          <span>·</span>
          <span>{chars} 字符</span>
        </div>
      </div>
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-auto">
          <PromptCodeEditor value={value} onChange={onChange} placeholder={placeholder} />
        </div>
      )}
    </div>
  );
}


export const Route = createFileRoute("/prompt")({
  head: () => ({ meta: [{ title: "Prompt 工作台 · Claude Console" }] }),
  component: PromptWorkbenchPage,
});

type Content = { system: string; user: string };

function PromptWorkbenchPage() {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [selectedId, setSelectedId] = useState<string>("p1");
  const [contentMap, setContentMap] = useState<Record<string, Content>>({
    p1: { system: "", user: "" },
  });
  const [listOpen, setListOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [jinjaOpen, setJinjaOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [systemCollapsed, setSystemCollapsed] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState(false);

  const selectedPrompt = useMemo(() => {
    for (const f of folders) {
      const p = f.prompts.find((x) => x.id === selectedId);
      if (p) return p;
    }
    return null;
  }, [folders, selectedId]);

  const content = contentMap[selectedId] ?? { system: "", user: "" };
  const setContent = (next: Partial<Content>) =>
    setContentMap((m) => ({ ...m, [selectedId]: { ...content, ...next } }));

  function handleAddFolder(name: string) {
    setFolders((fs) => [...fs, { id: `f${Date.now()}`, name, prompts: [] }]);
  }

  function handleAddPrompt(d: { name: string; description: string; folderId: string }) {
    const np: PromptItem = {
      id: `p${Date.now()}`,
      name: d.name,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      owner: "yz",
    };
    setFolders((fs) =>
      fs.map((f) => (f.id === d.folderId ? { ...f, prompts: [...f.prompts, np] } : f)),
    );
    setContentMap((m) => ({ ...m, [np.id]: { system: "", user: "" } }));
    setSelectedId(np.id);
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
        f.prompts.find((x) => x.id === selectedId) ? { ...f, prompts: [...f.prompts, dup] } : f,
      ),
    );
    setContentMap((m) => ({ ...m, [dup.id]: { ...content } }));
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
              title="Prompt 列表"
            >
              <ListTree className="h-4 w-4" />
            </button>
            <button
              onClick={() => setNewOpen(true)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-[var(--console-orange)] hover:bg-accent"
              title="新建 Prompt"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {selectedPrompt && (
            <div className="flex-1 min-w-0">
              <PromptInfoBar
                prompt={selectedPrompt}
                onRename={renamePrompt}
                onShowHistory={() => setHistoryOpen(true)}
                onDuplicate={duplicatePrompt}
                onDelete={deletePrompt}
                onSave={() => {}}
                rightSlot={
                  <>
                    <button
                      onClick={() => setJinjaOpen(true)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background hover:bg-accent"
                      title="Jinja2 占位符参考"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setAssistantOpen(true)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background hover:bg-accent"
                      title="Prompt 写作助手"
                    >
                      <Sparkles className="h-4 w-4 text-[var(--console-orange)]" />
                    </button>
                  </>
                }
              />
            </div>
          )}
        </div>

        <PromptListPanel
          variant="prompt"
          open={listOpen}
          onClose={() => setListOpen(false)}
          folders={folders}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            if (!contentMap[id]) setContentMap((m) => ({ ...m, [id]: { system: "", user: "" } }));
          }}
          onAddFolder={handleAddFolder}
          onCreate={() => setNewOpen(true)}
        />

        <NewPromptDialog
          open={newOpen}
          folders={folders}
          onClose={() => setNewOpen(false)}
          onCreate={(d) => {
            handleAddPrompt(d);
            setNewOpen(false);
          }}
        />


        <div className="flex-1 min-h-0 flex flex-col gap-4 px-6 py-5 bg-muted/30 overflow-auto">
          <EditorCard
            label="System Prompt"
            hint="定义角色 / 任务 / 输出格式"
            value={content.system}
            onChange={(v) => setContent({ system: v })}
            placeholder={"# 角色\n你是一个专业的 {{角色}}\n\n## 任务\n- 第一步...\n- 第二步...\n\n## 输出格式\n使用 **Markdown** 输出结果"}
            collapsed={systemCollapsed}
            onToggle={() => setSystemCollapsed((v) => !v)}
          />
          <EditorCard
            label="User Prompt"
            hint="本轮用户输入，可使用 {{变量}}"
            value={content.user}
            onChange={(v) => setContent({ user: v })}
            placeholder={"请帮我处理以下内容：{{输入}}"}
            collapsed={userCollapsed}
            onToggle={() => setUserCollapsed((v) => !v)}
          />
        </div>
      </div>

      <RightDrawer
        open={historyOpen}
        title="版本历史"
        onClose={() => setHistoryOpen(false)}
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
        open={jinjaOpen}
        title="Jinja2 占位符参考"
        onClose={() => setJinjaOpen(false)}
        width={420}
      >
        <JinjaReference />
      </RightDrawer>

      <RightDrawer
        open={assistantOpen}
        title="Prompt 写作助手"
        onClose={() => setAssistantOpen(false)}
        width={460}
      >
        <PromptAssistant />
      </RightDrawer>
    </div>
  );
}
