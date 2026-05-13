import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Folder as FolderIcon,
  FileText,
  Bot,
  Workflow,
} from "lucide-react";
import type { Folder } from "./types";
import { LeftDrawer } from "./LeftDrawer";

type Variant = "agent" | "prompt";

const VARIANT = {
  agent: {
    title: "Agent 任务",
    subtitle: "Agent Orchestration",
    folderIcon: Workflow,
    itemIcon: Bot,
    accent: "text-violet-600",
    accentBg: "bg-violet-500/10",
    activeBg: "bg-violet-500/10",
    chip: "AGT",
    // 标识风格：尖括号 + 单行小写
    formatName: (n: string) => `<agent:${n}>`,
    nameClass: "font-mono text-violet-700 dark:text-violet-300",
  },
  prompt: {
    title: "Prompt 列表",
    subtitle: "Prompt Workbench",
    folderIcon: FolderIcon,
    itemIcon: FileText,
    accent: "text-[var(--console-orange)]",
    accentBg: "bg-[var(--console-orange)]/10",
    activeBg: "bg-[var(--console-active)]",
    chip: "PRM",
    // 标识风格：斜杠路径
    formatName: (n: string) => `prompt / ${n}`,
    nameClass: "font-medium text-foreground",
  },
} as const;

export function PromptListPanel({
  open,
  onClose,
  folders,
  selectedId,
  onSelect,
  onAddFolder,
  variant = "prompt",
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddFolder: (name: string) => void;
  variant?: Variant;
}) {
  const v = VARIANT[variant];
  const FolderIco = v.folderIcon;
  const ItemIco = v.itemIcon;

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(folders.map((f) => [f.id, true])),
  );
  const [newFolderName, setNewFolderName] = useState<string | null>(null);

  return (
    <LeftDrawer
      open={open}
      onClose={onClose}
      width={340}
      title={
        <>
          <span
            className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold ${v.accent} ${v.accentBg}`}
          >
            {v.chip}
          </span>
          <span>{v.title}</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            · {v.subtitle}
          </span>
        </>
      }
      headerExtra={
        <button
          onClick={() => setNewFolderName("")}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
        >
          <FolderPlus className="h-3.5 w-3.5" /> 新建文件夹
        </button>
      }
    >
      {newFolderName !== null && (
        <div className="px-1 py-1.5">
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => {
              if (newFolderName.trim()) onAddFolder(newFolderName.trim());
              setNewFolderName(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (newFolderName.trim()) onAddFolder(newFolderName.trim());
                setNewFolderName(null);
              }
              if (e.key === "Escape") setNewFolderName(null);
            }}
            placeholder="文件夹名称"
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-[var(--console-orange)]"
          />
        </div>
      )}

      {folders.map((f) => {
        const isOpen = openMap[f.id] ?? true;
        return (
          <div key={f.id} className="mb-1">
            <button
              onClick={() => setOpenMap((m) => ({ ...m, [f.id]: !isOpen }))}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[13px] hover:bg-accent text-foreground"
            >
              {isOpen ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
              <FolderIco className={`h-3.5 w-3.5 ${v.accent}`} />
              <span className="font-medium">{f.name}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {f.prompts.length}
              </span>
            </button>
            {isOpen && (
              <div className="mt-0.5">
                {f.prompts.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelect(p.id);
                        onClose();
                      }}
                      className={`w-full text-left pl-8 pr-2 py-1.5 rounded-md hover:bg-accent flex flex-col gap-0.5 ${
                        active ? v.activeBg : ""
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ItemIco
                          className={`h-3 w-3 shrink-0 ${
                            active ? v.accent : "text-muted-foreground"
                          }`}
                        />
                        <span className={`text-[12.5px] truncate ${v.nameClass}`}>
                          {v.formatName(p.name)}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-muted-foreground pl-4.5 ml-1">
                        {p.updatedAt} · {p.owner}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </LeftDrawer>
  );
}
