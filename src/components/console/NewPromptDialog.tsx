import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Folder } from "./types";

export function NewPromptDialog({
  open,
  folders,
  onClose,
  onCreate,
  variant = "agent",
}: {
  open: boolean;
  folders: Folder[];
  onClose: () => void;
  onCreate: (data: { name: string; description: string; folderId: string }) => void;
  variant?: "agent" | "prompt";
}) {
  const label = variant === "prompt" ? "Prompt" : "Agent";
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [folderId, setFolderId] = useState(folders[0]?.id ?? "");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新建 Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Agent 名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给你的 Agent 起个名字"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">描述</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="简要说明该 Agent 的用途"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] min-h-[72px] resize-none"
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
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded-md border border-border hover:bg-accent"
            >
              取消
            </button>
            <button
              disabled={!name.trim() || !folderId}
              onClick={() =>
                onCreate({ name: name.trim(), description: desc.trim(), folderId })
              }
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
