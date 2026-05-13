import { useMemo, useState } from "react";
import { X, Search, Lock, Box, Bot, Plus } from "lucide-react";
import type { Folder } from "./types";

type Variant = "agent" | "prompt";

const VARIANT = {
  agent: {
    title: "Agents",
    itemIcon: Bot,
    accent: "text-violet-600",
    activeBg: "bg-violet-500/8",
    createLabel: "Create New Agent",
    searchPlaceholder: "Search agents",
    suffix: "agent",
  },
  prompt: {
    title: "Prompts",
    itemIcon: Box,
    accent: "text-[var(--console-orange)]",
    activeBg: "bg-[var(--console-active)]",
    createLabel: "Create New Prompt",
    searchPlaceholder: "Search prompts",
    suffix: "Prompt",
  },
} as const;

export function PromptListPanel({
  open,
  onClose,
  folders,
  selectedId,
  onSelect,
  onCreate,
  variant = "prompt",
}: {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddFolder?: (name: string) => void;
  onCreate?: () => void;
  variant?: Variant;
}) {
  const v = VARIANT[variant];
  const ItemIco = v.itemIcon;
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const items = useMemo(() => {
    const all = folders.flatMap((f) =>
      f.prompts.map((p) => ({ ...p, folder: f.name })),
    );
    return all.filter((p) => {
      if (onlyMine && p.owner !== "yz") return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [folders, query, onlyMine]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <aside className="fixed left-0 top-0 z-50 h-screen w-[420px] bg-background border-r border-border shadow-2xl flex flex-col">
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
        <div className="px-5 pb-2 flex items-center gap-2">
          <button
            onClick={() => setOnlyMine((v) => !v)}
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
          <span className="text-[13px] text-muted-foreground">
            Only show my {variant === "agent" ? "agents" : "prompts"}
          </span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {items.map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => {
                  onSelect(p.id);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-md hover:bg-accent ${
                  active ? v.activeBg : ""
                }`}
              >
                <div className="text-[14px] font-medium text-foreground truncate">
                  {p.name}
                  <span className="ml-1 text-muted-foreground/70 font-normal">
                    · {v.suffix}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                  <ItemIco className={`h-3 w-3 ${v.accent}`} />
                  <span>{p.updatedAt} by {p.owner}</span>
                  <Lock className="h-3 w-3 ml-0.5" />
                </div>
              </button>
            );
          })}
          {items.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">
              没有找到匹配的内容
            </div>
          )}
        </div>

        {/* Create button */}
        {onCreate && (
          <div className="p-4 border-t border-border">
            <button
              onClick={() => {
                onCreate();
                onClose();
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--console-cta)] text-[var(--console-cta-foreground)] py-2.5 text-sm font-medium hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {v.createLabel}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
