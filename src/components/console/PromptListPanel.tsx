import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, FolderPlus, Folder as FolderIcon, FileText, X } from "lucide-react";
import type { Folder } from "./types";

export function PromptListPanel({
  open,
  onClose,
  folders,
  selectedId,
  onSelect,
  onAddFolder,
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddFolder: (name: string) => void;
}) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(folders.map((f) => [f.id, true])),
  );
  const [newFolderName, setNewFolderName] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute left-3 top-12 z-40 w-[300px] max-h-[70vh] rounded-lg border border-border bg-background shadow-xl flex flex-col"
    >
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium">Prompt 列表</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setNewFolderName("")}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <FolderPlus className="h-3.5 w-3.5" /> 新建文件夹
          </button>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {newFolderName !== null && (
          <div className="px-3 py-1.5">
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
            <div key={f.id} className="mb-0.5">
              <button
                onClick={() => setOpenMap((m) => ({ ...m, [f.id]: !isOpen }))}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[13px] hover:bg-accent text-foreground"
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
                <FolderIcon className="h-3.5 w-3.5 text-[var(--console-orange)]" />
                <span className="font-medium">{f.name}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">{f.prompts.length}</span>
              </button>
              {isOpen && (
                <div>
                  {f.prompts.map((p) => {
                    const active = p.id === selectedId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelect(p.id);
                          onClose();
                        }}
                        className={`w-full text-left pl-9 pr-3 py-1.5 hover:bg-accent flex flex-col gap-0.5 ${
                          active ? "bg-[var(--console-active)]" : ""
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[12.5px] truncate">{p.name}</span>
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
      </div>
    </div>
  );
}
