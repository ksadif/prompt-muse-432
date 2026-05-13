import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sidebar } from "@/components/console/Sidebar";
import { PromptListPanel } from "@/components/console/PromptListPanel";
import { PromptInfoBar } from "@/components/console/PromptInfoBar";
import { NewPromptDialog } from "@/components/console/NewPromptDialog";
import { RightDrawer } from "@/components/console/RightDrawer";
import { initialFolders, versionHistory } from "@/components/console/mockData";
import type { Folder, PromptItem } from "@/components/console/types";
import { Plus, ListTree } from "lucide-react";

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
              />
            </div>
          )}
        </div>

        <PromptListPanel
          open={listOpen}
          onClose={() => setListOpen(false)}
          folders={folders}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            if (!contentMap[id]) setContentMap((m) => ({ ...m, [id]: { system: "", user: "" } }));
          }}
          onAddFolder={handleAddFolder}
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


        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 max-w-3xl w-full mx-auto">
          <div className="rounded-lg border border-border bg-background">
            <div className="px-4 py-2.5 border-b border-border text-sm font-medium">
              System Prompt
            </div>
            <textarea
              value={content.system}
              onChange={(e) => setContent({ system: e.target.value })}
              placeholder="定义角色、语气或上下文（选填）"
              className="w-full text-sm bg-transparent outline-none resize-none min-h-[200px] placeholder:text-muted-foreground p-4"
            />
          </div>

          <div className="rounded-lg border border-border bg-background">
            <div className="px-4 py-2.5 border-b border-border text-sm font-medium">
              User Prompt
            </div>
            <textarea
              value={content.user}
              onChange={(e) => setContent({ user: e.target.value })}
              placeholder="输入用户指令，可使用 {{变量}}"
              className="w-full text-sm bg-transparent outline-none resize-none min-h-[160px] placeholder:text-muted-foreground p-4"
            />
          </div>
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
    </div>
  );
}
