import { useMemo, useState } from "react";
import { X, Search, Lock, Box, Bot, FileSpreadsheet, ChevronDown, ChevronRight, Folder as FolderIcon, FolderPlus, Check, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "./ConfirmDialog";
import type { Folder } from "./types";

type Variant = "agent" | "prompt" | "testset";

const VARIANT = {
  agent: {
    title: "Agent 列表",
    itemIcon: Bot,
    accent: "text-[var(--console-orange)]",
    activeBg: "bg-[var(--console-active)]",
    searchPlaceholder: "搜索 Agent",
    suffix: "Agent",
    onlyMineLabel: "只看我的 Agent",
  },
  prompt: {
    title: "Prompt 列表",
    itemIcon: Box,
    accent: "text-[var(--console-orange)]",
    activeBg: "bg-[var(--console-active)]",
    searchPlaceholder: "搜索 Prompt",
    suffix: "Prompt",
    onlyMineLabel: "只看我的 Prompt",
  },
  testset: {
    title: "测试集列表",
    itemIcon: FileSpreadsheet,
    accent: "text-[var(--console-orange)]",
    activeBg: "bg-[var(--console-active)]",
    searchPlaceholder: "搜索测试集",
    suffix: "测试集",
    onlyMineLabel: "只看我的测试集",
  },
} as const;

export function PromptListPanel({
  open,
  onClose,
  folders,
  selectedId,
  onSelect,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  variant = "prompt",
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddFolder?: (name: string) => void;
  onRenameFolder?: (id: string, name: string) => void;
  onDeleteFolder?: (id: string) => void;
  onCreate?: () => void;
  variant?: Variant;
}) {
  const v = VARIANT[variant];
  const ItemIco = v.itemIcon;
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const filteredFolders = useMemo(() => {
    return folders
      .map((f) => ({
        ...f,
        prompts: f.prompts.filter((p) => {
          if (onlyMine && p.owner !== "yz") return false;
          if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
          return true;
        }),
      }))
      .filter((f) => f.prompts.length > 0 || (!query && !onlyMine));
  }, [folders, query, onlyMine]);

  if (!open) return null;

  return (
    <>
      <div className="absolute inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="absolute left-0 top-0 z-50 h-full w-[380px] bg-background border-r border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold tracking-tight">{v.title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={v.searchPlaceholder}
              className="w-full rounded-md border border-border bg-muted/40 pl-9 pr-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] focus:bg-background"
            />
          </div>
        </div>

        {/* Toggle */}
        <div className="px-5 pb-3 flex items-center gap-2">
          <button
            onClick={() => setOnlyMine((s) => !s)}
            role="switch"
            aria-checked={onlyMine}
            className={`relative inline-flex h-4 w-7 rounded-full transition ${
              onlyMine ? "bg-[var(--console-cta)]" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition ${
                onlyMine ? "left-3.5" : "left-0.5"
              }`}
            />
          </button>
          <span className="text-[13px] text-muted-foreground">{v.onlyMineLabel}</span>
          {onAddFolder && (
            <button
              onClick={() => {
                setNewFolderName("");
                setAddingFolder(true);
              }}
              className="ml-auto inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              新建文件夹
            </button>
          )}
        </div>

        {addingFolder && (
          <div className="px-5 pb-2 flex items-center gap-2">
            <FolderIcon className={`h-3.5 w-3.5 ${v.accent}`} />
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const n = newFolderName.trim();
                  if (n && onAddFolder) onAddFolder(n);
                  setAddingFolder(false);
                } else if (e.key === "Escape") {
                  setAddingFolder(false);
                }
              }}
              placeholder="文件夹名称"
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:border-[var(--console-orange)]"
            />
            <button
              onClick={() => {
                const n = newFolderName.trim();
                if (n && onAddFolder) onAddFolder(n);
                setAddingFolder(false);
              }}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setAddingFolder(false)}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {filteredFolders.map((f) => {
            const isCollapsed = collapsed[f.id];
            return (
              <div key={f.id} className="mb-1 group/folder">
                <div className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[12.5px] text-muted-foreground hover:text-foreground rounded hover:bg-accent/40">
                  <button
                    onClick={() => setCollapsed((m) => ({ ...m, [f.id]: !isCollapsed }))}
                    className="flex-1 min-w-0 flex items-center gap-1.5 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    <FolderIcon className={`h-3.5 w-3.5 ${v.accent}`} />
                    <span className="font-medium truncate">{f.name}</span>
                    <span className="ml-auto text-[11px]">{f.prompts.length}</span>
                  </button>
                  {(onRenameFolder || onDeleteFolder) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-0.5 rounded opacity-0 group-hover/folder:opacity-100 data-[state=open]:opacity-100 hover:bg-accent text-muted-foreground hover:text-foreground"
                          aria-label="更多"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32 p-1">
                        {onRenameFolder && (
                          <DropdownMenuItem
                            onClick={() => {
                              const next = window.prompt("重命名文件夹", f.name);
                              if (next && next.trim() && next.trim() !== f.name) onRenameFolder(f.id, next.trim());
                            }}
                            className="text-xs py-1 px-2 cursor-pointer"
                          >
                            <Pencil className="h-3 w-3 mr-1.5" /> 重命名
                          </DropdownMenuItem>
                        )}
                        {onDeleteFolder && (
                          <DropdownMenuItem
                            onClick={() => {
                              if (window.confirm(`确认删除文件夹「${f.name}」？文件夹内的内容也会被删除。`)) onDeleteFolder(f.id);
                            }}
                            className="text-xs py-1 px-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1.5" /> 删除
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {!isCollapsed && (
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
                          className={`w-full text-left pl-7 pr-3 py-2 rounded-md hover:bg-accent ${
                            active ? v.activeBg : ""
                          }`}
                        >
                          <div className="text-[13.5px] font-medium text-foreground truncate">
                            {p.name}
                            <span className="ml-1 text-muted-foreground/70 font-normal">
                              · {v.suffix}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <ItemIco className={`h-3 w-3 ${v.accent}`} />
                            <span>
                              {p.updatedAt} · {p.owner}
                            </span>
                            <Lock className="h-3 w-3 ml-0.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {filteredFolders.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">
              没有找到匹配的内容
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
