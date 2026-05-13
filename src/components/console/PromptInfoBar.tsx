import { useState, useRef, useEffect } from "react";
import { ChevronDown, History, Copy, Trash2, Edit3, Save } from "lucide-react";
import type { PromptItem } from "./types";

export function PromptInfoBar({
  prompt,
  onRename,
  onShowHistory,
  onDuplicate,
  onDelete,
  onSave,
  centerSlot,
  rightSlot,
}: {
  prompt: PromptItem;
  onRename: (newName: string) => void;
  onShowHistory: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSave: () => void;
  centerSlot?: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [tmpName, setTmpName] = useState(prompt.name);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setTmpName(prompt.name), [prompt.name]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative px-5 py-3 border-b border-border bg-background flex items-center gap-3">
      <div className="relative" ref={ref}>
        {renaming ? (
          <input
            autoFocus
            value={tmpName}
            onChange={(e) => setTmpName(e.target.value)}
            onBlur={() => {
              if (tmpName.trim()) onRename(tmpName.trim());
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (tmpName.trim()) onRename(tmpName.trim());
                setRenaming(false);
              }
              if (e.key === "Escape") setRenaming(false);
            }}
            className="text-[18px] font-semibold bg-transparent border-b border-[var(--console-orange)] outline-none"
          />
        ) : (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1 text-[18px] font-semibold tracking-tight"
          >
            {prompt.name}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        {menuOpen && (
          <div className="absolute left-0 top-full mt-1 z-30 w-44 rounded-md border border-border bg-background shadow-lg py-1 text-sm">
            {[
              { label: "重命名", icon: Edit3, action: () => { setRenaming(true); setMenuOpen(false); } },
              { label: "保存", icon: Save, action: () => { onSave(); setMenuOpen(false); } },
              { label: "查看版本历史", icon: History, action: () => { onShowHistory(); setMenuOpen(false); } },
              { label: "创建副本", icon: Copy, action: () => { onDuplicate(); setMenuOpen(false); } },
              { label: "删除", icon: Trash2, action: () => { onDelete(); setMenuOpen(false); }, danger: true },
            ].map((it) => (
              <button
                key={it.label}
                onClick={it.action}
                className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left ${
                  it.danger ? "text-destructive" : ""
                }`}
              >
                <it.icon className="h-3.5 w-3.5" />
                {it.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground">最近编辑：{prompt.updatedAt}</span>
      {centerSlot && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {centerSlot}
        </div>
      )}
    </div>
  );
}
