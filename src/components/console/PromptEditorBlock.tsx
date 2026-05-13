import { useEffect, useRef, useState } from "react";
import { Settings2, Wrench, Link2, Trash2, ChevronDown, Check } from "lucide-react";
import type { EditorBlock, Folder } from "./types";
import { ALL_MODELS, ALL_TOOLS } from "./types";

export function PromptEditorBlock({
  block,
  folders,
  index,
  removable,
  onChange,
  onRemove,
}: {
  block: EditorBlock;
  folders: Folder[];
  index: number;
  removable: boolean;
  onChange: (next: EditorBlock) => void;
  onRemove: () => void;
  onOpenModelPicker?: () => void;
  onOpenToolPicker?: () => void;
  onOpenMemoryPicker?: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<null | "link" | "model" | "tools">(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const allPrompts = folders.flatMap((f) => f.prompts);
  const linked = block.linkedPromptId
    ? allPrompts.find((p) => p.id === block.linkedPromptId)
    : null;
  const disabled = !!block.linkedPromptId;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggleTool(t: string) {
    const has = block.tools.includes(t);
    onChange({
      ...block,
      tools: has ? block.tools.filter((x) => x !== t) : [...block.tools, t],
    });
  }

  return (
    <div className="rounded-lg border border-border bg-background mb-4">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="text-sm font-medium">
          {index === 0 ? "主 Prompt" : `后处理 #${index}`}
        </div>
        {removable && (
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
            title="删除该步骤"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 工具条 */}
      <div ref={wrapRef} className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border text-xs">
        {/* 关联其他 Prompt */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "link" ? null : "link")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 hover:bg-accent"
          >
            <Link2 className="h-3 w-3" />
            {linked ? `关联：${linked.name}` : "关联 Prompt"}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {openMenu === "link" && (
            <div className="absolute left-0 top-full mt-1 z-20 w-64 rounded-md border border-border bg-background shadow-lg p-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  onChange({ ...block, linkedPromptId: null });
                  setOpenMenu(null);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between"
              >
                不关联 {!linked && <Check className="h-3 w-3 text-[var(--console-orange)]" />}
              </button>
              {allPrompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onChange({ ...block, linkedPromptId: p.id });
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between"
                >
                  <span className="truncate">{p.name}</span>
                  {linked?.id === p.id && <Check className="h-3 w-3 text-[var(--console-orange)] shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 模型 */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "model" ? null : "model")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 hover:bg-accent"
          >
            <Settings2 className="h-3 w-3" />
            {block.model}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {openMenu === "model" && (
            <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded-md border border-border bg-background shadow-lg p-2 max-h-60 overflow-y-auto">
              {ALL_MODELS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    onChange({ ...block, model: m });
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between"
                >
                  <span className="truncate">{m}</span>
                  {block.model === m && <Check className="h-3 w-3 text-[var(--console-orange)] shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 工具（多选） */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "tools" ? null : "tools")}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 hover:bg-accent"
          >
            <Wrench className="h-3 w-3" />
            {block.tools.length}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {openMenu === "tools" && (
            <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded-md border border-border bg-background shadow-lg p-2 max-h-60 overflow-y-auto">
              {ALL_TOOLS.map((t) => {
                const active = block.tools.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTool(t)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between"
                  >
                    <span className="truncate">{t}</span>
                    {active && <Check className="h-3 w-3 text-[var(--console-orange)] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* System Prompt */}
      <div className="px-4 py-3 border-b border-border">
        <div className="text-xs font-medium text-muted-foreground mb-1.5">
          System Prompt
        </div>
        <textarea
          disabled={disabled}
          value={block.systemPrompt}
          onChange={(e) => onChange({ ...block, systemPrompt: e.target.value })}
          placeholder="定义角色、语气或上下文（选填）"
          className="w-full text-sm bg-transparent outline-none resize-none min-h-[80px] placeholder:text-muted-foreground disabled:opacity-60"
        />
      </div>

      {/* User Prompt */}
      <div className="px-4 py-3">
        <div className="text-xs font-medium text-muted-foreground mb-1.5">
          User Prompt
        </div>
        <textarea
          disabled={disabled}
          value={block.userPrompt}
          onChange={(e) => onChange({ ...block, userPrompt: e.target.value })}
          placeholder="输入用户指令，可使用 {{变量}}"
          className="w-full text-sm bg-transparent outline-none resize-none min-h-[60px] placeholder:text-muted-foreground disabled:opacity-60"
        />
      </div>

      {disabled && (
        <div className="px-4 pb-3 text-[11px] text-muted-foreground">
          已关联其他 Prompt，当前编辑区为只读
        </div>
      )}

    </div>
  );
}
