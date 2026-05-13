import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

export function ImprovePromptDialog({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (suggestion: string) => void;
}) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = () => {
    setResult(
      `基于你的要求"${input}"，建议在 System Prompt 中：\n\n1. 增加角色定义，明确助手的身份与边界\n2. 在指令中添加输出格式约束（如字数 ≤ 15）\n3. 在用户问题处理流程中加入"先识别意图再回复"的步骤\n4. 增加 few-shot 示例 2-3 条\n\n请确认后点击"应用建议"，将自动追加到 System Prompt。`,
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--console-orange)]" />
            改善 Prompt
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              用自然语言描述你希望如何改善当前 Prompt
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例：让回答更精炼，控制在 15 字以内"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] min-h-[100px] resize-none"
            />
          </div>
          {result && (
            <div className="rounded-md border border-border bg-[var(--console-sidebar)] p-3 text-xs whitespace-pre-wrap leading-relaxed">
              {result}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded-md border border-border hover:bg-accent"
            >
              取消
            </button>
            {!result ? (
              <button
                disabled={!input.trim()}
                onClick={handleAnalyze}
                className="px-4 py-1.5 text-sm rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:opacity-90 disabled:opacity-40"
              >
                让大模型分析
              </button>
            ) : (
              <button
                onClick={() => {
                  onApply(result);
                  setResult(null);
                  setInput("");
                }}
                className="px-4 py-1.5 text-sm rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:opacity-90"
              >
                应用建议
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
